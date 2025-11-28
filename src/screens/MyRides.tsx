import { useEffect, useState } from 'react';
import { ArrowLeft, Users, Clock, Car, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Card from '../components/Card';
import { rideApi, Ride } from '../services/rides';
import { calculateRideDetails, RideDetails as RideMetrics } from '../utils/rideCalculations';

export default function MyRides() {
  const { navigateTo, userRole, userName, userId, setActiveRideId, vehicles, rideVehicles } = useApp();
  const isDriver = userRole === 'driver';
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rideMetrics, setRideMetrics] = useState<Record<string, RideMetrics>>({});

  useEffect(() => {
    if (!userName && !userId) {
      setRides([]);
      setLoading(false);
      return;
    }
    const params = isDriver
      ? (userId ? { driverId: userId } : { driver: userName })
      : (userId ? { participantId: userId } : { participant: userName });
    const fetchRides = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await rideApi.list(params);
        setRides(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load rides.');
      } finally {
        setLoading(false);
      }
    };
    fetchRides();
  }, [isDriver, userName, userId]);

  // Filter rides for riders - check if THIS user has approved/pending requests
  const confirmedRides = !isDriver ? rides.filter(ride => {
    const myRequest = ride.requests?.find(req =>
      req.name === userName ||
      req.rider?.name === userName ||
      (userId && req.rider?.id === userId)
    );
    const isParticipant = ride.participants?.some(p =>
      p.name === userName ||
      p.rider?.name === userName ||
      (userId && p.rider?.id === userId)
    );
    return myRequest?.status === 'Approved' || isParticipant;
  }) : [];

  const pendingRides = !isDriver ? rides.filter(ride => {
    const myRequest = ride.requests?.find(req =>
      req.name === userName ||
      req.rider?.name === userName ||
      (userId && req.rider?.id === userId)
    );
    return myRequest && (myRequest.status === 'Pending' || myRequest.status === 'Rejected' || myRequest.status === 'PaymentPending');
  }) : [];

  // Check for newly approved requests to show notification
  useEffect(() => {
    if (isDriver || loading) return;

    const approved = rides.filter(ride =>
      ride.requests?.some(req => req.status === 'Approved')
    );

    if (approved.length > 0) {
      // In a real app, we would show a toast here
      // For now, the UI separation serves as the notification
    }
  }, [rides, isDriver, loading]);

  // Calculate ride metrics for price fallback
  useEffect(() => {
    if (isDriver || rides.length === 0) return;

    rides.forEach(ride => {
      // Only calculate if we don't already have metrics for this ride
      if (!rideMetrics[ride._id]) {
        calculateRideDetails(
          ride.start.coordinates.lat,
          ride.start.coordinates.lng,
          ride.destination.coordinates.lat,
          ride.destination.coordinates.lng
        ).then(metrics => {
          setRideMetrics(prev => ({
            ...prev,
            [ride._id]: metrics
          }));
        }).catch(err => {
          console.error(`Failed to calculate metrics for ride ${ride._id}:`, err);
        });
      }
    });
  }, [rides, isDriver, rideMetrics]);

  const renderRideCard = (ride: Ride) => {
    const highlightStatus = ride.status === 'Active' || ride.status === 'Confirmed';
    const riderCount = ride.requests?.filter((r) => r.status === 'Approved').length ?? 0;
    const pendingCount = ride.requests?.filter((r) => r.status === 'Pending').length ?? 0;
    const vehicleId = rideVehicles[ride._id];
    const vehicle = ride.vehicle || (vehicleId ? vehicles.find(v => v._id === vehicleId) : null);

    const handleNavigateToRide = () => {
      setActiveRideId(ride._id);
      navigateTo('ride-details');
    };

    // For riders, check their specific request status and get price
    // Use userId first (like RideDetails does), then fall back to userName
    const myRequest = !isDriver ? ride.requests?.find(r => (userId && r.rider?.id === userId) || r.name === userName || r.rider?.name === userName) : null;
    const myParticipant = !isDriver ? ride.participants?.find(p => (userId && p.rider?.id === userId) || p.name === userName || p.rider?.name === userName) : null;
    const myStatus = myRequest?.status;

    // Get price from finalCost or fallback to calculated metrics
    // Treat 0 as invalid (use calculated cost instead)
    const finalCost = myRequest?.finalCost || myParticipant?.finalCost;
    const calculatedCost = rideMetrics[ride._id]?.cost;
    const myPrice = (finalCost !== undefined && finalCost > 0) ? finalCost : calculatedCost;

    return (
      <Card key={ride._id} onClick={handleNavigateToRide}>
        {isDriver && pendingCount > 0 && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-yellow-100 px-3 py-2 text-sm font-bold text-yellow-800 border border-yellow-200">
            <div className="h-2 w-2 rounded-full bg-yellow-600 animate-pulse" />
            {pendingCount} new request{pendingCount !== 1 ? 's' : ''} - Tap to review
          </div>
        )}

        {!isDriver && myStatus === 'Approved' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-green-100 px-3 py-2 text-sm font-bold text-green-800 border border-green-200">
            <div className="h-2 w-2 rounded-full bg-green-600" />
            Ride Confirmed! Pack your bags.
          </div>
        )}

        {!isDriver && myStatus === 'PaymentPending' && (
          <div className="mb-4 flex items-center gap-2 rounded-xl bg-orange-100 px-3 py-2 text-sm font-bold text-orange-800 border border-orange-200">
            <div className="h-2 w-2 rounded-full bg-orange-600 animate-pulse" />
            Payment Required! Tap to pay and confirm.
          </div>
        )}

        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-black">
              {ride.start.label} → {ride.destination.label}
            </h3>
            <div className="flex items-center mt-2 text-sm text-gray-600">
              <Clock size={16} className="mr-1" />
              <span>
                {ride.date} at {ride.time}
              </span>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span
              className={`px-3 py-1 text-sm font-medium border-2 border-black rounded-full ${highlightStatus ? 'bg-black text-white' : 'bg-white text-black'
                }`}
            >
              {ride.status}
            </span>
            {!isDriver && myPrice !== undefined && (
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Cost</p>
                <p className="text-lg font-bold text-black">₹{myPrice}</p>
              </div>
            )}
            {!isDriver && (
              <>
                {ride.status === 'Completed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Delete this ride from your history?')) {
                        rideApi.delete(ride._id).then(() => {
                          setRides(prev => prev.filter(r => r._id !== ride._id));
                        });
                      }
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                    title="Delete from history"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
                {(myStatus === 'Pending' || myStatus === 'Rejected') && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm(myStatus === 'Pending' ? 'Cancel this request?' : 'Remove this rejected request?')) {
                        rideApi.deleteRequest(ride._id).then(() => {
                          setRides(prev => prev.filter(r => r._id !== ride._id));
                        });
                      }
                    }}
                    className="px-3 py-1 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    {myStatus === 'Pending' ? 'Cancel Request' : 'Remove'}
                  </button>
                )}
                {myStatus === 'PaymentPending' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateToRide();
                    }}
                    className="px-3 py-1 text-xs font-bold text-white bg-orange-500 border border-orange-600 rounded-lg hover:bg-orange-600 transition-colors"
                  >
                    Pay Now
                  </button>
                )}
                {myStatus === 'Approved' && ride.status !== 'Completed' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm('Are you sure you want to cancel your booking?')) {
                        rideApi.cancelBooking(ride._id).then(() => {
                          setRides(prev => prev.filter(r => r._id !== ride._id));
                        });
                      }
                    }}
                    className="px-3 py-1 text-xs font-bold text-red-600 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                  >
                    Cancel Ride
                  </button>
                )}
              </>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center">
            <Users size={20} className="text-black mr-2" />
            {isDriver ? (
              <span className="font-medium">
                {riderCount} rider{riderCount !== 1 ? 's' : ''} joined
              </span>
            ) : (
              <div className="text-sm">
                <p className="font-semibold text-black">Driver: {ride.driver.name}</p>
                <p className="text-gray-600">
                  Seats left: {Math.max(ride.seats.available, 0)} / {ride.seats.total}
                </p>
              </div>
            )}
          </div>

          {vehicle && (
            <div className="flex items-start pt-2 border-t border-gray-200">
              <Car size={20} className="text-black mr-2 mt-0.5" />
              <div className="text-sm">
                <p className="font-semibold text-black">Vehicle Details</p>
                <p className="text-gray-600">
                  {vehicle.registrationNumber} • {'type' in vehicle ? (vehicle as any).type : (vehicle as any).vehicleType}
                </p>
                {vehicle.make && vehicle.model && (
                  <p className="text-gray-600">
                    {vehicle.make} {vehicle.model}
                  </p>
                )}
                {vehicle.color && (
                  <p className="text-gray-600">Color: {vehicle.color}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <button onClick={() => navigateTo('dashboard')} className="mb-8 flex items-center text-black hover:opacity-70">
        <ArrowLeft size={24} className="mr-2" />
        Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        {isDriver && rides.reduce((acc, ride) => acc + (ride.requests?.filter(r => r.status === 'Pending').length || 0), 0) > 0 && (
          <div className="mb-8 rounded-2xl bg-black p-4 text-white shadow-lg animate-in fade-in slide-in-from-top-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                <Users size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold">New Ride Requests</p>
                <p className="text-sm text-white/80">
                  You have {rides.reduce((acc, ride) => acc + (ride.requests?.filter(r => r.status === 'Pending').length || 0), 0)} pending request(s) to review.
                </p>
              </div>
            </div>
          </div>
        )}

        <h1 className="text-4xl font-bold mb-8 text-black">My Rides</h1>

        {error && (
          <div className="mb-4 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center text-sm text-gray-600 font-semibold">
            Loading your rides...
          </div>
        ) : rides.length === 0 ? (
          <div className="rounded-2xl border-2 border-black p-6 text-center">
            <p className="text-lg font-semibold text-black mb-2">No rides yet</p>
            <p className="text-sm text-gray-600">
              {isDriver ? 'Create a ride to get started.' : 'Book a ride from the search screen and it will appear here.'}
            </p>
          </div>
        ) : isDriver ? (
          <div className="space-y-4">
            {rides.map(renderRideCard)}
          </div>
        ) : (
          <div className="space-y-8">
            {confirmedRides.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 text-green-700 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-green-600" />
                  Booked & Confirmed
                </h2>
                <div className="space-y-4">
                  {confirmedRides.map(renderRideCard)}
                </div>
              </section>
            )}

            {pendingRides.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold mb-4 text-gray-700 flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-yellow-500" />
                  Pending & Requests
                </h2>
                <div className="space-y-4">
                  {pendingRides.map(renderRideCard)}
                </div>
              </section>
            )}

            {confirmedRides.length === 0 && pendingRides.length === 0 && (
              <div className="rounded-2xl border-2 border-black p-6 text-center">
                <p className="text-lg font-semibold text-black mb-2">No active bookings</p>
                <p className="text-sm text-gray-600">
                  Book a ride from the search screen and it will appear here.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
