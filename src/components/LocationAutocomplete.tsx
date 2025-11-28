import { useEffect, useRef, useState, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { locationApi, Location } from '../services/locations';

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: Location | null) => void;
  placeholder?: string;
  label?: string;
  error?: string;
  disabled?: boolean;
}

export default function LocationAutocomplete({
  value,
  onChange,
  placeholder = 'Search location...',
  label,
  error,
  disabled = false,
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search
  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const results = await locationApi.search(searchQuery);
      setSuggestions(results);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    } catch (err) {
      console.error('Search error:', err);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle input change
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value;
    setQuery(newQuery);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // If query is cleared, clear selection
    if (newQuery.trim().length === 0) {
      onChange(null);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(newQuery);
    }, 300);
  };

  // Handle location selection
  const handleSelect = (location: Location) => {
    setQuery(location.name);
    onChange(location);
    setSuggestions([]);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelect(suggestions[selectedIndex]);
        } else if (suggestions.length > 0) {
          handleSelect(suggestions[0]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Sync value prop
  useEffect(() => {
    if (value !== query) {
      setQuery(value);
    }
  }, [value]);

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="mb-2 block text-sm font-semibold uppercase tracking-wide text-black">
          {label}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
          {isLoading ? (
            <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
          ) : (
            <Search className="w-5 h-5 text-gray-400" />
          )}
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`
            w-full pl-10 pr-4 py-3 border-2 rounded-lg
            focus:outline-none focus:ring-2 focus:ring-black
            transition-all duration-200
            ${error ? 'border-red-500' : 'border-gray-300 focus:border-black'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
        />
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600">{error}</p>
      )}

      {/* Suggestions dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
          {suggestions.map((location, index) => (
            <button
              key={location.placeId || index}
              type="button"
              onClick={() => handleSelect(location)}
              className={`
                w-full px-4 py-3 text-left hover:bg-gray-100 transition-colors
                flex items-start gap-3
                ${selectedIndex === index ? 'bg-gray-100' : ''}
              `}
            >
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-black truncate">{location.name}</p>
                {location.address !== location.name && (
                  <p className="text-sm text-gray-600 truncate">{location.address}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {isOpen && !isLoading && suggestions.length === 0 && query.trim().length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-white border-2 border-gray-300 rounded-lg shadow-lg p-4 text-center text-gray-600">
          No locations found
        </div>
      )}
    </div>
  );
}


