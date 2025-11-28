import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  MessageCircle,
  AlertTriangle,
  MapPin,
  Users,
  Star,
  PhoneCall,
  ShieldAlert,
  Send,
  X,
  Car,
  CheckCircle,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { clearRideChat } from '../utils/chatStorage';
import { rideApi, Ride, RideRequest } from '../services/rides';
import RiderProfileModal from '../components/RiderProfileModal';
import { calculateRideDetails, RideDetails as RideMetrics } from '../utils/rideCalculations';
import { generateRideTicketPDF } from '../utils/ticketPdf';

export default function RideDetails() {
  const {
    navigateTo,
    userRole,
    userId,
    userName,
    emergencyContacts,
    activeRideId,
    setRideSummaryInput,
  } = useApp();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [driverRatings, setDriverRatings] = useState<Record<string, number>>({});
  const [driverRatingLoading, setDriverRatingLoading] = useState<string | null>(null);
  const [driverRatingValue, setDriverRatingValue] = useState(0);
  const [showEmergencyPanel, setShowEmergencyPanel] = useState(false);
  const [showSOSConfirmation, setShowSOSConfirmation] = useState(false);
  const [emergencyType, setEmergencyType] = useState('medical');
  const [incidentNotes, setIncidentNotes] = useState('');
  const [locationStatus, setLocationStatus] = useState<'idle' | 'fetching' | 'ready' | 'error'>('idle');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchComplete, setDispatchComplete] = useState(false);
  const [rideCancelled, setRideCancelled] = useState(false);

  const [selectedRequest, setSelectedRequest] = useState<RideRequest | null>(null);
  const [rideMetrics, setRideMetrics] = useState<RideMetrics | null>(null);
  const [seatsRequested, setSeatsRequested] = useState(1);
  const [hasStartedRide, setHasStartedRide] = useState(false);

  useEffect(() => {
    if (!activeRideId) {
      setRide(null);
      setLoading(false);
      setLoadError(null);
      return;
    }

    let cancelled = false;

    // Function to fetch ride data
    const fetchRide = (isInitial = false) => {
      if (isInitial) {
        setLoading(true);
        setLoadError(null);
      }

      rideApi
        .getById(activeRideId)
        .then((data) => {
          if (!cancelled) {
            setRide(data);
          }
        })
        .catch((err) => {
          if (!cancelled && isInitial) {
            setLoadError(err instanceof Error ? err.message : 'Unable to load ride.');
          }
        })
        .finally(() => {
          if (!cancelled && isInitial) {
            setLoading(false);
          }
        });
    };

    // Initial fetch
    fetchRide(true);

    // Polling interval (every 5 seconds)
    const intervalId = setInterval(() => {
      fetchRide(false);
    }, 5000);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [activeRideId]);

  useEffect(() => {
    if (ride?.status === 'Completed') {
      clearRideChat(ride._id);
    }

    if (ride) {
      calculateRideDetails(
        ride.start.coordinates.lat,
        ride.start.coordinates.lng,
        ride.destination.coordinates.lat,
        ride.destination.coordinates.lng
      ).then(setRideMetrics).catch(console.error);
    }

    // Check if driver has another started ride
    if (userRole === 'driver' && userId && ride) {
      const checkForStartedRide = async () => {
        try {
          const myRides = await rideApi.list({ driverId: userId });
          const hasOtherStartedRide = myRides.some(r => r.rideStatus === 'started' && r._id !== ride._id);
          setHasStartedRide(hasOtherStartedRide);
        } catch (err) {
          console.error('Error checking for started rides:', err);
        }
      };
      checkForStartedRide();
    }
  }, [ride, userRole, userId]);

  const rideStatus = ride?.status ?? 'Pending';
  const approvedRequests =
    ride?.requests?.filter((request) => request.status === 'Approved') ?? [];
  const riderRequest = ride?.requests?.find(
    (req) => req.rider?.id === userId
  );
  const hasRatedDriver = riderRequest?.riderRatedDriver ?? false;
  useEffect(() => {
    if (!hasRatedDriver) {
      setDriverRatingValue(0);
    }
  }, [hasRatedDriver]);
  const trustedContacts = emergencyContacts.length
    ? emergencyContacts
    : [
      { name: 'Add a contact', phone: 'No phone' },
      { name: 'Add a contact', phone: 'No phone' },
      { name: 'Add a contact', phone: 'No phone' },
    ];
  const emergencyTypes = [
    { id: 'medical', label: 'Medical Emergency', desc: 'Health issue, injury, or medical distress' },
    { id: 'security', label: 'Security Threat', desc: 'Harassment, assault, or unsafe rider/driver' },
    { id: 'accident', label: 'Accident / Collision', desc: 'Vehicle damage or crash' },
    { id: 'other', label: 'Other / Unknown', desc: 'Any unusual situation needing help' },
  ];

  // Check if current user has already requested this ride
  const hasRequested = ride?.requests?.some(
    (req) => req.rider?.id === userId && req.status !== 'Rejected'
  );

  const handleRateDriver = async (rating: number) => {
    if (!ride || hasRatedDriver) return;
    try {
      const updatedRide = await rideApi.rateRide(ride._id, {
        rating,
        type: 'driver'
      });
      setRide(updatedRide);
      setDriverRatingValue(rating);
      alert('Driver rated successfully!');
      setActionError(null);
    } catch (err) {
      setActionError('Failed to rate driver');
    }
  };

  const handleDriverRateRider = async (requestId: string, riderId?: string, ratingValue?: number) => {
    if (!ride || !riderId || !ratingValue) return;
    try {
      setDriverRatingLoading(requestId);
      const updatedRide = await rideApi.rateRide(ride._id, {
        rating: ratingValue,
        type: 'rider',
        targetUserId: riderId
      });
      setRide(updatedRide);
      setDriverRatings(prev => ({ ...prev, [requestId]: ratingValue }));
      setActionError(null);
      alert(`Rated rider with ${ratingValue} star${ratingValue > 1 ? 's' : ''}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to rate rider');
    } finally {
      setDriverRatingLoading(null);
    }
  };

  const handleStartRide = async () => {
    if (!ride) return;

    // Check if there's already a started ride (frontend validation)
    try {
      const myRides = await rideApi.list(userId ? { driverId: userId } : undefined);
      const hasStartedRide = myRides.some(r => r.rideStatus === 'started' && r._id !== ride._id);

      if (hasStartedRide) {
        setActionError('You already have an ongoing ride. Please complete it before starting another one.');
        return;
      }
    } catch (err) {
      console.error('Error checking for existing rides:', err);
      // Continue anyway, backend will also check
    }

    if (window.confirm('Are you sure you want to start this ride? This will notify all participants.')) {
      try {
        const updatedRide = await rideApi.startRide(ride._id);
        setRide(updatedRide);
        setActionError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unable to start ride.';
        setActionError(errorMessage);
        // Show alert for better visibility
        if (errorMessage.includes('already have an ongoing ride')) {
          alert(errorMessage);
        }
      }
    }
  };

  const handleCompleteRide = async () => {
    if (!ride) return;
    if (window.confirm('Are you sure you want to complete this ride? This will notify all participants.')) {
      try {
        const updatedRide = await rideApi.completeRide(ride._id);
        setRide(updatedRide);
        setActionError(null);
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Unable to complete ride.');
      }
    }
  };

  const handleMarkRideComplete = async () => {
    if (!ride) return;
    if (window.confirm('Are you sure you want to mark this ride as completed?')) {
      try {
        const updatedRide = await rideApi.updateStatus(ride._id, 'Completed');
        setRide(updatedRide);
        // Trigger review modal or logic here if needed
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Unable to complete ride.');
      }
    }
  };

  const handleDeleteRide = async () => {
    if (!ride) return;
    if (window.confirm('Are you sure you want to delete this ride from your history?')) {
      try {
        await rideApi.delete(ride._id);
        navigateTo('dashboard');
      } catch (err) {
        setActionError(err instanceof Error ? err.message : 'Unable to delete ride.');
      }
    }
  };

  const handleSOSButtonClick = () => {
    setShowSOSConfirmation(true);
  };

  const confirmSOSActivation = () => {
    setShowSOSConfirmation(false);
    setShowEmergencyPanel(true);
    setDispatchComplete(false);
    setIsDispatching(false);
    if (!userLocation) {
      setLocationStatus('fetching');
    }
  };

  const cancelSOSActivation = () => {
    setShowSOSConfirmation(false);
  };

  const handleDispatchEmergency = () => {
    if (isDispatching || dispatchComplete) return;
    setIsDispatching(true);
    setTimeout(() => {
      setIsDispatching(false);
      setDispatchComplete(true);
      setRideCancelled(true);
      setIncidentNotes('');
    }, 1500);
  };

  const handleCloseEmergencyPanel = () => {
    setShowEmergencyPanel(false);
    setIncidentNotes('');
    setEmergencyType('medical');
    if (!rideCancelled) {
      setDispatchComplete(false);
      setIsDispatching(false);
    }
  };

  useEffect(() => {
    if (!showEmergencyPanel) return;
    if (userLocation && locationStatus === 'ready') return;

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
      setLocationStatus('error');
      return;
    }

    setLocationStatus('fetching');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLocationStatus('ready');
      },
      () => {
        setUserLocation({ lat: 37.7749, lng: -122.4194 });
        setLocationStatus('error');
      }
    );
  }, [showEmergencyPanel, userLocation, locationStatus]);

  const handleDownloadTicket = () => {
    if (!ride || !rideMetrics) {
      alert('Unable to generate ticket. Ride details not available.');
      return;
    }

    const myRequest = ride.requests?.find(r => r.rider?.id === userId);
    const myParticipant = ride.participants?.find(p => p.rider?.id === userId);

    const seatsBooked = myParticipant?.seatsBooked || myRequest?.seatsRequested || 1;
    const totalFare = myRequest?.finalCost || myParticipant?.finalCost || rideMetrics.cost;
    const addons = myRequest?.addons || myParticipant?.addons;

    const fellowRiders = ride.participants
      ?.filter(p => p.rider?.id !== userId)
      .map(p => ({
        name: p.name,
        rating: 'N/A' as string | number
      })) || [];

    generateRideTicketPDF({
      invoiceNumber: ride._id.substring(ride._id.length - 8).toUpperCase(),
      generatedOn: new Date().toLocaleDateString(),
      passengerName: userName || 'Rider',
      driverName: ride.driver.name,
      rideDate: ride.date,
      rideTime: ride.time,
      seats: seatsBooked.toString(),
      vehicleDetails: ride.vehicle
        ? `${ride.vehicle.make || ''} ${ride.vehicle.model || ''} (${ride.vehicle.registrationNumber})`.trim()
        : 'Not specified',
      startLabel: ride.start.label,
      destinationLabel: ride.destination.label,
      distanceKm: rideMetrics.distanceKm,
      durationMinutes: rideMetrics.durationMinutes,
      fareBreakdown: `Distance (${rideMetrics.distanceKm.toFixed(2)} km) × Rs 10/km`,
      totalFare: totalFare,
      addons: addons,
      fellowRiders: fellowRiders,
    });

    alert('Ticket Downloaded!');
  };

  const handleBookRideFromDetails = async () => {
    if (!ride || !activeRideId) {
      alert('Select a ride from Find Ride to book this trip.');
      return;
    }
    try {
      const updatedRide = await rideApi.addRequest(activeRideId, {
        name: userName || 'Rider',
        rating: 5,
        seatsRequested: seatsRequested,
      });
      setRide(updatedRide);
      setRideSummaryInput({
        start: {
          lat: updatedRide.start.coordinates.lat,
          lng: updatedRide.start.coordinates.lng,
        },
        destination: {
          lat: updatedRide.destination.coordinates.lat,
          lng: updatedRide.destination.coordinates.lng,
        },
      });
      setActionError(null);
      alert('Ride requested successfully! You will be notified when the driver accepts.');
      navigateTo('dashboard');
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Unable to book this ride.');
    }
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      <button onClick={() => navigateTo('dashboard')} className="mb-8 flex items-center text-black hover:opacity-70">
        <ArrowLeft size={24} className="mr-2" />
        Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-black">Ride Details</h1>

        {actionError && (
          <div className="mb-6 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm font-semibold text-red-600">
            {actionError}
          </div>
        )}

        {rideCancelled && (
          <div className="mb-6 rounded-2xl border-2 border-red-500 bg-red-50 p-5 text-black">
            <p className="text-xl font-bold mb-1 flex items-center gap-2">
              <ShieldAlert size={24} className="text-red-600" />
              Emergency protocol active
            </p>
            <p className="text-sm text-red-700">
              This ride has been automatically cancelled. Support staff and emergency services received the incident log.
            </p>
          </div>
        )}

        {!activeRideId ? (
          <div className="rounded-2xl border-2 border-black p-6 text-center">
            <p className="text-lg font-semibold text-black mb-2">No ride selected</p>
            <p className="text-sm text-gray-600">Head to My Rides or Search to pick a trip first.</p>
          </div>
        ) : loading ? (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center text-sm font-semibold text-gray-600">
            Loading ride details...
          </div>
        ) : loadError ? (
          <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-6 text-center font-semibold text-red-600">
            {loadError}
          </div>
        ) : ride ? (
          <>
            {/* Ride Status Banner */}
            {userRole === 'driver' && ride.driver.id === userId && (
              <>
                {ride.rideStatus === 'started' ? (
                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                    <p className="text-center font-bold text-blue-800">Ride In Progress</p>
                    <p className="text-center text-sm text-blue-600 mt-1">
                      {ride.startTime ? `Started at ${new Date(ride.startTime).toLocaleTimeString()}` : 'Ride is active'}
                    </p>
                  </div>
                ) : ride.rideStatus === 'completed' ? (
                  <div className="mb-4 p-4 bg-gray-50 border-2 border-gray-500 rounded-lg">
                    <p className="text-center font-bold text-gray-800">Ride Completed</p>
                    {ride.endTime && (
                      <p className="text-center text-sm text-gray-600 mt-1">
                        Completed at {new Date(ride.endTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : null}
              </>
            )}

            {ride.participants?.some(p => p.rider?.id === userId && (p.status === 'Accepted' || p.status === 'Approved' || p.status === 'Confirmed')) && (
              <>
                {ride.rideStatus === 'started' ? (
                  <div className="mb-4 p-4 bg-blue-50 border-2 border-blue-500 rounded-lg">
                    <p className="text-center font-bold text-blue-800">Ride In Progress</p>
                    <p className="text-center text-sm text-blue-600 mt-1">Your ride has started!</p>
                  </div>
                ) : ride.rideStatus === 'completed' ? (
                  <div className="mb-4 p-4 bg-gray-50 border-2 border-gray-500 rounded-lg">
                    <p className="text-center font-bold text-gray-800">Ride Completed</p>
                    {ride.endTime && (
                      <p className="text-center text-sm text-gray-600 mt-1">
                        Completed at {new Date(ride.endTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                ) : null}
              </>
            )}

            {/* Section 1: Driver Details */}
            <Card className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <Users size={20} />
                Driver Details
              </h3>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-black mb-1 flex items-center gap-2">
                      {ride.driver?.name}
                      {ride.driver?.verificationStatus === 'verified' && (
                        <ShieldCheck size={20} className="text-green-600" fill="currentColor" stroke="white" />
                      )}
                    </h2>
                    <span
                      className={`px-3 py-1 text-xs font-semibold uppercase tracking-wide rounded-full border ${rideStatus === 'Completed' ? 'border-green-600 text-green-600' : 'border-black text-black'
                        }`}
                    >
                      {rideStatus}
                    </span>
                  </div>
                  <div className="flex items-center mb-2">
                    <Star size={20} className="text-black fill-black mr-1" />
                    <span className="font-medium">{ride.driver.rating.toFixed(1)}</span>
                  </div>
                </div>
              </div>
            </Card>

            {/* Section 2: Vehicle Details */}
            {ride.vehicle && (
              <Card className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Car size={20} />
                  Vehicle Details
                </h3>
                <div className="flex items-center gap-2 text-sm text-gray-700 bg-gray-100 px-4 py-3 rounded-xl border border-gray-200">
                  <Car size={24} className="text-gray-500" />
                  <div>
                    <p className="font-bold text-black text-base">{ride.vehicle.make} {ride.vehicle.model}</p>
                    <p className="text-gray-500 text-sm">{ride.vehicle.color} • <span className="font-mono font-bold">{ride.vehicle.registrationNumber}</span></p>
                  </div>
                </div>
              </Card>
            )}

            {/* Section 3: Ride Details */}
            <Card className="mb-4">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin size={20} />
                Ride Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Pickup</p>
                    <p className="font-bold text-black">{ride.start.label}</p>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Drop-off</p>
                    <p className="font-bold text-black">{ride.destination.label}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-sm text-gray-600">Date</p>
                    <p className="font-bold text-black">{ride.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600">Time</p>
                    <p className="font-bold text-black">{ride.time}</p>
                  </div>
                </div>

                {rideMetrics && (
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Distance</p>
                      <p className="font-bold text-black">{rideMetrics.distanceKm} km</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Duration</p>
                      <p className="font-bold text-black">{rideMetrics.durationMinutes} min</p>
                    </div>
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <p className="text-xs text-gray-500">Seats</p>
                      <p className="font-bold text-black">{Math.max(ride.seats.available, 0)} / {ride.seats.total}</p>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Section 4: Actions */}
            <Card className="mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle size={20} />
                Actions
              </h3>

              {/* Action Buttons Group */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {/* Chat Button */}
                {((userRole === 'driver' && ride.requests && ride.requests.length > 0) ||
                  (userRole !== 'driver' && ride.participants?.some(p => p.rider?.id === userId && (p.status === 'Accepted' || p.status === 'Approved' || p.status === 'Confirmed')))) &&
                  rideStatus !== 'Completed' && (
                    <Button fullWidth onClick={() => navigateTo('chat')} className="bg-black text-white hover:bg-gray-800 border-2 border-black">
                      <MessageCircle size={20} className="inline mr-2" />
                      Chat
                    </Button>
                  )}

                {/* Download Ticket - Rider Only */}
                {userRole !== 'driver' &&
                  ride.participants?.some(p => p.rider?.id === userId && (p.status === 'Accepted' || p.status === 'Approved' || p.status === 'Confirmed')) &&
                  rideStatus !== 'Completed' && (
                    <Button
                      fullWidth
                      variant="secondary"
                      onClick={handleDownloadTicket}
                    >
                      <ShieldAlert size={20} className="inline mr-2" />
                      Ticket
                    </Button>
                  )}

                {/* Driver Actions - Start/End Ride */}
                {userRole === 'driver' && ride.driver.id === userId && (
                  <>
                    {(ride.rideStatus === 'accepted' || ride.rideStatus === 'pending') && (
                      <Button
                        fullWidth
                        onClick={handleStartRide}
                        className="bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                        disabled={hasStartedRide}
                        title={hasStartedRide ? 'You already have an ongoing ride. Please complete it first.' : ''}
                      >
                        <Car size={20} className="inline mr-2" />
                        {hasStartedRide ? 'Another Ride Active' : 'Start Ride'}
                      </Button>
                    )}

                    {ride.rideStatus === 'started' && (
                      <Button fullWidth onClick={handleCompleteRide} className="bg-red-600 text-white hover:bg-red-700">
                        <CheckCircle size={20} className="inline mr-2" />
                        End Ride
                      </Button>
                    )}
                  </>
                )}

                {/* Track Ride - Active Ride Only */}
                {ride.rideStatus === 'started' && (
                  <Button fullWidth variant="secondary" onClick={() => navigateTo('gps-tracking')}>
                    <MapPin size={20} className="inline mr-2" />
                    Track
                  </Button>
                )}

                {/* SOS - Active Ride Only */}
                {ride.rideStatus === 'started' && (
                  <Button
                    fullWidth
                    variant="secondary"
                    onClick={handleSOSButtonClick}
                    className="border-red-500 text-red-600"
                  >
                    <AlertTriangle size={20} className="inline mr-2 text-red-600" />
                    SOS
                  </Button>
                )}
              </div>
            </Card>

            {/* Non-Driver / Non-Participant - Seats Selector (Above Chat and Total Cost) */}
            {userRole !== 'driver' && !ride.participants?.some(p => p.rider?.id === userId) && !hasRequested && ride.seats.available > 0 && (
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-xl border-2 border-gray-200 mb-4">
                <span className="font-semibold text-black text-lg">Seats needed:</span>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setSeatsRequested(Math.max(1, seatsRequested - 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-gray-300 text-black font-bold hover:bg-gray-100 disabled:opacity-50 transition-all"
                    disabled={seatsRequested <= 1}
                  >
                    -
                  </button>
                  <span className="font-bold text-2xl w-8 text-center">{seatsRequested}</span>
                  <button
                    onClick={() => setSeatsRequested(Math.min(ride.seats.available, seatsRequested + 1))}
                    className="w-10 h-10 flex items-center justify-center rounded-full bg-white border-2 border-gray-300 text-black font-bold hover:bg-gray-100 disabled:opacity-50 transition-all"
                    disabled={seatsRequested >= ride.seats.available}
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">


              {/* Driver Actions */}
              {userRole === 'driver' && ride.driver.id === userId && (
                <>
                  {/* Status banner moved to top */}
                </>
              )}

              {/* Rider Actions - Only if Confirmed/Accepted */}
              {ride.participants?.some(p => p.rider?.id === userId && (p.status === 'Accepted' || p.status === 'Approved' || p.status === 'Confirmed')) && (
                <>
                  {/* Status banner moved to top */}
                </>
              )}
              {ride.participants?.some(p => p.rider?.id === userId && (p.status === 'Accepted' || p.status === 'Approved' || p.status === 'Confirmed')) && rideStatus === 'Completed' && (
                <div className="mt-6 p-6 border-2 border-black rounded-xl bg-white shadow-sm">
                  <p className="text-lg font-bold text-black mb-4 text-center">Rate your Driver</p>
                  <div className="flex justify-center gap-3">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={`driver-rate-${star}`}
                        onClick={() => handleRateDriver(star)}
                        className="hover:scale-110 transition-transform disabled:opacity-50 p-1"
                        disabled={hasRatedDriver}
                        title={hasRatedDriver ? 'You already rated your driver' : `Give ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          size={40}
                          className={`${driverRatingValue >= star ? 'text-black fill-black' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                  {hasRatedDriver && (
                    <p className="text-center text-sm font-medium text-green-600 mt-4 bg-green-50 py-2 rounded-lg border border-green-200 inline-block px-6 mx-auto block w-fit">
                      Thanks for sharing your feedback!
                    </p>
                  )}
                </div>
              )}

              {/* Non-Driver / Non-Participant - Request Button */}
              {userRole !== 'driver' && !ride.participants?.some(p => p.rider?.id === userId) && (
                <div className="mt-4">
                  {ride.requests?.some(r => r.rider?.id === userId && r.status === 'PaymentPending') ? (
                    <Button
                      fullWidth
                      onClick={() => navigateTo('payment')}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-lg py-4"
                    >
                      Pay Now to Confirm
                    </Button>
                  ) : (
                    <Button
                      fullWidth
                      onClick={handleBookRideFromDetails}
                      disabled={hasRequested || ride.seats.available === 0}
                      variant={hasRequested ? 'secondary' : 'primary'}
                      className="text-lg py-4"
                    >
                      {hasRequested ? 'Request Sent' : ride.seats.available === 0 ? 'Full' : `Request ${seatsRequested} Seat${seatsRequested > 1 ? 's' : ''}`}
                    </Button>
                  )}
                </div>
              )}

              {userRole === 'driver' && (
                <>
                  <Card className="mb-6">
                    <h3 className="text-2xl font-bold mb-4 text-black">Riders Joined</h3>
                    <div className="space-y-3">
                      {ride.participants && ride.participants.length > 0 ? (
                        ride.participants.map((participant, index) => (
                          <div key={participant.rider?.id || index} className="p-4 border-2 border-black rounded-lg bg-green-50">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-black">{participant.name}</p>
                                <p className="text-sm text-gray-600 mt-1">
                                  Seats: {participant.seatsBooked} • Status: {participant.status}
                                </p>
                                {participant.rider?.email && (
                                  <p className="text-xs text-gray-500 mt-1">Email: {participant.rider.email}</p>
                                )}
                                {participant.rider?.phone && (
                                  <p className="text-xs text-gray-500">Phone: {participant.rider.phone}</p>
                                )}
                              </div>
                              <span className="px-3 py-1 text-sm font-medium rounded-full border-2 border-green-600 bg-green-600 text-white">
                                Confirmed
                              </span>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-600 text-center py-4">No riders have joined yet.</p>
                      )}
                    </div>
                  </Card>

                  <Card className="mb-6">
                    <h3 className="text-2xl font-bold mb-4 text-black">Rider Requests</h3>
                    <div className="space-y-3">
                      {ride.requests && ride.requests.length > 0 && (
                        ride.requests.map((request) => (
                          <div key={request._id} className="p-4 border-2 border-black rounded-lg">
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-bold text-black">{request.name}</p>
                                <div className="flex items-center mt-1">
                                  <Star size={14} className="text-black fill-black mr-1" />
                                  <span className="text-sm">{request.rating}</span>
                                </div>
                              </div>
                              <span
                                className={`px-3 py-1 text-sm font-medium rounded-full border-2 border-black ${request.status === 'Approved' ? 'bg-black text-white' : 'bg-white text-black'
                                  }`}
                              >
                                {request.status}
                              </span>
                            </div>

                            {request.status === 'Pending' && (
                              <div className="mt-4">
                                <Button
                                  size="sm"
                                  onClick={() => setSelectedRequest(request)}
                                  fullWidth
                                >
                                  Review Profile & Request
                                </Button>
                              </div>
                            )}
                            {request.status === 'Approved' && rideStatus === 'Completed' && userRole === 'driver' && ride.driver.id === userId && (
                              <div className="mt-4 border-t border-gray-200 pt-3">
                                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between">
                                  Rate {request.name}
                                  {request.driverRated && (
                                    <span className="text-green-600 font-bold text-[11px] uppercase tracking-wider">
                                      Rated
                                    </span>
                                  )}
                                </p>
                                {request.driverRated ? (
                                  <p className="text-xs text-green-600 font-semibold">
                                    You already rated this rider. Thank you!
                                  </p>
                                ) : (
                                  <div className="flex items-center gap-2 flex-wrap">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                      <button
                                        key={`${request._id}-${star}`}
                                        type="button"
                                        onClick={() => handleDriverRateRider(request._id, request.rider?.id, star)}
                                        className="transition-transform duration-150 hover:scale-110 disabled:opacity-50"
                                        disabled={driverRatingLoading === request._id}
                                        title={`Give ${star} star${star > 1 ? 's' : ''}`}
                                      >
                                        <Star
                                          size={28}
                                          className={`${star <= (driverRatings[request._id] || 0)
                                            ? 'text-black fill-black'
                                            : 'text-gray-300'
                                            }`}
                                        />
                                      </button>
                                    ))}
                                    {driverRatingLoading === request._id && (
                                      <span className="text-xs text-gray-500">Saving...</span>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                            <div className="mt-2 text-xs text-gray-600">
                              Seats requested: {request.seatsRequested || 1}
                            </div>
                          </div>
                        )))}
                      {(!ride.requests || ride.requests.length === 0) && (
                        <p className="text-gray-600 text-center py-4">No pending requests.</p>
                      )}
                    </div>
                  </Card>
                </>
              )}

              <div className="mt-6 flex flex-col gap-3">
                {rideStatus === 'Completed' && (
                  <div className="space-y-3">
                    <div className="rounded-2xl border border-green-500 bg-green-50 p-4 text-sm text-green-700">
                      Ride marked as complete. Chat history cleared.
                    </div>
                  </div>
                )}
              </div>

              {/* Driver Only - Delete Ride */}
              {userRole === 'driver' && ride.driver.id === userId && rideStatus === 'Completed' && (
                <div className="mt-6">
                  <Button fullWidth variant="outline" onClick={handleDeleteRide} className="border-red-500 text-red-600 hover:bg-red-50">
                    Delete Ride from History
                  </Button>
                </div>
              )}
            </div>

          </>
        ) : null}
      </div>

      {
        showSOSConfirmation && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
            <div className="w-full max-w-lg rounded-3xl border-4 border-black bg-white p-6 md:p-8 shadow-2xl">
              <h2 className="text-2xl font-bold text-black mb-2 flex items-center gap-2">
                <ShieldAlert className="text-red-600" size={26} />
                Confirm SOS Activation
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Triggering SOS immediately alerts local emergency services, shares your live location, and notifies all trusted contacts.
                False alarms may still result in authorities responding. Are you sure you need urgent help?
              </p>
              <ul className="mb-6 list-disc pl-5 text-sm text-gray-700 space-y-1">
                <li>Instant call-out to nearest police assistance desk</li>
                <li>Location + emergency type shared with RideMate Safety</li>
                <li>Current ride automatically paused until resolved</li>
              </ul>
              <div className="flex flex-col gap-3 md:flex-row">
                <Button fullWidth size="lg" onClick={confirmSOSActivation} className="bg-red-600 text-white hover:bg-red-700">
                  Yes, Activate SOS
                </Button>
                <Button fullWidth size="lg" variant="secondary" onClick={cancelSOSActivation}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )
      }

      {
        showEmergencyPanel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
            <div className="relative w-full max-w-3xl rounded-3xl border-4 border-black bg-white p-6 md:p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
              <button
                onClick={handleCloseEmergencyPanel}
                className="absolute right-4 top-4 rounded-full border-2 border-black p-1 text-black hover:bg-black hover:text-white transition-colors"
              >
                <X size={18} />
              </button>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-gray-500">
                  SOS / Emergency
                </p>
                <h2 className="mt-2 flex items-center gap-2 text-2xl font-bold text-black">
                  <ShieldAlert className="text-red-600" size={28} />
                  Instant Emergency Response
                </h2>
                <p className="text-sm text-gray-600">
                  One tap connects you with local authorities, shares your live location, and alerts your trusted
                  contacts automatically.
                </p>
              </div>

              <div className="grid gap-4 mb-6 md:grid-cols-2">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setEmergencyType(type.id)}
                    className={`rounded-2xl border-2 p-4 text-left transition-colors ${emergencyType === type.id ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-black'
                      }`}
                  >
                    <p className="font-semibold">{type.label}</p>
                    <p className={`text-sm mt-1 ${emergencyType === type.id ? 'text-white/80' : 'text-gray-600'}`}>
                      {type.desc}
                    </p>
                  </button>
                ))}
              </div>

              <div className="mb-6 rounded-2xl border-2 border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-semibold uppercase text-gray-500">Automatic Location Sharing</p>
                <p className="mt-2 text-lg font-bold text-black">
                  {userLocation
                    ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}`
                    : locationStatus === 'fetching'
                      ? 'Fetching GPS...'
                      : 'Location unavailable'}
                </p>
                <p className="text-xs text-gray-600">
                  {locationStatus === 'error'
                    ? 'Using last known coordinates while we reconnect to GPS.'
                    : 'Coordinates sent to emergency services and all trusted contacts.'}
                </p>
              </div>

              <div className="mb-6">
                <p className="text-xs font-semibold uppercase text-gray-500 mb-3">Trusted contacts notified</p>
                <ul className="grid gap-3 sm:grid-cols-2">
                  {trustedContacts.map((contact, index) => (
                    <li
                      key={`${contact.name}-${index}`}
                      className="flex items-center justify-between rounded-2xl border border-gray-200 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-black">{contact.name}</p>
                        <p className="text-sm text-gray-700">{contact.phone || 'No phone added'}</p>
                      </div>
                      <PhoneCall size={18} className="text-gray-500" />
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mb-6">
                <label className="mb-2 block text-sm font-semibold text-black">Incident details (optional)</label>
                <textarea
                  value={incidentNotes}
                  onChange={(e) => setIncidentNotes(e.target.value)}
                  placeholder="Add any quick context (vehicle information, visible threats, medical symptoms, etc.)"
                  className="w-full rounded-2xl border-2 border-gray-200 px-4 py-3 text-sm text-gray-700 focus:border-black focus:outline-none focus:ring-1 focus:ring-black min-h-[120px]"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Notes are shared with emergency dispatchers and RideMate safety specialists.
                </p>
              </div>

              {dispatchComplete ? (
                <div className="mb-6 rounded-2xl border-2 border-green-500 bg-green-50 p-4 text-sm text-green-700">
                  Emergency activation logged. Ride cancellation and post-incident support are in progress.
                </div>
              ) : (
                <div className="mb-6 rounded-2xl border-2 border-yellow-400 bg-yellow-50 p-4 text-sm text-yellow-800">
                  Selecting the correct emergency type helps responders prioritize the right resources faster.
                </div>
              )}

              <div className="flex flex-col gap-3 md:flex-row">
                <Button
                  fullWidth
                  size="lg"
                  onClick={handleDispatchEmergency}
                  disabled={isDispatching || dispatchComplete}
                >
                  {dispatchComplete ? (
                    'Emergency Logged'
                  ) : (
                    <>
                      {isDispatching ? 'Contacting Emergency Services...' : 'Dispatch Emergency Response'}
                      {!dispatchComplete && !isDispatching && <Send size={18} />}
                    </>
                  )}
                </Button>
                <Button fullWidth size="lg" variant="secondary" onClick={handleCloseEmergencyPanel}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )
      }
      {
        selectedRequest && (
          <RiderProfileModal
            rider={selectedRequest.rider}
            rating={selectedRequest.rating}
            onAccept={async () => {
              if (!ride) return;
              try {
                const updated = await rideApi.updateRequestStatus(ride._id, selectedRequest._id, 'Approved');
                setRide(updated);
                setActionError(null);
                setSelectedRequest(null);
              } catch (err) {
                setActionError(err instanceof Error ? err.message : 'Failed to approve request');
              }
            }}
            onReject={async () => {
              if (!ride) return;
              try {
                const updated = await rideApi.updateRequestStatus(ride._id, selectedRequest._id, 'Rejected');
                setRide(updated);
                setActionError(null);
                setSelectedRequest(null);
              } catch (err) {
                setActionError(err instanceof Error ? err.message : 'Failed to reject request');
              }
            }}
            onClose={() => setSelectedRequest(null)}
          />
        )
      }
    </div>
  );
}
