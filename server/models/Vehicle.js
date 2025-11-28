const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    driver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    registrationNumber: {
        type: String,
        required: [true, 'Please add a registration number'],
        trim: true,
    },
    seatingLimit: {
        type: Number,
        required: [true, 'Please add a seating limit'],
        min: 1,
    },
    vehicleType: {
        type: String,
        required: [true, 'Please select a vehicle type'],
        enum: ['2-wheeler', '3-wheeler', '4-wheeler'],
    },
    make: {
        type: String,
        trim: true,
    },
    model: {
        type: String,
        trim: true,
    },
    color: {
        type: String,
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
