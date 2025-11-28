import { useEffect, useState } from 'react';
import { ArrowLeft, Navigation, MapPin, Clock } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import LiveMap from '../components/LiveMap';
import DriverTracker from '../components/DriverTracker';
import { rideApi, Ride } from '../services/rides';

export default function GPSTracking() {
  const { navigateTo, userRole, activeRideId } = useApp();
  const [ride, setRide] = useState<Ride | null>(null);

  useEffect(() => {
    if (activeRideId) {
      rideApi.getById(activeRideId).then(setRide).catch(console.error);
    }
  }, [activeRideId]);

  if (!activeRideId) {
    return (
      <div className="min-h-screen bg-white p-4 sm:p-6 flex flex-col items-center justify-center">
        <p className="text-lg font-semibold text-gray-600 mb-4">No active ride selected.</p>
        <Button onClick={() => navigateTo('dashboard')}>Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <button onClick={() => navigateTo('ride-details')} className="mb-6 flex items-center text-black hover:opacity-70 transition-opacity">
        <ArrowLeft size={24} className="mr-2" />
        <span className="font-medium">Back to Ride Details</span>
      </button>

      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <h1 className="text-3xl md:text-4xl font-bold text-black">
            {userRole === 'driver' ? 'Trip in Progress' : 'Live Tracking'}
          </h1>
          {ride && (
            <div className="flex items-center gap-2 text-sm font-medium bg-gray-100 px-3 py-1 rounded-full">
              <Clock size={16} />
              <span>ETA: Calculating...</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 space-y-6">
            {userRole === 'driver' ? (
              <div className="space-y-4">
                <DriverTracker rideId={activeRideId} />
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-800 flex items-start gap-3">
                  <Navigation className="shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-bold">You are broadcasting</p>
                    <p className="text-sm opacity-90">Keep this screen open to share your location with riders.</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <LiveMap rideId={activeRideId} />
                <div className="p-4 bg-green-50 border border-green-200 rounded-xl text-green-800 flex items-start gap-3">
                  <MapPin className="shrink-0 mt-1" size={20} />
                  <div>
                    <p className="font-bold">Live View</p>
                    <p className="text-sm opacity-90">Driver's location updates automatically.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="p-5 border-2 border-black rounded-2xl bg-white shadow-sm">
              <h3 className="font-bold text-lg mb-4 border-b pb-2">Trip Details</h3>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Destination</p>
                  <p className="font-semibold text-lg leading-tight">{ride?.destination.label || 'Loading...'}</p>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Vehicle</p>
                  <p className="font-medium">{ride?.vehicleId || 'Standard Ride'}</p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Distance</p>
                    <p className="font-bold">-- km</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Est. Time</p>
                    <p className="font-bold">-- min</p>
                  </div>
                </div>
              </div>
            </div>

            {userRole === 'driver' && (
              <div className="text-center text-gray-500 text-sm italic">
                Head to Ride Details to complete the trip.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
