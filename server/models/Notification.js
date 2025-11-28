const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Receiver ID is required'],
      index: true,
    },
    type: {
      type: String,
      enum: [
        'ride_request',
        'request_accepted',
        'request_rejected',
        'request_cancelled',
        'ride_started',
        'ride_completed',
        'ride_booked',
        'ride_confirmed',
        'payment_required',
      ],
      required: [true, 'Notification type is required'],
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
    },
    rideId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ride',
      index: true,
    },
    requestId: {
      type: String,
    },
    isRead: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster queries
notificationSchema.index({ receiverId: 1, isRead: 1 });
notificationSchema.index({ receiverId: 1, timestamp: -1 });

module.exports = mongoose.model('Notification', notificationSchema);


