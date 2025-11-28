const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    ride: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      required: [true, 'Ride is required'],
    },
    rider: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Rider is required'],
    },
    seatsBooked: {
      type: Number,
      required: [true, 'Seats booked is required'],
      min: [1, 'At least 1 seat must be booked'],
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total price is required'],
      min: [0, 'Total price must be positive'],
    },
    bookingDate: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Approved', 'Rejected', 'Cancelled', 'PaymentPending'],
      default: 'Pending',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster searches
bookingSchema.index({ ride: 1 });
bookingSchema.index({ rider: 1 });
bookingSchema.index({ bookingDate: -1 });
// Prevent double booking - same rider cannot book same ride twice
bookingSchema.index({ ride: 1, rider: 1 }, { unique: true });

module.exports = mongoose.model('Booking', bookingSchema);

