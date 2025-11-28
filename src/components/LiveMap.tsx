import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { initSocket, joinRide, subscribeToLocationUpdates, unsubscribeFromLocationUpdates } from '../services/socket';
import L from 'leaflet';

// Fix for default marker icon issue in Leaflet with Webpack/Vite
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LiveMapProps {
    rideId: string;
}

// Component to update map center when position changes
const MapUpdater = ({ position }: { position: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        map.flyTo(position, map.getZoom());
    }, [position, map]);
    return null;
};

const LiveMap: React.FC<LiveMapProps> = ({ rideId }) => {
    const [driverPosition, setDriverPosition] = useState<[number, number] | null>(null);
    const [riderPosition, setRiderPosition] = useState<[number, number] | null>(null);

    useEffect(() => {
        // Get rider's current position for context
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setRiderPosition([pos.coords.latitude, pos.coords.longitude]);
                },
                (err) => console.log('Error getting rider location:', err)
            );
        }

        initSocket();
        joinRide(rideId);

        subscribeToLocationUpdates((location) => {
            console.log('Received location update:', location);
            setDriverPosition([location.lat, location.lng]);
        });

        return () => {
            unsubscribeFromLocationUpdates();
        };
    }, [rideId]);

    const defaultCenter: [number, number] = riderPosition || [51.505, -0.09];

    return (
        <div className="h-[400px] w-full rounded-lg overflow-hidden shadow-lg border border-gray-200 relative">
            {!driverPosition && (
                <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/50 backdrop-blur-sm text-white">
                    <div className="text-center p-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                        <p className="font-semibold">Waiting for driver location...</p>
                        <p className="text-xs opacity-75">Map will update automatically</p>
                    </div>
                </div>
            )}

            <MapContainer
                center={driverPosition || defaultCenter}
                zoom={13}
                scrollWheelZoom={false}
                style={{ height: '100%', width: '100%' }}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {driverPosition && (
                    <>
                        <Marker position={driverPosition}>
                            <Popup>
                                Driver is here
                            </Popup>
                        </Marker>
                        <MapUpdater position={driverPosition} />
                    </>
                )}

                {riderPosition && (
                    <Marker position={riderPosition} opacity={0.6}>
                        <Popup>
                            You are here
                        </Popup>
                    </Marker>
                )}
            </MapContainer>
        </div>
    );
};

export default LiveMap;
