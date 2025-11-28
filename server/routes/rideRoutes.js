const express = require('express');
const router = express.Router();

// Import controllers
const {
  createRide,
  getRides,
  getRide,
  updateRide,
  deleteRide,
  addRequest,
  updateRequestStatus,
  findRideMatches,
  rateRide,
  deleteRequest,
  cancelBooking,
  startRide,
  completeRide,
  confirmPayment,
} = require('../controllers/rideController');

// Import middleware
const { authMiddleware, driverMiddleware } = require('../middleware/authMiddleware');

// Ride routes
router.route('/')
  .get(getRides)
  .post(authMiddleware, driverMiddleware, createRide);

router.route('/match')
  .post(findRideMatches);

router.route('/:id')
  .get(getRide)
  .put(authMiddleware, driverMiddleware, updateRide)
  .patch(authMiddleware, driverMiddleware, updateRide)
  .delete(authMiddleware, driverMiddleware, deleteRide);

router.route('/:id/requests')
  .post(authMiddleware, addRequest)
  .delete(authMiddleware, deleteRequest);

router.route('/:id/requests/:requestId')
  .patch(authMiddleware, driverMiddleware, updateRequestStatus);

router.route('/:id/rate')
  .post(authMiddleware, rateRide);

router.route('/:id/cancel')
  .post(authMiddleware, cancelBooking);

router.route('/:id/start')
  .post(authMiddleware, driverMiddleware, startRide);

router.route('/:id/complete')
  .post(authMiddleware, driverMiddleware, completeRide);

router.route('/:id/payment/confirm')
  .post(authMiddleware, confirmPayment);

module.exports = router;

