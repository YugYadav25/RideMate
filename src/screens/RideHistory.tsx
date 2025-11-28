import { useEffect, useState } from 'react';
import { ArrowLeft, MapPin, Calendar, Star, Users, Car, Trash2, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import { rideApi, Ride } from '../services/rides';
import Layout from '../components/Layout';

export default function RideHistory() {
  const { navigateTo, userName, userRole, userId } = useApp();
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRides = async () => {
      try {
        if (!userName && !userId) return;

        // Fetch completed rides where the user is either the driver or a participant
        const params: any = {
          isActive: 'false', // Completed rides
        };

        if (userRole === 'driver') {
          if (userId) {
            params.driverId = userId;
          } else {
            params.driver = userName;
          }
        } else {
          if (userId) {
            params.participantId = userId;
          } else {
            params.participant = userName;
          }
        }

        const data = await rideApi.list(params);
        setRides(data);
      } catch (err: any) {
        setError(err.message || 'Error fetching rides');
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, [userName, userRole, userId]);

  const handleDeleteRide = async (rideId: string) => {
    if (!window.confirm('Are you sure you want to delete this ride from your history?')) {
      return;
    }

    try {
      await rideApi.delete(rideId);
      setRides((prevRides) => prevRides.filter((r) => r._id !== rideId));
    } catch (err: any) {
      alert(err.message || 'Failed to delete ride');
    }
  };

  return (
    <Layout fullWidth className="bg-white">
      <div className="min-h-screen p-6">
        <button
          onClick={() => navigateTo('dashboard')}
          className="mb-8 flex items-center text-black hover:opacity-70"
          aria-label="Back to Dashboard"
        >
          <ArrowLeft size={24} className="mr-2" />
          Back to Dashboard
        </button>

        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-black">Ride History</h1>

          {loading && <p className="text-gray-600">Loading rides...</p>}
          {error && <p className="text-red-600">{error}</p>}

          {!loading && !error && rides.length === 0 && (
            <div className="text-center py-12 bg-gray-50 rounded-2xl border border-gray-200">
              <p className="text-gray-500">No completed rides found.</p>
            </div>
          )}

          <div className="space-y-4">
            {rides.map((ride) => (
              <Card key={ride._id}>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-start mb-2">
                      <MapPin size={20} className="text-black mr-2 mt-1" />
                      <div>
                        <p className="font-bold text-black">{ride.start?.label || '-'}</p>
                        <p className="text-sm text-gray-600">to</p>
                        <p className="font-bold text-black">{ride.destination?.label || '-'}</p>
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 text-sm font-medium bg-black text-white rounded-full">
                    Completed
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="flex items-center">
                    <Calendar size={16} className="text-black mr-2" />
                    <span className="text-sm text-gray-600">
                      {ride.date} {ride.time}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <Star size={16} className="text-yellow-500 mr-1" />
                    <span className="text-sm font-medium">{ride.driver?.rating?.toFixed(1)}</span>
                  </div>
                  <div className="flex items-center">
                    <Users size={16} className="text-black mr-1" />
                    <span className="text-sm">
                      {Math.max(ride.seats?.available ?? 0, 0)} of {ride.seats?.total ?? 0} seats
                    </span>
                  </div>
                  {ride.notes && (
                    <div className="flex items-center col-span-2">
                      <span className="text-sm text-gray-600 italic">"{ride.notes}"</span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t-2 border-gray-200">
                  <div className="flex justify-between items-center mb-2">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      Driver: <span className="font-bold text-black flex items-center gap-1">
                        {ride.driver?.name}
                        {ride.driver?.verificationStatus === 'verified' && (
                          <ShieldCheck size={14} className="text-green-600" fill="currentColor" stroke="white" />
                        )}
                      </span>
                    </p>
                    <span className="text-xs text-gray-500">
                      {new Date(ride.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {ride.vehicle && (
                    <div className="flex items-start pt-2 border-t border-gray-200">
                      <Car size={20} className="text-black mr-2 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-semibold text-black">Vehicle Details</p>
                        <p className="text-gray-600">
                          {ride.vehicle.registrationNumber} • {ride.vehicle.type}
                        </p>
                        {ride.vehicle.make && ride.vehicle.model && (
                          <p className="text-gray-600">
                            {ride.vehicle.make} {ride.vehicle.model}
                          </p>
                        )}
                        {ride.vehicle.color && (
                          <p className="text-gray-600">Color: {ride.vehicle.color}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>


                {userRole === 'driver' && (
                  <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end">
                    <button
                      onClick={() => handleDeleteRide(ride._id)}
                      className="flex items-center text-red-600 hover:text-red-800 font-medium text-sm transition-colors"
                    >
                      <Trash2 size={16} className="mr-2" />
                      Delete Ride
                    </button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </div>
    </Layout >
  );
}
