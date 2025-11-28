import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L, { LeafletMouseEvent, Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';

export type Coordinates = {
  lat: number;
  lng: number;
};

interface MapPickerProps {
  startCoords: Coordinates | null;
  destinationCoords: Coordinates | null;
  onLocationChange: (type: 'start' | 'destination', coords: Coordinates) => void;
}

const DEFAULT_CENTER: L.LatLngExpression = [22.5645, 72.9289]; // Centered near Anand

export const PRESET_LOCATIONS: Array<{ label: string; coords: Coordinates }> = [
  { label: 'Anand', coords: { lat: 22.5645, lng: 72.9289 } },
  { label: 'Ahmedabad', coords: { lat: 23.0225, lng: 72.5714 } },
  { label: 'Surat', coords: { lat: 21.1702, lng: 72.8311 } },
  { label: 'Vadodara', coords: { lat: 22.3072, lng: 73.1812 } },
  { label: 'Rajkot', coords: { lat: 22.3039, lng: 70.8022 } },
  { label: 'Mumbai', coords: { lat: 19.076, lng: 72.8777 } },
];

export default function MapPicker({
  startCoords,
  destinationCoords,
  onLocationChange,
}: MapPickerProps) {
  const [mode, setMode] = useState<'start' | 'destination'>('start');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const modeRef = useRef<'start' | 'destination'>(mode);
  const startCoordsRef = useRef<Coordinates | null>(startCoords);
  const destinationCoordsRef = useRef<Coordinates | null>(destinationCoords);
  const mapRef = useRef<LeafletMap | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const startMarkerRef = useRef<Marker | null>(null);
  const destinationMarkerRef = useRef<Marker | null>(null);

  const startIcon = useMemo(
    () =>
      L.divIcon({
        className: 'map-picker-marker map-picker-marker--start',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        html: '<span>S</span>',
      }),
    []
  );

  const destinationIcon = useMemo(
    () =>
      L.divIcon({
        className: 'map-picker-marker map-picker-marker--destination',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        html: '<span>D</span>',
      }),
    []
  );

  const filteredLocations = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return PRESET_LOCATIONS.slice(0, 6);
    return PRESET_LOCATIONS.filter((location) =>
      location.label.toLowerCase().includes(query)
    ).slice(0, 6);
  }, [searchQuery]);

  const formatCoords = (value?: number) => (value !== undefined ? value.toFixed(5) : '--');

  const updateMarkerPosition = useCallback(
    (type: 'start' | 'destination', coords: Coordinates) => {
      if (!mapRef.current) return;

      const markerRef = type === 'start' ? startMarkerRef : destinationMarkerRef;
      const icon = type === 'start' ? startIcon : destinationIcon;

      if (markerRef.current) {
        markerRef.current.setLatLng(coords);
      } else {
        markerRef.current = L.marker(coords, { icon }).addTo(mapRef.current);
      }

      mapRef.current.panTo(coords, { animate: true, duration: 0.5 });
    },
    [destinationIcon, startIcon]
  );

  const handleMapClick = useCallback(
    (event: LeafletMouseEvent) => {
      const coords = {
        lat: parseFloat(event.latlng.lat.toFixed(5)),
        lng: parseFloat(event.latlng.lng.toFixed(5)),
      };

      let targetType: 'start' | 'destination' = modeRef.current;

      if (!startCoordsRef.current) {
        targetType = 'start';
      } else if (!destinationCoordsRef.current) {
        targetType = 'destination';
      }

      updateMarkerPosition(targetType, coords);
      onLocationChange(targetType, coords);

      if (targetType === 'start' && !destinationCoordsRef.current) {
        setMode('destination');
      }
    },
    [onLocationChange, updateMarkerPosition]
  );

  const handleLocationSelect = useCallback(
    (coords: Coordinates) => {
      const normalized = {
        lat: parseFloat(coords.lat.toFixed(5)),
        lng: parseFloat(coords.lng.toFixed(5)),
      };

      let targetType: 'start' | 'destination' = modeRef.current;

      if (!startCoordsRef.current) {
        targetType = 'start';
      } else if (!destinationCoordsRef.current) {
        targetType = 'destination';
      }

      updateMarkerPosition(targetType, normalized);
      onLocationChange(targetType, normalized);
      mapRef.current?.panTo(normalized, { animate: true, duration: 0.5 });
      setSearchQuery('');
      setIsDropdownOpen(false);

      if (targetType === 'start' && !destinationCoordsRef.current) {
        setMode('destination');
      }
    },
    [onLocationChange, updateMarkerPosition]
  );

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    startCoordsRef.current = startCoords;
  }, [startCoords]);

  useEffect(() => {
    destinationCoordsRef.current = destinationCoords;
  }, [destinationCoords]);

useEffect(() => {
  if (mapRef.current || !mapContainerRef.current) return;

  const map = L.map(mapContainerRef.current, {
    zoomControl: true,
  }).setView(DEFAULT_CENTER, 11);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap',
  }).addTo(map);

  mapRef.current = map;

  requestAnimationFrame(() => {
    mapRef.current?.invalidateSize();
  });
}, []);

useEffect(() => {
  if (!mapRef.current) return;

  mapRef.current.on('click', handleMapClick);

  return () => {
    mapRef.current?.off('click', handleMapClick);
  };
}, [handleMapClick]);

  useEffect(() => {
    if (startCoords) {
      updateMarkerPosition('start', startCoords);
    }
  }, [startCoords, updateMarkerPosition]);

  useEffect(() => {
    if (destinationCoords) {
      updateMarkerPosition('destination', destinationCoords);
    }
  }, [destinationCoords, updateMarkerPosition]);

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-black">
          Search Location ({mode === 'start' ? 'Start' : 'Destination'})
        </label>
        <div className="relative">
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && filteredLocations.length > 0) {
                e.preventDefault();
                handleLocationSelect(filteredLocations[0].coords);
              }
            }}
            onFocus={() => setIsDropdownOpen(true)}
            onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
            placeholder="Type a city or landmark"
            className="w-full rounded-full border border-black bg-white px-4 py-2 text-sm font-semibold text-black placeholder:text-gray-500 focus:outline-none"
          />
          {isDropdownOpen && (
            <div className="absolute left-0 right-0 mt-2 rounded-xl border border-black bg-white shadow-lg z-10 max-h-56 overflow-auto">
              {filteredLocations.length > 0 ? (
                filteredLocations.map((location) => (
                  <button
                    key={location.label}
                    type="button"
                    className="w-full px-4 py-2 text-left text-sm font-semibold text-black hover:bg-gray-100"
                    onClick={() => handleLocationSelect(location.coords)}
                  >
                    {location.label}
                  </button>
                ))
              ) : (
                <div className="px-4 py-2 text-sm font-semibold text-gray-500">
                  No matching locations
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3">
        {(['start', 'destination'] as const).map((key) => {
          const isActive = mode === key;
          const label = key === 'start' ? 'Select Start Point' : 'Select Destination Point';

          return (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={`flex-1 rounded-full border border-black px-4 py-2 text-sm font-semibold transition-colors ${
                isActive ? 'bg-black text-white' : 'bg-white text-black'
              }`}
              aria-pressed={isActive}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div
        ref={mapContainerRef}
        className="map-picker-container rounded-2xl border border-black bg-white"
        style={{ height: 350 }}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-black">
            Start Latitude
          </label>
          <input
            readOnly
            value={startCoords ? formatCoords(startCoords.lat) : '--'}
            className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm font-semibold text-black"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-black">
            Start Longitude
          </label>
          <input
            readOnly
            value={startCoords ? formatCoords(startCoords.lng) : '--'}
            className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm font-semibold text-black"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-black">
            Destination Latitude
          </label>
          <input
            readOnly
            value={destinationCoords ? formatCoords(destinationCoords.lat) : '--'}
            className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm font-semibold text-black"
          />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wide text-black">
            Destination Longitude
          </label>
          <input
            readOnly
            value={destinationCoords ? formatCoords(destinationCoords.lng) : '--'}
            className="w-full rounded-lg border border-black bg-white px-3 py-2 text-sm font-semibold text-black"
          />
        </div>
      </div>
    </div>
  );
}

