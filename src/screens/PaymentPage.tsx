import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, User, ShieldCheck, CloudRain, AlertTriangle } from 'lucide-react';
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
    const [demoWeatherMode, setDemoWeatherMode] = useState(false);
    const [priceDetails, setPriceDetails] = useState<{
        pricePerPerson: number;
        seatsBooked: number;
        subtotal: number;
        weatherSurcharge: number;
        addons: number;
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
                        // Calculate per-person pricing
                        const seatsBooked = myRequest.seatsRequested || 1;
                        let pricePerPerson = 0;
                        let weatherSurchargePerPerson = 0;

                        // Use finalCost from request if available
                        if (myRequest.finalCost && myRequest.finalCost > 0) {
                            const totalWithoutAddons = myRequest.finalCost - (myRequest.addonCharges || 0);
                            pricePerPerson = totalWithoutAddons / seatsBooked;
                        } else {
                            // Fallback calculation
                            const metrics = await calculateRideDetails(
                                data.start.coordinates.lat,
                                data.start.coordinates.lng,
                                data.destination.coordinates.lat,
                                data.destination.coordinates.lng,
                                data.seats.total
                            );
                            pricePerPerson = metrics.pricePerRider;
                        }

                        // Check for weather surcharge (from backend or demo mode)
                        if (data.weatherSurcharge && data.weatherSurcharge > 0) {
                            weatherSurchargePerPerson = data.weatherSurcharge;
                        } else if (demoWeatherMode) {
                            // Demo mode: simulate 15% weather surcharge
                            weatherSurchargePerPerson = pricePerPerson * 0.15;
                        }

                        const subtotal = (pricePerPerson + weatherSurchargePerPerson) * seatsBooked;
                        const addons = myRequest.addonCharges || 0;
                        const totalBeforeTax = subtotal + addons;
                        const taxes = totalBeforeTax * 0.18; // 18% GST
                        const total = totalBeforeTax + taxes;

                        setPriceDetails({
                            pricePerPerson,
                            seatsBooked,
                            subtotal,
                            weatherSurcharge: weatherSurchargePerPerson * seatsBooked,
                            addons,
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
    }, [activeRideId, navigateTo, userId, demoWeatherMode]);

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

    const hasWeatherSurcharge = (ride.weatherData?.hasBadWeather || demoWeatherMode) && priceDetails.weatherSurcharge > 0;

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

                {/* Demo Weather Toggle */}
                <div className="mb-6 rounded-lg border-2 border-dashed border-gray-300 p-4 bg-gray-50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                                <CloudRain size={18} className={demoWeatherMode ? "text-blue-600" : "text-gray-400"} />
                                <h3 className="font-bold text-black text-sm">Demo: Simulate Bad Weather</h3>
                            </div>
                            <p className="text-xs text-gray-600">
                                Test how pricing changes during bad weather conditions (+15% surcharge)
                            </p>
                        </div>
                        <button
                            onClick={() => setDemoWeatherMode(!demoWeatherMode)}
                            className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${demoWeatherMode
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-white border-2 border-gray-300 text-gray-700 hover:border-black'
                                }`}
                        >
                            {demoWeatherMode ? '🌧️ Active' : 'Enable'}
                        </button>
                    </div>
                    {demoWeatherMode && (
                        <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                            <p className="text-xs text-blue-800 font-medium">
                                ⚠️ DEMO MODE: Simulating bad weather conditions. Price increased by 15%.
                            </p>
                        </div>
                    )}
                </div>

                {/* Weather Warning */}
                {hasWeatherSurcharge && (
                    <div className="mb-6 p-4 bg-amber-50 border-2 border-amber-300 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={20} />
                            <div className="flex-1">
                                <h3 className="font-bold text-amber-900 mb-1 flex items-center gap-2">
                                    <CloudRain size={16} />
                                    Weather Surcharge Applied
                                </h3>
                                <p className="text-sm text-amber-800 mb-2">
                                    {demoWeatherMode
                                        ? 'Demo mode active: Simulating bad weather conditions.'
                                        : `Bad weather detected at ${ride.weatherData?.startWeather?.isBad ? 'pickup' : 'destination'} location.`
                                    } A 15% surcharge (₹{priceDetails.weatherSurcharge.toFixed(2)}) has been added for safety and driver compensation.
                                </p>
                                {!demoWeatherMode && ride.weatherData && (
                                    <div className="text-xs text-amber-700 space-y-1">
                                        {ride.weatherData?.startWeather && (
                                            <p>• Pickup: {ride.weatherData.startWeather.condition} {ride.weatherData.startWeather.isBad && '⚠️'}</p>
                                        )}
                                        {ride.weatherData?.destWeather && (
                                            <p>• Destination: {ride.weatherData.destWeather.condition} {ride.weatherData.destWeather.isBad && '⚠️'}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
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
                            <span>Base Fare (₹{priceDetails.pricePerPerson.toFixed(2)}/person × {priceDetails.seatsBooked} seat{priceDetails.seatsBooked > 1 ? 's' : ''})</span>
                            <span>₹{(priceDetails.pricePerPerson * priceDetails.seatsBooked).toFixed(2)}</span>
                        </div>
                        {hasWeatherSurcharge && (
                            <div className="flex justify-between text-amber-700 font-medium">
                                <span className="flex items-center gap-1">
                                    <CloudRain size={14} />
                                    Weather Surcharge (15%)
                                </span>
                                <span>₹{priceDetails.weatherSurcharge.toFixed(2)}</span>
                            </div>
                        )}
                        {priceDetails.addons > 0 && (
                            <div className="flex justify-between text-gray-600">
                                <span>Add-ons</span>
                                <span>₹{priceDetails.addons.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-gray-600">
                            <span>Taxes & Fees (18% GST)</span>
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
