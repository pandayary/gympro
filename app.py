from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Database configuration
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv(
    'DATABASE_URL', 'sqlite:///gym.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)


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
@app.route('/api/seasons', methods=['GET'])
def get_seasons():
    seasons = Season.query.all()
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
    data = request.json
    user_id = data.get('userId')
    season_id = data.get('seasonId')

    if not user_id or not season_id:
        return jsonify({'error': 'Missing required fields'}), 400

    season = Season.query.get(season_id)
    if not season:
        return jsonify({'error': 'Season not found'}), 404

    if season.available_slots <= 0:
        return jsonify({'error': 'No available slots'}), 400

    booking = Booking(user_id=user_id, season_id=season_id)
    season.available_slots -= 1

    try:
        db.session.add(booking)
        db.session.commit()
        return jsonify({
            'message': 'Booking successful',
            'booking_id': booking.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@app.route('/api/payments', methods=['POST'])
def create_payment():
    data = request.json
    booking_id = data.get('bookingId')
    amount = data.get('amount')

    if not booking_id or not amount:
        return jsonify({'error': 'Missing required fields'}), 400

    booking = Booking.query.get(booking_id)
    if not booking:
        return jsonify({'error': 'Booking not found'}), 404

    payment = Payment(booking_id=booking_id, amount=amount)

    try:
        db.session.add(payment)
        booking.status = 'confirmed'
        db.session.commit()
        return jsonify({
            'message': 'Payment successful',
            'payment_id': payment.id
        }), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000) 