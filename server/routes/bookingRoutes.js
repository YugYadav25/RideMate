const express = require('express');
const router = express.Router();

// Import controllers
const { createBooking, getMyBookings, getBooking } = require('../controllers/bookingController');

// Import middleware
const { authMiddleware, riderMiddleware } = require('../middleware/authMiddleware');

// Booking routes
router.post('/', authMiddleware, riderMiddleware, createBooking);
router.get('/me', authMiddleware, getMyBookings);
router.get('/:id', authMiddleware, getBooking);

module.exports = router;

