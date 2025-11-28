import { useState, useEffect } from 'react';
import { Calendar, Clock, User, CheckCircle, XCircle, Car, Trash2 } from 'lucide-react';
import Button from './Button';
import Card from './Card';
import { useApp } from '../context/AppContext';
import { rideApi, Ride } from '../services/rides';

interface DriverDashboardProps { }

const RiderProfileModal = ({ rider, rating, onAccept, onReject, onClose }: {
    rider: any,
    rating: number,
    onAccept: () => void,
    onReject: () => void,
    onClose: () => void
}) => {
    if (!rider) return null;
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md relative animate-in fade-in zoom-in duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-black transition-colors"
                >
                    <XCircle size={24} />
                </button>

                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <User size={40} className="text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-black">{rider.name}</h3>
                    <div className="flex items-center justify-center gap-1 text-yellow-500 mt-1">
                        <span className="font-bold">{rating || 5.0}</span>
                        <span className="text-xs">★</span>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-xl">
                        <p className="text-xs text-gray-500 uppercase font-bold mb-1">Contact Info</p>
                        <p className="text-black font-medium">{rider.email || 'Not provided'}</p>
                        <p className="text-black font-medium">{rider.phone || 'No phone number'}</p>
                    </div>
                </div>

                <div className="mt-6 grid grid-cols-2 gap-3">
                    <Button onClick={onAccept} className="bg-green-600 text-white hover:bg-green-700">
                        <CheckCircle size={16} className="mr-2" />
                        Accept
                    </Button>
                    <Button onClick={onReject} variant="secondary" className="border-red-500 text-red-600 hover:bg-red-50">
                        <XCircle size={16} className="mr-2" />
                        Reject
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default function DriverDashboard({ }: DriverDashboardProps) {
    const { navigateTo, userId, setActiveRideId } = useApp();
    const [myRides, setMyRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedRider, setSelectedRider] = useState<{ rider: any; rating: number; rideId: string; requestId: string } | null>(null);

    useEffect(() => {
        if (userId) {
            fetchMyRides();
        }
    }, [userId]);

    const fetchMyRides = async () => {
        try {
            setLoading(true);
            // Fetch rides where current user is the driver
            const rides = await rideApi.list(userId ? { driverId: userId } : undefined);
            setMyRides(rides);
        } catch (error) {
            console.error('Error fetching my rides:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcceptRequest = async (rideId: string, requestId: string) => {
        try {
            await rideApi.updateRequestStatus(rideId, requestId, 'Approved');
            // Refresh rides to show updated status
            fetchMyRides();
        } catch (error) {
            console.error('Error accepting request:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to accept request';
            // Try to parse JSON error message if it's a stringified JSON
            let displayMessage = errorMessage;
            try {
                const parsed = JSON.parse(errorMessage);
                if (parsed.message) {
                    displayMessage = parsed.message;
                }
            } catch {
                // Not JSON, use as is
            }
            alert(`Failed to accept request: ${displayMessage}`);
        }
    };
    const handleRejectRequest = async (rideId: string, requestId: string) => {
        if (window.confirm('Are you sure you want to reject this request?')) {
            try {
                await rideApi.updateRequestStatus(rideId, requestId, 'Rejected');
                fetchMyRides();
            } catch (error) {
                console.error('Error rejecting request:', error);
                const errorMessage = error instanceof Error ? error.message : 'Failed to reject request';
                // Try to parse JSON error message if it's a stringified JSON
                let displayMessage = errorMessage;
                try {
                    const parsed = JSON.parse(errorMessage);
                    if (parsed.message) {
                        displayMessage = parsed.message;
                    }
                } catch {
                    // Not JSON, use as is
                }
                alert(`Failed to reject request: ${displayMessage}`);
            }
        }
    };

    const handleDeleteRide = async (rideId: string) => {
        if (window.confirm('Are you sure you want to delete this ride? This action cannot be undone.')) {
            try {
                console.log('Attempting to delete ride:', rideId);
                const response = await rideApi.delete(rideId);

                if (response.success) {
                    setMyRides(prev => prev.filter(r => r._id !== rideId));
                } else {
                    console.error('Delete failed with response:', response);
                    alert('Failed to delete ride: Server returned error');
                }
            } catch (error) {
                console.error('Error deleting ride:', error);
                alert(`Failed to delete ride: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
        }
    };

    const handleViewRide = (ride: Ride) => {
        setActiveRideId(ride._id);
        navigateTo('ride-details');
    };

    // Only show one ongoing ride (the one that is started)
    const startedRides = myRides.filter(r => r.rideStatus === 'started');
    const ongoingRides = startedRides.slice(0, 1); // Only show the first started ride
    // All other rides (including other started rides) go to upcoming
    const upcomingRides = myRides.filter(r => {
        // Exclude the first started ride from upcoming
        if (startedRides.length > 0 && r._id === startedRides[0]._id) {
            return false;
        }
        // Include all other rides that are not completed
        return r.rideStatus !== 'completed';
    });

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-black">Driver Dashboard</h2>
            </div>
            <div className="flex items-center">
                <div className="w-full grid grid-cols-2 gap-3">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateTo('ride-history')}
                        className="w-full justify-center flex items-center gap-2 border-2 border-black hover:bg-gray-100 transition-colors"
                    >
                        <Clock size={16} />
                        Ride History
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateTo('vehicles')}
                        className="w-full justify-center flex items-center gap-2 border-2 border-black hover:bg-gray-100 transition-colors"
                    >
                        <Car size={16} />
                        My Vehicles
                    </Button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">Loading rides...</div>
            ) : (
                <>
                    {/* Ongoing Ride Section */}
                    {ongoingRides.length > 0 && (
                        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                            <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                                Ongoing Ride
                            </h3>
                            {ongoingRides.map(ride => (
                                <Card key={ride._id} className="border-2 border-green-500 bg-green-50/30 shadow-lg mb-6">
                                    <div className="flex flex-col gap-4">
                                        <div>
                                            <h3 className="font-bold text-2xl text-black mb-2">
                                                {ride.start.label} → {ride.destination.label}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-700">
                                                <div className="flex items-center">
                                                    <User size={16} className="mr-1" />
                                                    {ride.participants?.length || 0} Riders
                                                </div>
                                                <div className="flex items-center">
                                                    <Clock size={16} className="mr-1" />
                                                    Started just now
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end w-full">
                                            <Button onClick={() => handleViewRide(ride)} className="bg-green-600 hover:bg-green-700 border-green-700">
                                                Ride Details
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}

                    {/* Request Status Section */}
                    <div className="mb-8">
                        <h3 className="text-xl font-bold text-black mb-4">Ride Requests</h3>
                        {upcomingRides.length === 0 ? (
                            <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500">No ride requests to review.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingRides.map((ride) => {
                                    const allRequests = ride.requests || [];
                                    if (allRequests.length === 0) return null;
                                    return (
                                        <Card key={ride._id} className="border-2 border-black">
                                            <div className="mb-3">
                                                <h4 className="font-bold text-lg text-black mb-1">
                                                    {ride.start.label} → {ride.destination.label}
                                                </h4>
                                                <p className="text-sm text-gray-600">{ride.date} at {ride.time}</p>
                                            </div>
                                            <div className="space-y-2">
                                                {allRequests.map((request) => (
                                                    <div
                                                        key={request._id}
                                                        className={`p-3 rounded-lg border-2 ${request.status === 'Approved'
                                                            ? 'bg-green-50 border-green-200'
                                                            : request.status === 'Rejected'
                                                                ? 'bg-red-50 border-red-200'
                                                                : request.status === 'PaymentPending'
                                                                    ? 'bg-orange-50 border-orange-200'
                                                                    : 'bg-yellow-50 border-yellow-200'
                                                            }`}
                                                    >
                                                        <div className="flex justify-between items-start mb-2">
                                                            <div>
                                                                <p className="font-bold text-black">{request.name}</p>
                                                                <p className="text-xs text-gray-600">
                                                                    {request.seatsRequested} seat{request.seatsRequested > 1 ? 's' : ''} • Rating: {request.rating} ★
                                                                </p>
                                                            </div>
                                                            <span
                                                                className={`px-2 py-1 text-xs font-bold rounded-full ${request.status === 'Approved'
                                                                    ? 'bg-green-100 text-green-800'
                                                                    : request.status === 'Rejected'
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : request.status === 'PaymentPending'
                                                                            ? 'bg-orange-100 text-orange-800'
                                                                            : 'bg-yellow-100 text-yellow-800'
                                                                    }`}
                                                            >
                                                                {request.status === 'PaymentPending' ? 'Payment Pending' : request.status}
                                                            </span>
                                                        </div>
                                                        {request.status === 'Pending' && (
                                                            <div className="flex gap-2 mt-2">
                                                                <button
                                                                    onClick={() => setSelectedRider({
                                                                        rider: request.rider,
                                                                        rating: request.rating || 5.0,
                                                                        rideId: ride._id,
                                                                        requestId: request._id
                                                                    })}
                                                                    className="flex-1 bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors"
                                                                >
                                                                    Review Profile
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="mt-3 flex justify-end">
                                                <Button size="sm" onClick={() => handleViewRide(ride)} className="bg-black text-white hover:bg-gray-800">
                                                    Ride Details
                                                </Button>
                                            </div>
                                        </Card>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* Upcoming Rides Section */}
                    <div>
                        <h3 className="text-xl font-bold text-black mb-4">Upcoming Rides</h3>
                        {upcomingRides.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-500 mb-4">No upcoming rides scheduled.</p>
                                <Button onClick={() => navigateTo('create-ride')}>
                                    Schedule a Ride
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {upcomingRides.map((ride) => (
                                    <Card key={ride._id} className="border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-2px] transition-transform">
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-lg text-black">
                                                            {ride.start.label} → {ride.destination.label}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`px-2 py-0.5 text-xs font-bold rounded-full ${ride.status === 'Active' ? 'bg-green-100 text-green-800' :
                                                                ride.status === 'Completed' ? 'bg-gray-100 text-gray-800' :
                                                                    'bg-yellow-100 text-yellow-800'
                                                                }`}>
                                                                {ride.status}
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                {ride.seats.available} seats left
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="flex items-center gap-4 text-sm text-gray-600">
                                                            <div className="flex items-center">
                                                                <Calendar size={14} className="mr-1" />
                                                                {ride.date}
                                                            </div>
                                                            <div className="flex items-center">
                                                                <Clock size={14} className="mr-1" />
                                                                {ride.time}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Joined Riders Section */}
                                        {ride.participants && ride.participants.length > 0 && (
                                            <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-100">
                                                <h4 className="text-sm font-bold text-green-800 mb-2 flex items-center gap-2">
                                                    <User size={16} />
                                                    Riders Joined ({ride.participants.length})
                                                </h4>
                                                <div className="space-y-2">
                                                    {ride.participants.map((participant, idx) => (
                                                        <div key={idx} className="flex justify-between items-center text-sm bg-white p-2 rounded-lg border border-green-100">
                                                            <div>
                                                                <span className="font-semibold text-black">{participant.name}</span>
                                                                <span className="text-gray-500 ml-2">({participant.seatsBooked} seat{participant.seatsBooked > 1 ? 's' : ''})</span>
                                                            </div>
                                                            <span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                                                                Confirmed
                                                            </span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Pending Requests Section */}
                                        {ride.requests && ride.requests.some(r => r.status === 'Pending') && (
                                            <div className="mb-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200">
                                                <h4 className="text-sm font-bold text-yellow-800 mb-2 flex items-center gap-2">
                                                    <User size={16} />
                                                    Pending Requests
                                                </h4>
                                                <div className="space-y-3">
                                                    {ride.requests.filter(r => r.status === 'Pending').map((request) => (
                                                        <div key={request._id} className="bg-white p-3 rounded-lg border border-yellow-200 shadow-sm">
                                                            <div className="flex justify-between items-start mb-3">
                                                                <div>
                                                                    <p className="font-bold text-black">{request.name}</p>
                                                                    <div className="flex items-center text-xs text-gray-500 mt-1">
                                                                        <span>Rating: {request.rating} ★</span>
                                                                        <span className="mx-1">•</span>
                                                                        <span>Requested {request.seatsRequested} seat{request.seatsRequested > 1 ? 's' : ''}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            <button
                                                                onClick={() => setSelectedRider({
                                                                    rider: request.rider,
                                                                    rating: request.rating || 5.0,
                                                                    rideId: ride._id,
                                                                    requestId: request._id
                                                                })}
                                                                className="w-full mb-2 bg-gray-100 text-gray-700 py-1.5 px-3 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-1"
                                                            >
                                                                <User size={14} />
                                                                Review Profile
                                                            </button>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => handleAcceptRequest(ride._id, request._id)}
                                                                    className="flex-1 bg-green-600 text-white py-1.5 px-3 rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                                                                >
                                                                    <CheckCircle size={14} />
                                                                    Accept
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectRequest(ride._id, request._id)}
                                                                    className="flex-1 bg-red-50 text-red-600 border border-red-200 py-1.5 px-3 rounded-lg text-sm font-semibold hover:bg-red-100 transition-colors flex items-center justify-center gap-1"
                                                                >
                                                                    <XCircle size={14} />
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="mt-4 flex justify-between items-center border-t pt-4 border-gray-100">
                                            <button
                                                onClick={() => handleDeleteRide(ride._id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Ride"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                            <Button size="sm" onClick={() => handleViewRide(ride)}>
                                                Manage Ride
                                            </Button>
                                        </div>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
            {selectedRider && (
                <RiderProfileModal
                    rider={selectedRider.rider}
                    rating={selectedRider.rating}
                    onAccept={async () => {
                        await handleAcceptRequest(selectedRider.rideId, selectedRider.requestId);
                        setSelectedRider(null);
                    }}
                    onReject={async () => {
                        await handleRejectRequest(selectedRider.rideId, selectedRider.requestId);
                        setSelectedRider(null);
                    }}
                    onClose={() => setSelectedRider(null)}
                />
            )}
        </div>
    );
}
