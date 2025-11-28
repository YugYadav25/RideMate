import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import MiniMap from '../components/MiniMap';
import { calculateRideDetails, RideDetails } from '../utils/rideCalculations';
import { generateRideTicketPDF } from '../utils/ticketPdf';

export default function RideConfirmation() {
  const { navigateTo, rideSummaryInput, userName } = useApp();
  const [estimates, setEstimates] = useState<RideDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!rideSummaryInput) {
      navigateTo('dashboard');
      return;
    }

    let cancelled = false;

    const fetchRideDetails = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await calculateRideDetails(
          rideSummaryInput.start.lat,
          rideSummaryInput.start.lng,
          rideSummaryInput.destination.lat,
          rideSummaryInput.destination.lng
        );
        if (!cancelled) {
          setEstimates(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Unable to calculate distance.');
          setEstimates(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchRideDetails();

    return () => {
      cancelled = true;
    };
  }, [rideSummaryInput, navigateTo]);

  const metrics = useMemo(() => {
    if (isLoading) {
      return [
        { label: 'Distance', value: 'Calculating...' },
        { label: 'Time', value: 'Calculating...' },
        { label: 'Ride Cost', value: 'Calculating...' },
        { label: 'Driver Earning', value: 'Calculating...' },
        { label: 'Platform Fee', value: 'Calculating...' },
      ];
    }

    if (error || !estimates) {
      return [
        { label: 'Distance', value: '--', helper: error || undefined },
        { label: 'Time', value: '--' },
        { label: 'Ride Cost', value: '₹ --' },
        { label: 'Driver Earning', value: '₹ --' },
        { label: 'Platform Fee', value: '₹ --' },
      ];
    }

    return [
      { label: 'Distance', value: `${estimates.distanceKm} km`, helper: 'Road distance' },
      { label: 'Time', value: `${estimates.durationMinutes} mins`, helper: 'Estimated travel time' },
      { label: 'Ride Cost', value: `₹ ${estimates.cost}`, helper: 'Charged to rider' },
      {
        label: 'Driver Earning',
        value: `₹ ${estimates.driverEarning}`,
        helper: '90% of ride cost',
      },
      { label: 'Platform Fee', value: `₹ ${estimates.platformFee}`, helper: '10% fee' },
    ];
  }, [estimates, error, isLoading]);

  if (!rideSummaryInput) {
    return null;
  }

  const handleDownloadTicket = () => {
    if (!rideSummaryInput || !estimates) {
      return;
    }

    const invoiceNumber = `RM-${Date.now()}`;
    const generatedOn = new Date().toLocaleString();
    const passengerName = userName || 'RideMate Passenger';
    const driverName = 'Assigned Driver';

    const rideDateText = 'Not provided';
    const rideTimeText = 'Not provided';
    const seatsText = 'Not specified';
    const vehicleDetails = 'RideMate Fleet Vehicle';

    const startLabel = `${rideSummaryInput.start.lat.toFixed(4)}, ${rideSummaryInput.start.lng.toFixed(4)}`;
    const destinationLabel = `${rideSummaryInput.destination.lat.toFixed(4)}, ${rideSummaryInput.destination.lng.toFixed(4)}`;

    generateRideTicketPDF({
      invoiceNumber,
      generatedOn,
      passengerName,
      driverName,
      rideDate: rideDateText,
      rideTime: rideTimeText,
      seats: seatsText,
      vehicleDetails,
      startLabel,
      destinationLabel,
      distanceKm: estimates.distanceKm,
      durationMinutes: estimates.durationMinutes,
      fareBreakdown: `Distance (${estimates.distanceKm} km) × ₹10/km`,
      totalFare: estimates.cost,
    });
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-100 rounded-full translate-x-1/3 -translate-y-1/3 opacity-20"></div>
      </div>

      <button
        onClick={() => navigateTo('dashboard')}
        className="relative z-10 mb-8 flex items-center text-black hover:opacity-70 transition-opacity font-semibold"
      >
        <ArrowLeft size={24} className="mr-2" />
        Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto relative z-10 animate-fade-in space-y-8">
        <div className="rounded-3xl border-2 border-black p-6 bg-white space-y-4 text-center">
          <div className="flex items-center justify-center gap-3 text-green-600">
            <CheckCircle2 size={32} className="text-black" />
            <p className="text-2xl font-bold text-black">Your Ride is Confirmed!</p>
          </div>
          <p className="text-gray-600 font-medium max-w-2xl mx-auto">
            Sit back and relax while we keep your trip synced for you and your driver. Here’s a quick
            snapshot of this journey.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl border-2 border-black p-6 bg-white">
            <p className="text-xs text-gray-600 font-semibold uppercase mb-1">From</p>
            <p className="text-lg font-bold text-black">
              {rideSummaryInput.start.lat.toFixed(4)}, {rideSummaryInput.start.lng.toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Starting coordinates</p>
          </div>
          <div className="rounded-3xl border-2 border-black p-6 bg-white">
            <p className="text-xs text-gray-600 font-semibold uppercase mb-1">To</p>
            <p className="text-lg font-bold text-black">
              {rideSummaryInput.destination.lat.toFixed(4)}, {rideSummaryInput.destination.lng.toFixed(4)}
            </p>
            <p className="text-xs text-gray-500 mt-2">Destination coordinates</p>
          </div>
        </div>

        <MiniMap start={rideSummaryInput.start} destination={rideSummaryInput.destination} height={260} />

        {isLoading && (
          <div className="rounded-2xl border-2 border-dashed border-gray-300 p-5 text-center text-sm font-semibold text-gray-600">
            Calculating route…
          </div>
        )}
        {error && !isLoading && (
          <div className="rounded-2xl border-2 border-black p-5 text-center text-sm font-semibold text-black">
            {error}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="rounded-3xl border-2 border-black p-6 bg-white">
              <p className="text-xs uppercase tracking-wide text-gray-600 font-semibold mb-2">
                {metric.label}
              </p>
              <p className="text-2xl font-bold text-black">{metric.value}</p>
              {metric.helper && <p className="text-sm text-gray-500 mt-2">{metric.helper}</p>}
            </div>
          ))}
        </div>

        <Button
          fullWidth
          size="lg"
          variant="secondary"
          disabled={isLoading || !estimates}
          onClick={handleDownloadTicket}
        >
          Download Ticket (PDF)
        </Button>

        <div className="flex gap-3 flex-col sm:flex-row">
          <Button fullWidth size="lg" onClick={() => navigateTo('dashboard')}>
            Go to Dashboard
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={() => navigateTo('landing')}>
            Book Another Ride
          </Button>
        </div>
      </div>
    </div>
  );
}

