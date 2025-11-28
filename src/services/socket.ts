import { io, Socket } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:5001'; // Adjust if your server runs on a different port

let socket: Socket | null = null;

export const initSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL);
        console.log('Socket initialized');
    }
    return socket;
};

export const joinRide = (rideId: string) => {
    if (socket) {
        socket.emit('join_ride', rideId);
    }
};

export const updateLocation = (rideId: string, location: { lat: number; lng: number }) => {
    if (socket) {
        socket.emit('update_location', { rideId, location });
    }
};

export const subscribeToLocationUpdates = (callback: (location: { lat: number; lng: number }) => void) => {
    if (socket) {
        socket.on('driver_location_updated', callback);
    }
};

export const unsubscribeFromLocationUpdates = () => {
    if (socket) {
        socket.off('driver_location_updated');
    }
};

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
};
