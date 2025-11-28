const mongoose = require('mongoose');

const rideSchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Driver is required'],
    },
    // Vehicle reference
    vehicle: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
    },
    // Driver's current location when creating the ride
    driverLocation: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] for GeoJSON
      },
    },
    from: {
      type: String,
      required: [true, 'From location is required'],
      trim: true,
    },
    to: {
      type: String,
      required: [true, 'To location is required'],
      trim: true,
    },
    startCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] for GeoJSON
        required: true,
      },
    },
    destCoordinates: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] for GeoJSON
        required: true,
      },
    },
    notes: {
      type: String,
      default: '',
    },
    requests: [{
      rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      rating: { type: Number, default: 5 },
      status: { type: String, enum: ['Approved', 'Pending', 'Rejected', 'PaymentPending'], default: 'Pending' },
      seatsRequested: { type: Number, default: 1, min: 1 },
      addons: {
        firstAid: { type: Boolean, default: false },
        doorToDoor: { type: Boolean, default: false },
      },
      addonCharges: { type: Number, default: 0 },
      finalCost: { type: Number, default: 0 },
      riderReview: {
        rating: Number,
        text: String,
      },
      driverReview: {
        rating: Number,
        text: String,
      },
      driverRated: { type: Boolean, default: false },
      riderRatedDriver: { type: Boolean, default: false },
      createdAt: { type: Date, default: Date.now },
    }],
    participants: [{
      rider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
      name: String,
      status: String,
      seatsBooked: { type: Number, default: 1 },
      addons: {
        firstAid: { type: Boolean, default: false },
        doorToDoor: { type: Boolean, default: false },
      },
      addonCharges: { type: Number, default: 0 },
      finalCost: { type: Number, default: 0 },
    }],
    date: {
      type: String,
      required: [true, 'Date is required'],
    },
    time: {
      type: String,
      required: [true, 'Time is required'],
    },
    duration: {
      type: Number,
      default: 2, // Default duration in hours
      min: [0.5, 'Duration must be at least 30 minutes'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price must be positive'],
    },
    basePrice: {
      type: Number,
      min: [0, 'Base price must be positive'],
    },
    weatherSurcharge: {
      type: Number,
      default: 0,
      min: [0, 'Weather surcharge must be positive'],
    },
    weatherData: {
      startWeather: {
        condition: String,
        isBad: { type: Boolean, default: false },
        temperature: Number,
        precipitation: Number,
        windSpeed: Number,
        visibility: Number,
        weatherCode: Number,
      },
      destWeather: {
        condition: String,
        isBad: { type: Boolean, default: false },
        temperature: Number,
        precipitation: Number,
        windSpeed: Number,
        visibility: Number,
        weatherCode: Number,
      },
      hasBadWeather: { type: Boolean, default: false },
    },
    seatsAvailable: {
      type: Number,
      required: [true, 'Seats available is required'],
      min: [0, 'Seats available cannot be negative'],
      default: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    rideStatus: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'started', 'completed'],
      default: 'pending',
    },
    startTime: {
      type: Date,
    },
    endTime: {
      type: Date,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for faster searches
rideSchema.index({ from: 1 });
rideSchema.index({ to: 1 });
rideSchema.index({ date: 1 });
rideSchema.index({ driver: 1 });
rideSchema.index({ isActive: 1 });
rideSchema.index({ from: 1, to: 1, date: 1 });

// GeoJSON 2dsphere indexes for location-based queries
rideSchema.index({ startCoordinates: '2dsphere' });
rideSchema.index({ destCoordinates: '2dsphere' });
rideSchema.index({ driverLocation: '2dsphere' });

module.exports = mongoose.model('Ride', rideSchema);

