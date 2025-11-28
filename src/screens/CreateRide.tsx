import { useState, useEffect } from 'react';
import { ArrowLeft, Users, Car } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { Location } from '../services/locations';
import { rideApi } from '../services/rides';
import ClockTimePicker from '../components/ClockPicker/ClockTimePicker';
import CalendarDatePicker from '../components/RollerPicker/CalendarDatePicker';
import PickerModal from '../components/RollerPicker/PickerModal';
import { Calendar, Clock } from 'lucide-react';
import { calculateRideDetails } from '../utils/rideCalculations';

const formatTimeLabel = (timeValue: string) => {
  if (!timeValue) return '';
  const [hourStr, minute] = timeValue.split(':');
  let hour = parseInt(hourStr, 10);
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalizedHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalizedHour}:${minute} ${suffix}`;
};

export default function CreateRide() {
  const { navigateTo, setRideSummaryInput, userName, userRole, setActiveRideId, vehicles, setRideVehicle } = useApp();
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ... inside component ...
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

  const checkNavigationState = () => {
    const navState = (window as any).__navigationState;
    if (navState) {
      if (navState.startLocation) setStartLocation(navState.startLocation);
      if (navState.destinationLocation) setDestinationLocation(navState.destinationLocation);
      if (navState.date) setDate(navState.date);
      if (navState.time) setTime(navState.time);
      if (navState.seats) setSeats(String(navState.seats));

      // Clear state after use
      (window as any).__navigationState = null;
    }
  };

  useEffect(() => {
    checkNavigationState();
    window.addEventListener('navigation-state-change', checkNavigationState);
    return () => window.removeEventListener('navigation-state-change', checkNavigationState);
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return; // Debounce check

    if (!startLocation || !destinationLocation) {
      alert('Please select both a start and destination location.');
      return;
    }

    if (!date || !time || !seats) {
      alert('Please complete all required fields.');
      return;
    }

    // Time validation
    const today = new Date();
    const selectedDate = new Date(date);

    // Reset time parts for date comparison
    const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const selectedDateOnly = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());

    if (selectedDateOnly.getTime() === todayDateOnly.getTime()) {
      const [hours, minutes] = time.split(':').map(Number);
      const selectedTime = new Date(todayDateOnly);
      selectedTime.setHours(hours, minutes, 0, 0);

      if (selectedTime < today) {
        alert('Cannot select a time in the past.');
        return;
      }
    }

    if (userRole === 'driver') {
      if (vehicles.length === 0) {
        alert('Please add a vehicle first before creating a ride.');
        return;
      }
      if (!selectedVehicle) {
        alert('Please select a vehicle for this ride.');
        return;
      }
    }

    const seatsNumber = Number(seats);
    if (!Number.isFinite(seatsNumber) || seatsNumber <= 0) {
      alert('Please enter a valid number of seats.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const formattedTime = formatTimeLabel(time);

      // Get driver's current location
      let driverLocation: { lat: number; lng: number } | undefined = undefined;
      if (userRole === 'driver' && typeof navigator !== 'undefined' && navigator.geolocation) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              timeout: 5000,
              maximumAge: 60000, // Use cached location if less than 1 minute old
            });
          });
          driverLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
        } catch (err) {
          console.warn('Could not get driver location:', err);
          // Continue without location - it's optional
        }
      }

      let estimatedPrice = 0;
      if (startLocation && destinationLocation) {
        try {
          const details = await calculateRideDetails(
            startLocation.lat,
            startLocation.lng,
            destinationLocation.lat,
            destinationLocation.lng,
            seatsNumber
          );
          estimatedPrice = details.pricePerRider;
        } catch (err) {
          console.warn('Could not calculate price:', err);
        }
      }

      const newRide = await rideApi.create({
        driverName: userName || 'RideMate Driver',
        driverRating: userRole === 'driver' ? 4.9 : 4.8,
        start: {
          label: startLocation.name,
          lat: startLocation.lat,
          lng: startLocation.lng,
        },
        destination: {
          label: destinationLocation.name,
          lat: destinationLocation.lat,
          lng: destinationLocation.lng,
        },
        date,
        time: formattedTime || time,
        seats: seatsNumber,
        price: estimatedPrice,
        notes,
        vehicleId: selectedVehicle || undefined,
        driverLocation: driverLocation,
      });

      setActiveRideId(newRide._id);

      // Store vehicle ID for this ride (dummy data)
      if (selectedVehicle) {
        setRideVehicle(newRide._id, selectedVehicle);
      }

      setRideSummaryInput({
        start: {
          lat: newRide.start.coordinates.lat,
          lng: newRide.start.coordinates.lng,
        },
        destination: {
          lat: newRide.destination.coordinates.lat,
          lng: newRide.destination.coordinates.lng,
        },
      });

      navigateTo('dashboard');

      // Debounce: Keep isSubmitting true for 5 seconds to prevent double submission
      setTimeout(() => {
        setIsSubmitting(false);
      }, 5000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create ride. Please try again.');
      setIsSubmitting(false); // Reset immediately on error
    }
  };


  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gray-100 rounded-full translate-x-1/3 -translate-y-1/3 opacity-20"></div>
      </div>

      <button
        onClick={() => navigateTo('dashboard')}
        className="mb-8 flex items-center text-black hover:opacity-70 transition-opacity font-semibold"
      >
        <ArrowLeft size={24} className="mr-2" />
        Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-black">Create a Ride</h1>
          <p className="text-gray-600 font-medium mt-2">Post your route and earn money</p>
        </div>

        <Card highlight className="animate-fade-in">
          {error && (
            <div className="mb-4 rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-sm font-semibold text-red-600">
              {error}
            </div>
          )}
          <form onSubmit={handleCreate} className="space-y-6">
            <div className="space-y-4">
              <LocationAutocomplete
                label="From"
                value={startLocation?.name || ''}
                onChange={setStartLocation}
                placeholder="Search starting location (e.g., Delhi Airport, Connaught Place)"
              />
              <LocationAutocomplete
                label="To"
                value={destinationLocation?.name || ''}
                onChange={setDestinationLocation}
                placeholder="Search destination (e.g., Sector 62 Noida, Mumbai Central)"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2.5 text-black">Date *</label>
                <button
                  type="button"
                  onClick={() => setActivePicker('date')}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg flex items-center justify-between hover:border-black transition-colors bg-white"
                >
                  <span className={date ? 'text-black' : 'text-gray-400'}>
                    {date || 'Select Date'}
                  </span>
                  <Calendar size={20} className="text-gray-500" />
                </button>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2.5 text-black">Time *</label>
                <button
                  type="button"
                  onClick={() => setActivePicker('time')}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg flex items-center justify-between hover:border-black transition-colors bg-white"
                >
                  <span className={time ? 'text-black' : 'text-gray-400'}>
                    {time ? formatTimeLabel(time) : 'Select Time'}
                  </span>
                  <Clock size={20} className="text-gray-500" />
                </button>
              </div>
            </div>

            <PickerModal
              isOpen={activePicker === 'date'}
              onClose={() => setActivePicker(null)}
              title="Select Date"
            >
              <CalendarDatePicker value={date} onChange={setDate} />
            </PickerModal>

            <PickerModal
              isOpen={activePicker === 'time'}
              onClose={() => setActivePicker(null)}
              title="Select Time"
            >
              <ClockTimePicker value={time} onChange={setTime} />
            </PickerModal>

            {userRole === 'driver' && (
              <div>
                <label className="block text-sm font-semibold mb-2.5 text-black">
                  Select Vehicle *
                </label>
                {vehicles.length > 0 ? (
                  <div className="relative">
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600">
                      <Car size={20} />
                    </div>
                    <select
                      value={selectedVehicle}
                      onChange={(e) => setSelectedVehicle(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg smooth-transition focus:outline-none focus:border-black focus:ring-1 focus:ring-black bg-white"
                      required
                    >
                      <option value="">Choose a vehicle</option>
                      {vehicles.map((vehicle) => (
                        <option key={vehicle._id} value={vehicle._id}>
                          {vehicle.registrationNumber} - {vehicle.vehicleType} ({vehicle.seatingLimit} seats)
                          {vehicle.make && vehicle.model && ` - ${vehicle.make} ${vehicle.model}`}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="p-4 bg-gray-50 border-2 border-gray-300 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">No vehicles added yet.</p>
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => navigateTo('vehicles')}
                    >
                      Add Vehicle First
                    </Button>
                  </div>
                )}
              </div>
            )}

            <Input
              label="Max Riders"
              type="number"
              placeholder="e.g., 3"
              value={seats}
              onChange={(e) => setSeats(e.target.value)}
              icon={<Users size={20} />}
              required
            />

            <div>
              <label className="block text-sm font-semibold mb-2.5 text-black">Additional Notes (Optional)</label>
              <textarea
                placeholder="e.g., Non-smoking, music, pet-friendly..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg smooth-transition focus:outline-none focus:border-black focus:ring-1 focus:ring-black resize-none"
                rows={4}
              />
            </div>

            <Button type="submit" fullWidth size="lg" disabled={isSubmitting}>
              {isSubmitting ? 'Posting ride...' : 'Create & Post Ride'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
