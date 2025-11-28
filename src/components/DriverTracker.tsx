import React, { useEffect, useState } from 'react';
import { initSocket, joinRide, updateLocation } from '../services/socket';

interface DriverTrackerProps {
    rideId: string;
}

const DriverTracker: React.FC<DriverTrackerProps> = ({ rideId }) => {
    const [isTracking, setIsTracking] = useState(false);
    const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [watchId, setWatchId] = useState<number | null>(null);

    useEffect(() => {
        initSocket();
        joinRide(rideId);
        
        return () => {
             // Cleanup socket on unmount if needed, though usually handled by socket service
        };
    }, [rideId]);

    useEffect(() => {
        if (isTracking) {
            if (!navigator.geolocation) {
                setError('Geolocation is not supported by your browser');
                setIsTracking(false);
                return;
            }

            const id = navigator.geolocation.watchPosition(
                (pos) => {
                    const newPos = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude
                    };
                    setPosition(newPos);
                    updateLocation(rideId, newPos);
                    setError(null);
                },
                (err) => {
                    console.error('Geolocation error:', err);
                    setError(`Error: ${err.message}`);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
            setWatchId(id);
        } else {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                setWatchId(null);
            }
        }

        return () => {
            if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
            }
        };
    }, [isTracking, rideId]);

    return (
        <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-semibold mb-2">Driver Live Tracker</h3>
            
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-md text-sm">
                    {error}
                </div>
            )}

            <div className="mb-4">
                <p className="text-sm text-gray-600">Current Status:</p>
                <div className="flex items-center gap-2 mt-1">
                    <div className={`w-3 h-3 rounded-full ${isTracking ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                    <span className="font-medium">{isTracking ? 'Broadcasting Location' : 'Not Tracking'}</span>
                </div>
                
                {position && (
                    <div className="mt-2">
                         <p className="text-xs text-gray-500">Last Update:</p>
                         <p className="font-mono text-xs">Lat: {position.lat.toFixed(6)}, Lng: {position.lng.toFixed(6)}</p>
                    </div>
                )}
            </div>

            <button
                onClick={() => setIsTracking(!isTracking)}
                className={`w-full px-4 py-2 rounded-md text-white font-medium transition-colors ${
                    isTracking 
                        ? 'bg-red-500 hover:bg-red-600' 
                        : 'bg-green-600 hover:bg-green-700'
                }`}
            >
                {isTracking ? 'Stop Sharing Location' : 'Start Sharing Location'}
            </button>
        </div>
    );
};

export default DriverTracker;
