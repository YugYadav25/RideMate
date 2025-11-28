import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, User, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Card from '../components/Card';
import { rideApi, Ride } from '../services/rides';
import { calculateRideDetails } from '../utils/rideCalculations';

export default function PaymentPage() {
    const { navigateTo, activeRideId, userId } = useApp();
    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [priceDetails, setPriceDetails] = useState<{
        baseFare: number;
        taxes: number;
        total: number;
    } | null>(null);

    useEffect(() => {
        if (!activeRideId) {
            navigateTo('dashboard');
            return;
        }

        const fetchRide = async () => {
            try {
                setLoading(true);
                const data = await rideApi.getById(activeRideId);
                setRide(data);

                // Calculate price details
                if (data) {
                    const myRequest = data.requests.find(r => r.rider?.id === userId);
                    if (myRequest) {
                        // Use finalCost from request if available (should be set by backend/migration)
                        // If not, recalculate (fallback)
                        let total = myRequest.finalCost || 0;

                        if (total === 0) {
                            // Fallback calculation if finalCost is 0 (shouldn't happen with migration but safe to have)
                            const metrics = await calculateRideDetails(
                                data.start.coordinates.lat,
                                data.start.coordinates.lng,
                                data.destination.coordinates.lat,
                                data.destination.coordinates.lng,
                                data.seats.total // Use total seats for per-rider calc base
                            );
                            total = metrics.pricePerRider * (myRequest.seatsRequested || 1);
                        }

                        // Breakdown (Simulated)
                        const taxes = total * 0.18; // 18% GST example
                        const baseFare = total - taxes;

                        setPriceDetails({
                            baseFare,
                            taxes,
                            total
                        });
                    }
                }
            } catch (err) {
                setError('Failed to load ride details.');
            } finally {
                setLoading(false);
            }
        };

        fetchRide();
    }, [activeRideId, navigateTo, userId]);

    const handlePayment = async () => {
        if (!ride) return;

        try {
            setProcessing(true);
            // Simulate payment processing delay
            await new Promise(resolve => setTimeout(resolve, 1500));

            await rideApi.confirmPayment(ride._id);

            alert('Payment Successful! Your ride is confirmed.');
            navigateTo('ride-details');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment failed. Please try again.');
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading payment details...</div>;
    if (!ride || !priceDetails) return <div className="p-8 text-center text-red-600">Invalid ride details.</div>;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
            <div className="max-w-md mx-auto">
                <button
                    onClick={() => navigateTo('ride-details')}
                    className="mb-6 flex items-center text-gray-600 hover:text-black transition-colors"
                >
                    <ArrowLeft size={20} className="mr-2" />
                    Back
                </button>

                <h1 className="text-2xl font-bold text-black mb-6">Confirm & Pay</h1>

                {error && (
                    <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <Card className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Ride Summary</h2>

                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1">
                                <div className="w-2 h-2 rounded-full bg-black mb-1"></div>
                                <div className="w-0.5 h-8 bg-gray-200 mx-auto"></div>
                                <div className="w-2 h-2 rounded-full bg-black"></div>
                            </div>
                            <div className="flex-1">
                                <div className="mb-4">
                                    <p className="text-xs text-gray-500 uppercase font-bold">Pickup</p>
                                    <p className="font-medium text-black">{ride.start.label}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Drop-off</p>
                                    <p className="font-medium text-black">{ride.destination.label}</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Calendar size={16} />
                                {ride.date}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock size={16} />
                                {ride.time}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 pt-2">
                            <User size={16} />
                            Driver: {ride.driver.name}
                        </div>
                    </div>
                </Card>

                <Card className="mb-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-4">Payment Breakdown</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between text-gray-600">
                            <span>Ride Fare</span>
                            <span>₹{priceDetails.baseFare.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-gray-600">
                            <span>Taxes & Fees</span>
                            <span>₹{priceDetails.taxes.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg text-black pt-2 border-t border-gray-100 mt-2">
                            <span>Total Amount</span>
                            <span>₹{priceDetails.total.toFixed(2)}</span>
                        </div>
                    </div>
                </Card>

                <Button
                    fullWidth
                    size="lg"
                    onClick={handlePayment}
                    disabled={processing}
                    className="bg-black text-white hover:bg-gray-800 mb-4"
                >
                    {processing ? 'Processing...' : `Pay ₹${priceDetails.total.toFixed(2)}`}
                </Button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                    <ShieldCheck size={14} />
                    Secure Payment via Stripe (Simulated)
                </div>
            </div>
        </div>
    );
}
