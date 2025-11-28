const Booking = require('../models/Booking');
const Ride = require('../models/Ride');
const { validateBookingInput } = require('../utils/validate');

// @desc    Create a new booking
// @route   POST /api/bookings
// @access  Private (Rider only)
const createBooking = async (req, res, next) => {
  try {
    console.log(`[Booking] Create request by user: ${req.user.id}`);
    const validation = validateBookingInput(req.body);
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: validation.errors.join(', '),
      });
    }

    const { ride: rideId, seatsBooked } = req.body;

    // Check if ride exists
    const ride = await Ride.findById(rideId);
    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Check if ride is active
    if (!ride.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Ride is not active',
      });
    }

    // Check if enough seats available
    if (ride.seatsAvailable < seatsBooked) {
      return res.status(400).json({
        success: false,
        message: `Only ${ride.seatsAvailable} seat(s) available`,
      });
    }

    // Check if rider already booked this ride (prevent double booking)
    const existingBooking = await Booking.findOne({
      ride: rideId,
      rider: req.user.id,
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: 'You have already booked this ride',
      });
    }

    // Calculate total price
    const totalPrice = ride.price * seatsBooked;

    // Create booking
    const booking = await Booking.create({
      ride: rideId,
      rider: req.user.id,
      seatsBooked: parseInt(seatsBooked),
      totalPrice,
    });

    // Reduce seats available in ride
    ride.seatsAvailable -= parseInt(seatsBooked);
    await ride.save();

    const populatedBooking = await Booking.findById(booking._id)
      .populate('ride')
      .populate('rider', 'name email phone role');

    console.log(`[Booking] Created successfully: ${booking._id}`);

    res.status(201).json({
      success: true,
      data: populatedBooking,
    });
  } catch (error) {
    console.error(`[Booking] Create error:`, error);
    next(error);
  }
};

// @desc    Get all bookings for current user
// @route   GET /api/bookings/me
// @access  Private
const getMyBookings = async (req, res, next) => {
  try {
    // console.log(`[Booking] GetMyBookings request for user: ${req.user.id}`);
    const bookings = await Booking.find({ rider: req.user.id })
      .populate({
        path: 'ride',
        populate: {
          path: 'driver',
          select: 'name email phone role',
        },
      })
      .sort({ bookingDate: -1 });

    res.json({
      success: true,
      count: bookings.length,
      data: bookings,
    });
  } catch (error) {
    console.error(`[Booking] GetMyBookings error:`, error);
    next(error);
  }
};

// @desc    Get single booking
// @route   GET /api/bookings/:id
// @access  Private
const getBooking = async (req, res, next) => {
  try {
    // console.log(`[Booking] GetBooking request for ID: ${req.params.id}`);
    const booking = await Booking.findById(req.params.id)
      .populate({
        path: 'ride',
        populate: {
          path: 'driver',
          select: 'name email phone role',
        },
      })
      .populate('rider', 'name email phone role');

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found',
      });
    }

    // Check if user is authorized (rider or driver of the ride)
    const isRider = booking.rider._id.toString() === req.user.id;
    const isDriver = booking.ride.driver._id.toString() === req.user.id;

    if (!isRider && !isDriver) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this booking',
      });
    }

    res.json({
      success: true,
      data: booking,
    });
  } catch (error) {
    console.error(`[Booking] GetBooking error:`, error);
    next(error);
  }
};

module.exports = {
  createBooking,
  getMyBookings,
  getBooking,
};

