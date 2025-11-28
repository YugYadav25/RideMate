const socketHandler = (io) => {
    io.on('connection', (socket) => {
        console.log('New client connected:', socket.id);

        // Join a specific ride room
        socket.on('join_ride', (rideId) => {
            socket.join(rideId);
            console.log(`Socket ${socket.id} joined ride: ${rideId}`);
        });

        // Driver sends location updates
        socket.on('update_location', (data) => {
            const { rideId, location } = data;
            // Broadcast to everyone in the room except the sender (driver)
            // or use io.to(rideId) to include driver if needed for confirmation
            socket.to(rideId).emit('driver_location_updated', location);
            console.log(`Location update for ride ${rideId}:`, location);
        });

        socket.on('disconnect', () => {
            console.log('Client disconnected:', socket.id);
        });
    });
};

module.exports = socketHandler;
