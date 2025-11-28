const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
    },
    phone: {
      type: String,
      trim: true,
    },
    emergencyName1: {
      type: String,
      trim: true,
    },
    emergencyPhone1: {
      type: String,
      trim: true,
    },
    emergencyName2: {
      type: String,
      trim: true,
    },
    emergencyPhone2: {
      type: String,
      trim: true,
    },
    emergencyName3: {
      type: String,
      trim: true,
    },
    emergencyPhone3: {
      type: String,
      trim: true,
    },
    role: {
      type: String,
      enum: ['driver', 'rider'],
      required: [true, 'Role is required'],
    },
    verificationStatus: {
      type: String,
      enum: ['unverified', 'pending', 'verified', 'rejected'],
      default: 'unverified',
    },
    licenseDetails: {
      name: String,
      licenseNumber: String,
      expiryDate: String,
      extractedData: Object,
    },
    profilePhoto: {
      type: String,
      default: '',
    },
    rating: {
      type: Number,
      default: 5.0,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    co2Saved: {
      type: Number,
      default: 0,
    },
    greenPoints: {
      type: Number,
      default: 0,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] for GeoJSON
        default: [0, 0],
      },
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

// Note: email index is automatically created by unique: true, no need for manual index

// GeoJSON 2dsphere index for driver location
userSchema.index({ location: '2dsphere' });

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = bcrypt.genSaltSync(10);
  this.password = bcrypt.hashSync(this.password, salt);
  next();
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compareSync(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const user = this.toObject();
  delete user.password;
  return user;
};

module.exports = mongoose.model('User', userSchema);
