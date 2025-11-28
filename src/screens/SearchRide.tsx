import { useEffect, useState } from 'react';
import { ArrowLeft, Star, Users, Car, Sparkles, ShieldCheck } from 'lucide-react';
import { useApp } from '../context/AppContext';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';
import LocationAutocomplete from '../components/LocationAutocomplete';
import { Location } from '../services/locations';
import { rideApi, Ride, RideMatch, RideMatchMetrics, RideMatchResponse } from '../services/rides';
import ClockTimePicker from '../components/ClockPicker/ClockTimePicker';
import CalendarDatePicker from '../components/RollerPicker/CalendarDatePicker';
import PickerModal from '../components/RollerPicker/PickerModal';
import { Calendar, Clock } from 'lucide-react';

export default function SearchRide() {
  const { navigateTo, setRideSummaryInput, setActiveRideId } = useApp();
  const [startLocation, setStartLocation] = useState<Location | null>(null);
  const [destinationLocation, setDestinationLocation] = useState<Location | null>(null);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [requiredSeats, setRequiredSeats] = useState('');
  const [sameGender, setSameGender] = useState(false);
  const [rides, setRides] = useState<Ride[]>([]);
  const [matchGroups, setMatchGroups] = useState<RideMatchResponse['matches'] | null>(null);
  const [matchTotals, setMatchTotals] = useState<RideMatchResponse['totals'] | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... inside component ...
  const [activePicker, setActivePicker] = useState<'date' | 'time' | null>(null);

  const loadRides = async (params?: Parameters<typeof rideApi.list>[0]) => {
    try {
      setLoading(true);
      setError(null);
      setMatchGroups(null);
      setMatchTotals(null);
      const results = await rideApi.list(params);
      setRides(results);
    } catch (err) {
      console.error('Error loading rides:', err);
      let errorMessage = 'Unable to load rides.';
      if (err instanceof Error) {
        // Check for network errors
        if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
          errorMessage = 'Unable to connect to the server. Please check if the server is running and try again.';
        } else if (err.message.includes('404')) {
          errorMessage = 'API endpoint not found. Please check the server configuration.';
        } else if (err.message.includes('500')) {
          errorMessage = 'Server error. Please try again later.';
        } else {
          errorMessage = err.message || 'Unable to load rides.';
        }
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkNavigationState = () => {
    const navState = (window as any).__navigationState;
    if (navState) {
      if (navState.startLocation) setStartLocation(navState.startLocation);
      if (navState.destinationLocation) setDestinationLocation(navState.destinationLocation);
      if (navState.date) setDate(navState.date);
      if (navState.time) setTime(navState.time);
      if (navState.seats) setRequiredSeats(String(navState.seats));

      // If we have both locations and autoSearch is true, we could trigger search
      // But we need date/time. Let's set default date/time if missing.
      if (navState.autoSearch && navState.startLocation && navState.destinationLocation) {
        if (!navState.date) {
          const now = new Date();
          const dateStr = now.toISOString().split('T')[0];
          setDate(dateStr);
        }
        if (!navState.time) {
          const now = new Date();
          const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
          setTime(timeStr);
        }
      }

      // Clear state to prevent re-triggering
      (window as any).__navigationState = null;
    }
  };

  useEffect(() => {
    loadRides();
    checkNavigationState();

    window.addEventListener('navigation-state-change', checkNavigationState);
    return () => window.removeEventListener('navigation-state-change', checkNavigationState);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Effect to auto-search if all required fields are present and we just loaded from voice
  useEffect(() => {
    if (startLocation && destinationLocation && date && time && !hasSearched) {
      // Only auto-search if it looks like we came from a voice command (implied by having all fields set quickly)
      // For safety, we might want to just let the user review and click search.
      // But the user asked to "do my all work".
      // Let's trigger it if we are confident.
      // For now, I'll leave it as pre-filled so user can verify.
      // To fully automate, I'd need to refactor handleSearch to accept params or use a ref.
    }
  }, [startLocation, destinationLocation, date, time]);


  const formatDisplayDate = (value: string) => {
    if (!value) return '--';
    const dateObject = new Date(value);
    if (Number.isNaN(dateObject.getTime())) return value;
    return dateObject.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };





  const executeSearch = async (start: Location, dest: Location, d: string, t: string, seats: number) => {
    try {
      setLoading(true);
      setError(null);
      setHasSearched(true);

      // Build preferred time
      const normalizedTime = t.length === 5 ? `${t}:00` : t;
      const candidate = new Date(`${d}T${normalizedTime}`);
      const preferredTimeISO = !Number.isNaN(candidate.getTime()) ? candidate.toISOString() : undefined;

      const payload = {
        pickup: {
          label: start.name,
          lat: start.lat,
          lng: start.lng,
        },
        drop: {
          label: dest.name,
          lat: dest.lat,
          lng: dest.lng,
        },
        preferredTime: preferredTimeISO,
        seatsRequired: seats,
      };

      const response = await rideApi.match(payload);
      setMatchGroups(response.matches);
      setMatchTotals(response.totals);
      setRides([]);
    } catch (err) {
      console.error('Search error:', err);
      const message = err instanceof Error ? err.message : 'Unable to find rides.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!startLocation || !destinationLocation) {
      setError('Please select both a starting point and destination.');
      return;
    }

    if (!date || !time) {
      setError('Please select both date and preferred time.');
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
        setError('Cannot select a time in the past.');
        return;
      }
    }

    const seats = requiredSeats ? Number(requiredSeats) : 1;
    if (Number.isNaN(seats) || seats <= 0) {
      setError('Please enter a valid number of required seats.');
      return;
    }

    await executeSearch(startLocation, destinationLocation, date, time, seats);
  };

  // Auto-search effect
  useEffect(() => {
    const navState = (window as any).__navigationState;
    if (navState && navState.autoSearch && startLocation && destinationLocation && date && time) {
      // Clear the flag so we don't loop
      (window as any).__navigationState.autoSearch = false;
      executeSearch(startLocation, destinationLocation, date, time, 1);
    }
  }, [startLocation, destinationLocation, date, time]);



  const prepareRideSummaryInput = (ride: Ride) => {
    if (ride.start?.coordinates && ride.destination?.coordinates) {
      setRideSummaryInput({
        start: {
          lat: ride.start.coordinates.lat,
          lng: ride.start.coordinates.lng,
        },
        destination: {
          lat: ride.destination.coordinates.lat,
          lng: ride.destination.coordinates.lng,
        },
      });
    }
  };

  const handleViewDetails = (ride: Ride) => {
    setActiveRideId(ride._id);
    prepareRideSummaryInput(ride);
    navigateTo('ride-details');
  };

  const totalResults = matchTotals
    ? matchTotals.perfect + matchTotals.good + matchTotals.nearby
    : rides.length;

  const renderMatchBadge = (quality: RideMatch['matchQuality']) => {
    const config = {
      perfect: {
        text: 'Perfect Match',
        classes: 'bg-green-100 text-green-800 border-green-200',
      },
      good: {
        text: 'Good Match',
        classes: 'bg-blue-100 text-blue-800 border-blue-200',
      },
      nearby: {
        text: 'Nearby Ride',
        classes: 'bg-gray-100 text-gray-700 border-gray-200',
      },
    } as const;

    const data = config[quality];
    return (
      <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide ${data.classes}`}>
        <Sparkles size={14} />
        {data.text}
      </span>
    );
  };

  const renderMetrics = (metrics?: RideMatchMetrics | null) => {
    if (!metrics) return null;
    return (
      <div className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-3 text-sm text-gray-700 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase font-semibold text-gray-500">Pickup distance</p>
          <p className="font-bold text-black">{metrics.pickupDistanceKm === Infinity ? 'N/A' : `${metrics.pickupDistanceKm.toFixed(1)} km`}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-semibold text-gray-500">Drop distance</p>
          <p className="font-bold text-black">{metrics.dropDistanceKm === Infinity ? 'N/A' : `${metrics.dropDistanceKm.toFixed(1)} km`}</p>
        </div>
        <div>
          <p className="text-xs uppercase font-semibold text-gray-500">Time difference</p>
          <p className="font-bold text-black">
            {metrics.timeDiffMinutes === null ? 'Flexible' : `${Math.round(metrics.timeDiffMinutes)} min`}
          </p>
        </div>
      </div>
    );
  };

  const renderRideCard = (ride: Ride, match?: RideMatch) => {
    const handleViewDetails = () => {
      setActiveRideId(ride._id);
      prepareRideSummaryInput(ride);
      navigateTo('ride-details');
    };

    return (
      <Card
        key={`${ride._id}-${match?.matchQuality || 'generic'}`}
        className="animate-slide-in"
      >
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-black flex items-center gap-1">
              {ride.driver?.name}
              {ride.driver?.verificationStatus === 'verified' && (
                <ShieldCheck size={16} className="text-green-600" fill="currentColor" stroke="white" />
              )}
            </h3>
            <div className="flex items-center mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  size={16}
                  className={`${i < Math.floor(ride.driver.rating) ? 'text-black fill-black' : 'text-gray-300'} mr-1`}
                />
              ))}
              <span className="text-sm font-semibold ml-1">{ride.driver.rating.toFixed(1)}</span>
            </div>
          </div>
          {match ? renderMatchBadge(match.matchQuality) : (
            <span className="rounded-full border-2 border-black px-3 py-1 text-xs font-bold uppercase tracking-wide text-black">
              Featured Ride
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start mb-5">
          <div>
            <p className="text-xs text-gray-600 font-medium uppercase mb-1">Route</p>
            <p className="font-semibold text-black">{ride.start.label}</p>
            <p className="text-sm text-gray-600">→ {ride.destination.label}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 font-medium uppercase mb-1">Schedule</p>
            <p className="font-semibold text-black">{formatDisplayDate(ride.date)}</p>
            <p className="text-sm text-gray-600">{ride.time}</p>
          </div>

          <div>
            <p className="text-xs text-gray-600 font-medium uppercase mb-1">Vehicle</p>
            {ride.vehicle ? (
              <div className="text-sm text-gray-600">
                <div className="flex items-center mb-1">
                  <Car size={14} className="mr-1" />
                  <span className="font-semibold">
                    {ride.vehicle.make} {ride.vehicle.model}
                  </span>
                </div>
                <div className="pl-5">
                  <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: ride.vehicle.color || '#000' }}></span>
                  {ride.vehicle.color} • {ride.vehicle.registrationNumber}
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Vehicle TBD</p>
            )}
          </div>

          <div className="flex items-center justify-end">
            <div className="px-4 py-2 bg-black rounded-lg text-white font-bold flex items-center gap-2">
              <Users size={18} />
              <span>{Math.max(ride.seats.available, 0)}</span>
            </div>
          </div>
        </div>

        {renderMetrics(match?.metrics)}

        <div className="pt-4 border-t-2 border-gray-200">
          <Button fullWidth size="sm" onClick={handleViewDetails}>
            More Info
          </Button>
        </div>
      </Card>
    );
  };

  const renderMatchSection = (
    key: keyof RideMatchResponse['matches'],
    title: string,
    subtitle: string
  ) => {
    if (!matchGroups || matchGroups[key].length === 0) return null;
    return (
      <section key={key} className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-black">
              {title} ({matchGroups[key].length})
            </h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
        </div>
        <div className="space-y-4">
          {matchGroups[key].map((match) => renderRideCard(match.ride, match))}
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6 relative">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gray-100 rounded-full -translate-x-1/2 -translate-y-1/2 opacity-20"></div>
      </div>

      <button
        onClick={() => navigateTo('dashboard')}
        className="relative z-10 mb-8 flex items-center gap-2 text-sm font-semibold text-black hover:opacity-70 transition-opacity"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </button>

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8 animate-fade-in">
          <h1 className="text-4xl font-bold mb-2 text-black">Find Your Ride</h1>
          <p className="text-gray-600 font-medium">Search and connect with verified drivers</p>
        </div>

        <Card highlight className="mb-8 animate-slide-in" style={{ animationDelay: '0.1s' }}>
          <h2 className="text-lg font-bold text-black mb-6">Search Criteria</h2>

          <div className="space-y-5">
            <div className="space-y-4">
              <div>
                <LocationAutocomplete
                  label="From"
                  value={startLocation?.name || ''}
                  onChange={setStartLocation}
                  placeholder="Search starting location (e.g., Delhi Airport, Connaught Place)"
                />
              </div>
              <div>
                <LocationAutocomplete
                  label="To"
                  value={destinationLocation?.name || ''}
                  onChange={setDestinationLocation}
                  placeholder="Search destination (e.g., Sector 62 Noida, Mumbai Central)"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold mb-2.5 text-black">Date</label>
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
                <label className="block text-sm font-semibold mb-2.5 text-black">Preferred Time</label>
                <button
                  type="button"
                  onClick={() => setActivePicker('time')}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg flex items-center justify-between hover:border-black transition-colors bg-white"
                >
                  <span className={time ? 'text-black' : 'text-gray-400'}>
                    {time || 'Select Time'}
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
            <Input
              label="Required Seats"
              type="number"
              min={1}
              placeholder="e.g., 2"
              value={requiredSeats}
              onChange={(e) => setRequiredSeats(e.target.value)}
            />

            <div className="flex items-center my-2 p-4 bg-gray-50 rounded-lg">
              <input
                type="checkbox"
                id="same-gender"
                checked={sameGender}
                onChange={(e) => setSameGender(e.target.checked)}
                className="w-5 h-5 border-2 border-black rounded cursor-pointer"
              />
              <label htmlFor="same-gender" className="ml-3 text-sm font-semibold text-black cursor-pointer">
                Prefer same gender driver
              </label>
            </div>



            <Button type="button" fullWidth size="lg" onClick={handleSearch}>
              Search Rides
            </Button>
          </div>
        </Card>

        <div className="animate-slide-in" style={{ animationDelay: '0.2s' }}>
          <h2 className="text-2xl font-bold text-black mb-6">
            Available Rides ({totalResults})
          </h2>

          {error && (
            <div className="rounded-2xl border-2 border-red-500 bg-red-50 p-4 text-red-700 font-semibold mb-6">
              <p className="font-bold mb-2">Error: {error}</p>
              {error.includes('connect') || error.includes('Failed to fetch') ? (
                <div className="text-sm mt-2 space-y-1">
                  <p>• Make sure the backend server is running on port 5001</p>
                  <p>• Check that VITE_API_URL in your .env file is correct</p>
                  <p>• Verify CORS is enabled on the server</p>
                </div>
              ) : null}
            </div>
          )}

          {loading ? (
            <div className="rounded-2xl border-2 border-dashed border-gray-300 p-6 text-center text-sm font-semibold text-gray-600">
              Loading rides...
            </div>
          ) : matchGroups ? (
            matchTotals && totalResults === 0 ? (
              <div className="rounded-2xl border-2 border-black p-6 text-center">
                <p className="text-lg font-semibold text-black mb-2">No perfect matches yet</p>
                <p className="text-sm text-gray-600 mb-4">
                  Try broadening your pickup/drop radius or adjust the preferred time.
                </p>
                {startLocation && destinationLocation && (
                  <Button
                    size="sm"
                    onClick={() => {
                      navigateTo('create-ride', {
                        startLocation,
                        destinationLocation,
                        date,
                        time
                      });
                    }}
                  >
                    Create this Ride
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-10">
                {renderMatchSection('perfect', 'Perfect Matches', 'Ideal rides within 5 km & 1 hour of your schedule.')}
                {renderMatchSection('good', 'Good Matches', 'Slight detours that still meet your timing needs.')}
                {renderMatchSection('nearby', 'Nearby Rides', 'Other active rides close to your route.')}
              </div>
            )
          ) : rides.length === 0 ? (
            <div className="rounded-2xl border-2 border-black p-6 text-center">
              <p className="text-lg font-semibold text-black mb-2">No rides found</p>
              <p className="text-sm text-gray-600 mb-4">
                {hasSearched ? 'Try adjusting your filters or create this ride yourself!' : 'Be the first to create a ride!'}
              </p>
              {hasSearched && startLocation && destinationLocation && (
                <Button
                  size="sm"
                  onClick={() => {
                    navigateTo('create-ride', {
                      startLocation,
                      destinationLocation,
                      date,
                      time
                    });
                  }}
                >
                  Create this Ride
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {rides.map((ride, idx) => (
                <Card
                  key={ride._id}
                  className="animate-slide-in"
                  style={{ animationDelay: `${0.3 + idx * 0.1}s` }}
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-start mb-5">
                    <div>
                      <h3 className="text-lg font-bold text-black flex items-center gap-1">
                        {ride.driver?.name}
                        {ride.driver?.verificationStatus === 'verified' && (
                          <ShieldCheck size={16} className="text-green-600" fill="currentColor" stroke="white" />
                        )}
                      </h3>
                      <div className="flex items-center mt-2">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            size={16}
                            className={`${i < Math.floor(ride.driver.rating) ? 'text-black fill-black' : 'text-gray-300'} mr-1`}
                          />
                        ))}
                        <span className="text-sm font-semibold ml-1">{ride.driver.rating.toFixed(1)}</span>
                      </div>
                      {ride.vehicle && (
                        <div className="mt-2 text-xs text-gray-600">
                          <div className="flex items-center mb-1">
                            <Car size={14} className="mr-1" />
                            <span className="font-semibold">
                              {ride.vehicle.make} {ride.vehicle.model}
                            </span>
                          </div>
                          <div className="pl-5">
                            <span className="inline-block w-2 h-2 rounded-full mr-1" style={{ backgroundColor: ride.vehicle.color || '#000' }}></span>
                            {ride.vehicle.color} • {ride.vehicle.registrationNumber}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 font-medium uppercase mb-1">Route</p>
                      <p className="font-semibold text-black">{ride.start.label}</p>
                      <p className="text-sm text-gray-600">→ {ride.destination.label}</p>
                    </div>

                    <div>
                      <p className="text-xs text-gray-600 font-medium uppercase mb-1">Schedule</p>
                      <p className="font-semibold text-black">{formatDisplayDate(ride.date)}</p>
                      <p className="text-sm text-gray-600">{ride.time}</p>
                    </div>

                    <div className="flex items-center justify-end">
                      <div className="px-4 py-2 bg-black rounded-lg text-white font-bold flex items-center gap-2">
                        <Users size={18} />
                        <span>{Math.max(ride.seats.available, 0)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t-2 border-gray-200">
                    <Button fullWidth size="sm" onClick={() => handleViewDetails(ride)}>
                      More Info
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
