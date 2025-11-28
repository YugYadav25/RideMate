const mongoose = require('mongoose');
const Booking = require('./models/Booking');
const Ride = require('./models/Ride');
require('dotenv').config();

async function cleanupOrphanedBookings() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // Get all bookings
        const bookings = await Booking.find({});
        console.log(`Found ${bookings.length} total bookings`);

        let orphanedCount = 0;

        // Check each booking
        for (const booking of bookings) {
            const ride = await Ride.findById(booking.ride);

            if (!ride) {
                // Ride doesn't exist, delete booking
                await Booking.findByIdAndDelete(booking._id);
                console.log(`Deleted orphaned booking ${booking._id} - ride doesn't exist`);
                orphanedCount++;
                continue;
            }

            // Check if the booking's rider exists in the ride's requests or participants
            const hasRequest = ride.requests.some(req =>
                req.rider && req.rider.toString() === booking.rider.toString()
            );
            const hasParticipant = ride.participants.some(p =>
                p.rider && p.rider.toString() === booking.rider.toString()
            );

            if (!hasRequest && !hasParticipant) {
                // Booking exists but rider is not in requests or participants
                await Booking.findByIdAndDelete(booking._id);
                console.log(`Deleted orphaned booking ${booking._id} - rider not in ride`);
                orphanedCount++;
            }
        }

        console.log(`\nCleanup complete! Removed ${orphanedCount} orphaned bookings.`);
        process.exit(0);
    } catch (error) {
        console.error('Error during cleanup:', error);
        process.exit(1);
    }
}

cleanupOrphanedBookings();
