require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const connectDB = require('./config/db');
const User = require('./models/User');
const Ride = require('./models/Ride');
const Booking = require('./models/Booking');

const seedData = async () => {
  try {
    // Connect to database
    await connectDB();

    // Clear existing data
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Ride.deleteMany({});
    await Booking.deleteMany({});

    // Create demo drivers
    console.log('Creating demo drivers...');
    const driver1 = await User.create({
      name: 'John Driver',
      email: 'john.driver@ridemate.com',
      password: 'password123',
      phone: '+1234567890',
      role: 'driver',
      emergencyName1: 'Jane Driver',
      emergencyPhone1: '+1234567894',
      emergencyName2: 'Bob Driver',
      emergencyPhone2: '+1234567895',
      emergencyName3: 'Alice Driver',
      emergencyPhone3: '+1234567896',
    });

    const driver2 = await User.create({
      name: 'Sarah Driver',
      email: 'sarah.driver@ridemate.com',
      password: 'password123',
      phone: '+1234567891',
      role: 'driver',
      emergencyName1: 'Tom Driver',
      emergencyPhone1: '+1234567897',
      emergencyName2: 'Lisa Driver',
      emergencyPhone2: '+1234567898',
      emergencyName3: 'Mark Driver',
      emergencyPhone3: '+1234567899',
    });

    // Create demo riders
    console.log('Creating demo riders...');
    const rider1 = await User.create({
      name: 'Mike Rider',
      email: 'mike.rider@ridemate.com',
      password: 'password123',
      phone: '+1234567892',
      role: 'rider',
      emergencyName1: 'Priya Verma',
      emergencyPhone1: '+1 (555) 123-4567',
      emergencyName2: 'Michael Chen',
      emergencyPhone2: '+1 (555) 987-6543',
      emergencyName3: 'David Lee',
      emergencyPhone3: '+1 (555) 222-8899',
    });

    const rider2 = await User.create({
      name: 'Emma Rider',
      email: 'emma.rider@ridemate.com',
      password: 'password123',
      phone: '+1234567893',
      role: 'rider',
      emergencyName1: 'John Smith',
      emergencyPhone1: '+1 (555) 111-2222',
      emergencyName2: 'Sarah Johnson',
      emergencyPhone2: '+1 (555) 333-4444',
      emergencyName3: 'Chris Brown',
      emergencyPhone3: '+1 (555) 555-6666',
    });

    // Create demo rides
    console.log('Creating demo rides...');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfter = new Date(today);
    dayAfter.setDate(dayAfter.getDate() + 2);

    const ride1 = await Ride.create({
      driver: driver1._id,
      from: 'New York',
      to: 'Boston',
      date: tomorrow.toISOString().split('T')[0],
      time: '09:00',
      price: 50,
      seatsAvailable: 3,
      isActive: true,
    });

    const ride2 = await Ride.create({
      driver: driver1._id,
      from: 'Boston',
      to: 'New York',
      date: dayAfter.toISOString().split('T')[0],
      time: '14:00',
      price: 50,
      seatsAvailable: 2,
      isActive: true,
    });

    const ride3 = await Ride.create({
      driver: driver2._id,
      from: 'Los Angeles',
      to: 'San Francisco',
      date: tomorrow.toISOString().split('T')[0],
      time: '08:00',
      price: 75,
      seatsAvailable: 4,
      isActive: true,
    });

    const ride4 = await Ride.create({
      driver: driver2._id,
      from: 'Chicago',
      to: 'Detroit',
      date: dayAfter.toISOString().split('T')[0],
      time: '10:00',
      price: 40,
      seatsAvailable: 2,
      isActive: true,
    });

    const ride5 = await Ride.create({
      driver: driver1._id,
      from: 'Miami',
      to: 'Orlando',
      date: tomorrow.toISOString().split('T')[0],
      time: '12:00',
      price: 35,
      seatsAvailable: 1,
      isActive: true,
    });

    // Create sample bookings
    console.log('Creating sample bookings...');
    const booking1 = await Booking.create({
      ride: ride1._id,
      rider: rider1._id,
      seatsBooked: 1,
      totalPrice: 50,
    });

    // Update ride seats after booking
    ride1.seatsAvailable -= 1;
    await ride1.save();

    const booking2 = await Booking.create({
      ride: ride3._id,
      rider: rider1._id,
      seatsBooked: 2,
      totalPrice: 150,
    });

    ride3.seatsAvailable -= 2;
    await ride3.save();

    const booking3 = await Booking.create({
      ride: ride2._id,
      rider: rider2._id,
      seatsBooked: 1,
      totalPrice: 50,
    });

    ride2.seatsAvailable -= 1;
    await ride2.save();

    console.log('Seed data created successfully!');
    console.log('\n=== Summary ===');
    console.log(`Drivers: 2 (${driver1.name}, ${driver2.name})`);
    console.log(`Riders: 2 (${rider1.name}, ${rider2.name})`);
    console.log(`Rides: 5`);
    console.log(`Bookings: 3`);
    console.log('\nDemo credentials:');
    console.log('Driver 1: john.driver@ridemate.com / password123');
    console.log('Driver 2: sarah.driver@ridemate.com / password123');
    console.log('Rider 1: mike.rider@ridemate.com / password123');
    console.log('Rider 2: emma.rider@ridemate.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();

