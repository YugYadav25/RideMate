const cron = require('node-cron');
const Ride = require('../models/Ride');

const cleanupExpiredRides = () => {
    // Run every minute
    // Auto-delete disabled by user request
    // cron.schedule('* * * * *', async () => {
    //     try {
    //         console.log('Running auto-delete check for expired rides...');
    //         const rides = await Ride.find({ isActive: true });
    //         const now = new Date();

    //         for (const ride of rides) {
    //             // Parse ride date and time
    //             // Format: date "YYYY-MM-DD", time "HH:MM" or "h:mm A"
    //             let time = ride.time;
    //             if (ride.time.includes('AM') || ride.time.includes('PM')) {
    //                 const [timePart, modifier] = ride.time.split(' ');
    //                 let [hours, minutes] = timePart.split(':').map(Number);
    //                 if (modifier === 'PM' && hours < 12) hours += 12;
    //                 if (modifier === 'AM' && hours === 12) hours = 0;
    //                 time = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    //             }

    //             const rideDateTimeStr = `${ride.date}T${time}:00`;
    //             const rideStart = new Date(rideDateTimeStr);

    //             // If date parsing fails, skip
    //             if (isNaN(rideStart.getTime())) {
    //                 console.error(`Invalid date format for ride ${ride._id}: ${rideDateTimeStr} (Original: ${ride.time})`);
    //                 continue;
    //             }

    //             // Calculate end time
    //             const durationHours = ride.duration || 2;
    //             const rideEnd = new Date(rideStart.getTime() + durationHours * 60 * 60 * 1000);

    //             if (now > rideEnd) {
    //                 console.log(`Ride ${ride._id} has expired. Ended at ${rideEnd.toISOString()} (Deletion disabled)`);
    //                 // await Ride.findByIdAndDelete(ride._id);
    //             }
    //         }
    //     } catch (error) {
    //         console.error('Error in auto-delete cron job:', error);
    //     }
    // });
};

module.exports = cleanupExpiredRides;
