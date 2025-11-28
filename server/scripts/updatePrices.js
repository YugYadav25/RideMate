const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const { haversineDistanceKm } = require('../utils/distance');

// Load env vars
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Pricing Constants (from src/utils/rideCalculations.ts)
const FUEL_PRICE_PER_LITER = 100;
const FUEL_EFFICIENCY_KM_PER_LITER = 15;
const WEAR_TEAR_COST_PER_KM = 5;
const DRIVER_TIME_RATE_PER_MIN = 2;
const PROFIT_MARGIN = 0.20;
const PLATFORM_FEE_RATE = 0.10;
const MIN_FARE_PER_RIDER = 50;
const LONG_TRIP_THRESHOLD_KM = 500;
const REDUCED_PROFIT_MARGIN = 0.10;

const calculatePricePerRider = (distanceKm, durationMinutes, seats = 1) => {
    const d = distanceKm;
    const t = durationMinutes;
    const n = Math.max(1, seats);

    // Fuel cost
    const fuelCost = (d / FUEL_EFFICIENCY_KM_PER_LITER) * FUEL_PRICE_PER_LITER;

    // Wear-and-tear cost
    const wearCost = d * WEAR_TEAR_COST_PER_KM;

    // Driver time compensation
    const timeCost = t * DRIVER_TIME_RATE_PER_MIN;

    // Operating cost
    const operatingCost = fuelCost + wearCost + timeCost;

    // Driver profit
    let profitMargin = PROFIT_MARGIN;
    if (d > LONG_TRIP_THRESHOLD_KM) {
        profitMargin = REDUCED_PROFIT_MARGIN;
    }
    const profit = operatingCost * profitMargin;

    // Driver total compensation
    const driverTotal = operatingCost + profit;

    // App fee
    const appFee = driverTotal * PLATFORM_FEE_RATE;

    // Total trip cost
    const totalCost = driverTotal + appFee;

    // Price per rider
    let pricePerRider = totalCost / n;
    if (pricePerRider < MIN_FARE_PER_RIDER) {
        pricePerRider = MIN_FARE_PER_RIDER;
    }

    return Number(pricePerRider.toFixed(2));
};

const updatePrices = async () => {
    await connectDB();

    try {
        const rides = await Ride.find({});
        console.log(`Found ${rides.length} rides to update.`);

        for (const ride of rides) {
            if (!ride.startCoordinates || !ride.destCoordinates) {
                console.log(`Skipping ride ${ride._id}: Missing coordinates`);
                continue;
            }

            const start = {
                lat: ride.startCoordinates.coordinates[1],
                lng: ride.startCoordinates.coordinates[0]
            };
            const dest = {
                lat: ride.destCoordinates.coordinates[1],
                lng: ride.destCoordinates.coordinates[0]
            };

            const distanceKm = haversineDistanceKm(start, dest);
            const durationMinutes = ride.duration * 60; // duration is in hours

            const bookedSeats = ride.participants ? ride.participants.reduce((sum, p) => sum + (p.seatsBooked || 1), 0) : 0;
            const totalSeats = (ride.seatsAvailable || 0) + bookedSeats;
            const seatsForCalc = Math.max(1, totalSeats);

            const newPricePerRider = calculatePricePerRider(distanceKm, durationMinutes, seatsForCalc);

            console.log(`Ride ${ride._id}: Dist=${distanceKm.toFixed(2)}km, Dur=${durationMinutes}min, Seats=${seatsForCalc} -> Old Price: ${ride.price}, New Price: ${newPricePerRider}`);

            // Update Ride
            ride.price = newPricePerRider;
            await ride.save();

            // Update Bookings
            const bookings = await Booking.find({ ride: ride._id });
            for (const booking of bookings) {
                const oldTotalPrice = booking.totalPrice;
                const newTotalPrice = newPricePerRider * booking.seatsBooked;

                booking.totalPrice = newTotalPrice;
                await booking.save();

                console.log(`  Booking ${booking._id}: Seats=${booking.seatsBooked} -> Old Total: ${oldTotalPrice}, New Total: ${newTotalPrice}`);
            }

            // Update Requests (embedded in Ride)
            if (ride.requests && ride.requests.length > 0) {
                let requestsUpdated = false;
                for (const req of ride.requests) {
                    const oldFinalCost = req.finalCost;
                    const newFinalCost = newPricePerRider * (req.seatsRequested || 1);
                    const newTotalWithAddons = newFinalCost + (req.addonCharges || 0);

                    if (req.finalCost !== newTotalWithAddons) {
                        req.finalCost = newTotalWithAddons;
                        requestsUpdated = true;
                        console.log(`  Request ${req._id}: Seats=${req.seatsRequested} -> Old Cost: ${oldFinalCost}, New Cost: ${newTotalWithAddons}`);
                    }
                }
                if (requestsUpdated) {
                    await ride.save();
                }
            }

            // Update Participants (embedded in Ride)
            if (ride.participants && ride.participants.length > 0) {
                let participantsUpdated = false;
                for (const part of ride.participants) {
                    const oldFinalCost = part.finalCost;
                    const newFinalCost = newPricePerRider * (part.seatsBooked || 1);
                    const newTotalWithAddons = newFinalCost + (part.addonCharges || 0);

                    if (part.finalCost !== newTotalWithAddons) {
                        part.finalCost = newTotalWithAddons;
                        participantsUpdated = true;
                        console.log(`  Participant ${part._id || part.name}: Seats=${part.seatsBooked} -> Old Cost: ${oldFinalCost}, New Cost: ${newTotalWithAddons}`);
                    }
                }
                if (participantsUpdated) {
                    await ride.save();
                }
            }
        }

        console.log('Pricing update complete.');
        process.exit(0);
    } catch (error) {
        console.error(`Error updating prices: ${error.message}`);
        process.exit(1);
    }
};

updatePrices();
