import { useState, useEffect, useRef } from 'react';
import { bookingApi, Booking } from '../services/bookings';
import Card from './Card';
import { User, Car } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { rideApi, Ride } from '../services/rides';
import { calculateRideDetails, RideDetails as RideMetrics } from '../utils/rideCalculations';
import Button from './Button';
import { parseRideDate } from '../utils/dateUtils';


const CountdownTimer = ({ targetDate }: { targetDate: Date }) => {
    const [timeLeft, setTimeLeft] = useState<{
        days: number;
        hours: number;
        minutes: number;
        seconds: number;
    } | null>(null);

    useEffect(() => {
        const calculateTimeLeft = () => {
            const difference = +targetDate - +new Date();
            if (difference > 0) {
                return {
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                };
            }
            return null;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (!timeLeft) return <span className="text-red-600 font-bold">Ride Started</span>;

    return (
        <div className="flex gap-2 text-center">
            {Object.entries(timeLeft).map(([unit, value]) => {
                if (unit === 'days' && value === 0) return null;
                return (
                    <div key={unit} className="bg-black text-white px-2 py-1 rounded-md min-w-[3rem]">
                        <div className="text-lg font-bold leading-none">{value}</div>
                        <div className="text-[10px] uppercase opacity-75">{unit}</div>
                    </div>
                );
            })}
        </div>
    );
};



export default function RiderDashboard() {
    const { navigateTo, setActiveRideId, userId, userName } = useApp();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [myRides, setMyRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [rideMetrics, setRideMetrics] = useState<Record<string, RideMetrics>>({});

    const fetchingRef = useRef<Set<string>>(new Set());

    useEffect(() => {
        const fetchBookings = async () => {
            try {
                setLoading(true);
                const data = await bookingApi.getMyBookings();
                setBookings(data);
            } catch (err) {
                console.error('Failed to fetch bookings:', err);
            } finally {
                setLoading(false);
            }
        };

        const fetchMyRides = async () => {
            try {
                // Fetch rides where user has made requests
                const rides = await rideApi.list(userId ? { participantId: userId } : undefined);
                setMyRides(rides);
            } catch (err) {
                console.error('Failed to fetch rides:', err);
            }
        };

        fetchBookings();
        if (userId) {
            fetchMyRides();
        }
    }, [userId]);

    // Calculate ride metrics for bookings with totalPrice of 0
    useEffect(() => {
        bookings.forEach(async (booking) => {
            if (booking.ride && booking.totalPrice === 0 && !rideMetrics[booking.ride._id] && !fetchingRef.current.has(booking.ride._id)) {
                fetchingRef.current.add(booking.ride._id);
                try {
                    // Fetch full ride details to get coordinates
                    const rideDetails = await rideApi.getById(booking.ride._id);
                    const metrics = await calculateRideDetails(
                        rideDetails.start.coordinates.lat,
                        rideDetails.start.coordinates.lng,
                        rideDetails.destination.coordinates.lat,
                        rideDetails.destination.coordinates.lng
                    );
                    setRideMetrics(prev => ({
                        ...prev,
                        [booking.ride._id]: metrics
                    }));
                } catch (err) {
                    console.error(`Failed to calculate price for ride ${booking.ride._id}:`, err);
                    fetchingRef.current.delete(booking.ride._id); // Allow retry on failure
                }
            }
        });
    }, [bookings, rideMetrics]);

    // Only show one ongoing ride (the one that is started)
    const startedRides = bookings.filter(b =>
        b.ride &&
        b.ride.rideStatus === 'started'
    );
    const ongoingRide = startedRides.length > 0 ? startedRides[0] : null;

    const upcomingRides = bookings.filter(b => {
        if (!b.ride) return false;
        // Exclude the ongoing ride from upcoming
        if (ongoingRide && b._id === ongoingRide._id) return false;
        // Check if confirmed
        const isConfirmed = b.status === 'Accepted' || b.status === 'Approved';
        if (!isConfirmed) return false;
        // Exclude started rides (they should only be in ongoing)
        if (b.ride.rideStatus === 'started') return false;
        // Exclude completed rides
        if (b.ride.rideStatus === 'completed') return false;
        // If ride is explicitly active but not started, it's upcoming
        return true;
    });

    const pendingRequests = bookings.filter(b => b.ride && !b.ride.isActive && b.status === 'Pending');

    if (loading) return <div className="text-center py-8">Loading your rides...</div>;

    return (
        <div className="space-y-8 relative">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-black">Rider Dashboard</h2>
            </div>
            <div className="flex items-center">
                <div className="w-full grid grid-cols-1">
                    <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateTo('ride-history')}
                        className="flex items-center gap-2 border-2 border-black hover:bg-gray-100 transition-colors"
                    >
                        <Car size={16} />
                        Ride History
                    </Button>
                </div>
            </div>

            {/* Ongoing Ride Section */}
            {ongoingRide && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                    <h3 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                        <span className="relative flex h-3 w-3">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                        </span>
                        Ongoing Ride
                    </h3>
                    <Card
                        className="border-2 border-green-500 bg-green-50/30 shadow-lg mb-6 cursor-pointer"
                        onClick={() => {
                            setActiveRideId(ongoingRide.ride._id);
                            navigateTo('ride-details');
                        }}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <h3 className="font-bold text-2xl text-black mb-2">
                                    {ongoingRide.ride.from} → {ongoingRide.ride.to}
                                </h3>
                                <div className="flex items-center gap-4 text-sm text-gray-700">
                                    <div className="flex items-center">
                                        <User size={16} className="mr-1" />
                                        Driver: {ongoingRide.ride.driver?.name}
                                    </div>
                                    <div className="flex items-center">
                                        <Car size={16} className="mr-1" />
                                        {ongoingRide.ride.vehicle?.model} ({ongoingRide.ride.vehicle?.registrationNumber})
                                    </div>
                                </div>
                            </div>
                            <Button className="bg-green-600 hover:bg-green-700 border-green-700">
                                Track Ride
                            </Button>
                        </div>
                    </Card>
                </div>
            )}

            {/* Request Status Section */}
            <div className="mb-8">
                <h3 className="text-xl font-bold text-black mb-4">My Ride Requests</h3>
                {myRides.length === 0 ? (
                    <div className="text-center py-8 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <p className="text-gray-500">No ride requests yet.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {myRides.map((ride) => {
                            const myRequest = ride.requests.find(r => r.rider && (typeof r.rider === 'string' ? r.rider === userId : r.rider.id === userId));
                            const isPaymentPending = myRequest?.status === 'PaymentPending';

                            return (
                                <div key={ride._id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="font-bold text-lg text-black mb-1">
                                                {ride.start.label} → {ride.destination.label}
                                            </h3>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <div className="flex items-center">
                                                    <User size={16} className="mr-1" />
                                                    {ride.driver.name}
                                                </div>
                                                <div className="flex items-center">
                                                    <Car size={16} className="mr-1" />
                                                    {ride.vehicle ? `${ride.vehicle.make} ${ride.vehicle.model}` : 'Vehicle details N/A'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${isPaymentPending
                                                    ? 'bg-orange-50 text-orange-600 border-orange-200'
                                                    : myRequest?.status === 'Approved'
                                                        ? 'bg-green-50 text-green-600 border-green-200'
                                                        : myRequest?.status === 'Rejected'
                                                            ? 'bg-red-50 text-red-600 border-red-200'
                                                            : 'bg-yellow-50 text-yellow-600 border-yellow-200'
                                                }`}>
                                                {isPaymentPending ? 'Payment Pending' : myRequest?.status || 'Pending'}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Requested {new Date(myRequest?.createdAt || Date.now()).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                                        <div className="text-sm">
                                            <span className="text-gray-500">Date:</span>
                                            <span className="font-medium text-black ml-1">{ride.date}</span>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setActiveRideId(ride._id);
                                                    navigateTo('ride-details');
                                                }}
                                            >
                                                View Details
                                            </Button>
                                            {isPaymentPending && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => {
                                                        setActiveRideId(ride._id);
                                                        navigateTo('payment');
                                                    }}
                                                    className="bg-orange-500 hover:bg-orange-600 text-white border-orange-600"
                                                >
                                                    Pay Now
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Upcoming Trips Section */}
            <div>
                <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                    Upcoming Rides
                </h2>
                {upcomingRides.length === 0 ? (
                    <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-300 p-8 text-center">
                        <p className="text-gray-500 font-medium">No confirmed upcoming rides.</p>
                        <button
                            onClick={() => navigateTo('search-ride')}
                            className="mt-4 text-black font-bold hover:underline"
                        >
                            Find a ride now
                        </button>
                    </div>
                ) : (
                    <div className="grid gap-4 md:grid-cols-1">
                        {upcomingRides.map((booking) => (
                            <Card
                                key={booking._id}
                                className="border-2 border-green-500 bg-green-50/30 shadow-md cursor-pointer hover:shadow-xl transition-all"
                                onClick={() => {
                                    setActiveRideId(booking.ride._id);
                                    navigateTo('ride-details');
                                }}
                            >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="px-3 py-1 bg-green-600 text-white text-xs font-bold rounded-full uppercase tracking-wide">
                                                Confirmed
                                            </span>
                                            <span className="text-sm text-gray-600 font-medium">
                                                {booking.ride.date} • {booking.ride.time}
                                            </span>
                                        </div>
                                        <h3 className="text-xl font-bold text-black mb-1">
                                            {booking.ride.from} → {booking.ride.to}
                                        </h3>
                                        <div className="flex items-center gap-4 text-sm text-gray-700 mt-3">
                                            <div className="flex items-center gap-1">
                                                <User size={16} />
                                                <span className="font-semibold">{booking.ride.driver?.name}</span>
                                            </div>
                                            {booking.ride.vehicle && (
                                                <div className="flex items-center gap-1">
                                                    <Car size={16} />
                                                    <span>{booking.ride.vehicle.model} ({booking.ride.vehicle.color})</span>
                                                    <span className="font-mono bg-white px-1 rounded border border-gray-200 text-xs">
                                                        {booking.ride.vehicle.registrationNumber}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <div className="mb-2">
                                            <p className="text-xs text-gray-500 mb-1 text-right">Starts in:</p>
                                            <CountdownTimer targetDate={parseRideDate(booking.ride.date, booking.ride.time)} />
                                        </div>
                                        <div className="text-right">
                                            {(() => {
                                                const displayPrice = booking.totalPrice > 0
                                                    ? booking.totalPrice
                                                    : rideMetrics[booking.ride._id]?.cost;

                                                return displayPrice ? (
                                                    <>
                                                        <p className="text-2xl font-bold text-black">₹{displayPrice.toFixed(2)}</p>
                                                        <p className="text-xs text-gray-500">{booking.seatsBooked} seat(s)</p>
                                                    </>
                                                ) : (
                                                    <>
                                                        <p className="text-sm font-medium text-gray-400">Calculating...</p>
                                                        <p className="text-xs text-gray-500">{booking.seatsBooked} seat(s)</p>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Pending Requests Section */}
            {pendingRequests.length > 0 && (
                <div>
                    <h2 className="text-xl font-bold text-black mb-4 flex items-center gap-2">
                        Pending Requests
                    </h2>
                    <div className="grid gap-4 md:grid-cols-2">
                        {pendingRequests.map((booking) => (
                            <Card key={booking._id} className="hover:border-black transition-colors">
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-bold text-black">
                                            {booking.ride.from} → {booking.ride.to}
                                        </h4>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {booking.ride.date} • {booking.ride.time}
                                        </p>
                                    </div>
                                    <span className="px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">
                                        Pending
                                    </span>
                                </div>
                                <div className="flex justify-between items-end text-sm">
                                    <div className="text-gray-600">
                                        {booking.seatsBooked} seat(s) • ₹{booking.totalPrice}
                                    </div>
                                    <div className="text-gray-500 text-xs">
                                        {new Date(booking.bookingDate).toLocaleDateString()}
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
