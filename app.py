from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
import os
from dotenv import load_dotenv
import logging
from werkzeug.security import generate_password_hash, check_password_hash
import jwt
from functools import wraps

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 'sqlite:///gym.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')  # Change this in production

db = SQLAlchemy(app)

# User Model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

# Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except:
            return jsonify({'error': 'Token is invalid'}), 401
        
        return f(current_user, *args, **kwargs)
    return decorated

# Models
class Season(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    price = db.Column(db.Float, nullable=False)
    duration = db.Column(db.Integer, nullable=False)  # in weeks
    start_date = db.Column(db.DateTime, nullable=False)
    end_date = db.Column(db.DateTime, nullable=False)
    capacity = db.Column(db.Integer, nullable=False)
    available_slots = db.Column(db.Integer, nullable=False)


class Booking(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.String(50), nullable=False)
    season_id = db.Column(db.Integer, db.ForeignKey('season.id'), nullable=False)
    booking_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')


class Payment(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    booking_id = db.Column(db.Integer, db.ForeignKey('booking.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    payment_date = db.Column(db.DateTime, default=datetime.utcnow)
    status = db.Column(db.String(20), default='pending')


# Routes
@app.route('/')
def index():
    return render_template('login.html')

@app.route('/api/register', methods=['POST'])
def register():
    logging.info("Received registration request")
    data = request.json
    
    if not all(k in data for k in ['email', 'password', 'name']):
        logging.warning("Missing required fields in registration request")
        return jsonify({'error': 'Missing required fields'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        logging.warning(f"Email {data['email']} already registered")
        return jsonify({'error': 'Email already registered'}), 400
    
    hashed_password = generate_password_hash(data['password'])
    new_user = User(
        email=data['email'],
        password=hashed_password,
        name=data['name']
    )
    
    try:
        db.session.add(new_user)
        db.session.commit()
        logging.info(f"User {data['email']} registered successfully")
        return jsonify({'message': 'User registered successfully'}), 201
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error registering user: {e}")
        return jsonify({'error': 'Error registering user'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    logging.info("Received login request")
    data = request.json
    
    if not all(k in data for k in ['email', 'password']):
        logging.warning("Missing email or password in login request")
        return jsonify({'error': 'Missing email or password'}), 400
    
    user = User.query.filter_by(email=data['email']).first()
    
    if not user or not check_password_hash(user.password, data['password']):
        logging.warning(f"Invalid login attempt for email: {data['email']}")
        return jsonify({'error': 'Invalid email or password'}), 401
    
    token = jwt.encode(
        {'user_id': user.id, 'exp': datetime.utcnow() + timedelta(days=1)},
        app.config['SECRET_KEY']
    )
    
    logging.info(f"User {data['email']} logged in successfully")
    return jsonify({
        'token': token,
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name
        }
    })

@app.route('/api/seasons', methods=['GET'])
def get_seasons():
    logging.info("Received GET request for /api/seasons")
    seasons = Season.query.all()
    logging.info(f"Returning {len(seasons)} seasons")
    return jsonify([
        {
            'id': season.id,
            'name': season.name,
            'description': season.description,
            'price': season.price,
            'duration': season.duration,
            'start_date': season.start_date.isoformat(),
            'end_date': season.end_date.isoformat(),
            'capacity': season.capacity,
            'available_slots': season.available_slots
        } for season in seasons
    ])


@app.route('/api/bookings', methods=['POST'])
def create_booking():
    logging.info("Received POST request for /api/bookings")
    data = request.json
    user_id = data.get('userId')
    season_id = data.get('seasonId')

    if not user_id or not season_id:
        logging.warning("Missing userId or seasonId in booking request")
        return jsonify({'error': 'Missing required fields'}), 400

    season = Season.query.get(season_id)
    if not season:
        logging.warning(f"Season with ID {season_id} not found")
        return jsonify({'error': 'Season not found'}), 404

    if season.available_slots <= 0:
        logging.warning(f"No available slots for season with ID {season_id}")
        return jsonify({'error': 'No available slots'}), 400

    booking = Booking(user_id=user_id, season_id=season_id)
    season.available_slots -= 1

    try:
        db.session.add(booking)
        db.session.commit()
        logging.info(f"Booking successful for user {user_id}, season {season_id}. Booking ID: {booking.id}")
        return jsonify({
            'message': 'Booking successful',
            'booking_id': booking.id
        }), 201
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error creating booking: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/api/payments', methods=['POST'])
def create_payment():
    logging.info("Received POST request for /api/payments")
    data = request.json
    booking_id = data.get('bookingId')
    amount = data.get('amount')

    if not booking_id or not amount:
        logging.warning("Missing bookingId or amount in payment request")
        return jsonify({'error': 'Missing required fields'}), 400

    booking = Booking.query.get(booking_id)
    if not booking:
        logging.warning(f"Booking with ID {booking_id} not found")
        return jsonify({'error': 'Booking not found'}), 404

    payment = Payment(booking_id=booking_id, amount=amount)

    try:
        db.session.add(payment)
        booking.status = 'confirmed'
        db.session.commit()
        logging.info(f"Payment successful for booking {booking_id}. Payment ID: {payment.id}")
        return jsonify({
            'message': 'Payment successful',
            'payment_id': payment.id
        }), 201
    except Exception as e:
        db.session.rollback()
        logging.error(f"Error creating payment: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000) 
