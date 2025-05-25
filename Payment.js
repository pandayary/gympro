const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    paymentMethod: {
        type: String,
        enum: ['card', 'upi', 'netbanking'],
        required: true
    },
    paymentDetails: {
        cardName: String,
        cardNumber: String,
        expiry: String,
        cvv: String,
        upiId: String,
        bank: String
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    },
    transactionId: String,
    items: [{
        id: String,
        name: String,
        price: Number,
        quantity: Number,
        image: String
    }]
}, {
    timestamps: true
});

module.exports = mongoose.model('Payment', PaymentSchema);