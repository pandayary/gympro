const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Season = require('../models/Season');

// Get all bookings
router.get('/', async(req, res) => {
    try {
        const bookings = await Booking.find().populate('seasonId');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user's bookings
router.get('/user/:userId', async(req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.params.userId }).populate('seasonId');
        res.json(bookings);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Create new booking
router.post('/', async(req, res) => {
    try {
        const season = await Season.findById(req.body.seasonId);
        if (!season) {
            return res.status(404).json({ message: 'Season not found' });
        }

        if (season.availableSlots <= 0) {
            return res.status(400).json({ message: 'No available slots for this season' });
        }

        const booking = new Booking({
            userId: req.body.userId,
            seasonId: req.body.seasonId,
            amount: season.price
        });

        // Update available slots
        season.availableSlots -= 1;
        await season.save();

        const newBooking = await booking.save();
        res.status(201).json(newBooking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update booking status
router.patch('/:id', async(req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        if (req.body.status) {
            booking.status = req.body.status;
        }
        if (req.body.paymentStatus) {
            booking.paymentStatus = req.body.paymentStatus;
        }

        const updatedBooking = await booking.save();
        res.json(updatedBooking);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Cancel booking
router.delete('/:id', async(req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);
        if (!booking) {
            return res.status(404).json({ message: 'Booking not found' });
        }

        // Update available slots in season
        const season = await Season.findById(booking.seasonId);
        if (season) {
            season.availableSlots += 1;
            await season.save();
        }

        await booking.remove();
        res.json({ message: 'Booking cancelled' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;