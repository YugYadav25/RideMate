import { useEffect, useMemo, useRef } from 'react';
import L, { Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { LocationPoint } from '../context/AppContext';

interface MiniMapProps {
  start?: LocationPoint | null;
  destination?: LocationPoint | null;
  height?: number;
}

export default function MiniMap({ start, destination, height = 220 }: MiniMapProps) {
  const mapRef = useRef<LeafletMap | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
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

  useEffect(() => {
    if (mapRef.current || !containerRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      dragging: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
    }).setView([22.5645, 72.9289], 6);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map);

    mapRef.current = map;
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (start) {
      if (startMarkerRef.current) {
        startMarkerRef.current.setLatLng(start);
      } else {
        startMarkerRef.current = L.marker(start, { icon: startIcon }).addTo(mapRef.current);
      }
    }

    if (destination) {
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.setLatLng(destination);
      } else {
        destinationMarkerRef.current = L.marker(destination, { icon: destinationIcon }).addTo(
          mapRef.current
        );
      }
    }

    if (start && destination) {
      const bounds = L.latLngBounds([start.lat, start.lng], [destination.lat, destination.lng]);
      mapRef.current.fitBounds(bounds.pad(0.2));
    } else if (start) {
      mapRef.current.setView(start, 10);
    } else if (destination) {
      mapRef.current.setView(destination, 10);
    }
  }, [start, destination, destinationIcon, startIcon]);

  return (
    <div
      ref={containerRef}
      className="map-picker-container rounded-2xl border border-black bg-white pointer-events-none"
      style={{ height }}
    />
  );
}

