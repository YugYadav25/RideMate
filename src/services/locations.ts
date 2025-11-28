const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:5001/api';

export type Location = {
  name: string;
  lat: number;
  lng: number;
  address: string;
  placeId?: string;
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Request failed');
  }
  return response.json() as Promise<T>;
};

export const locationApi = {
  /**
   * Search for locations (autocomplete)
   */
  async search(query: string): Promise<Location[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const response = await fetch(`${API_BASE}/locations/search?q=${encodeURIComponent(query.trim())}`);
      return handleResponse<Location[]>(response);
    } catch (error) {
      console.error('Location search error:', error);
      return [];
    }
  },

  /**
   * Geocode a location (get coordinates from place name)
   */
  async geocode(query: string): Promise<Location> {
    if (!query || query.trim().length === 0) {
      throw new Error('Location query is required');
    }

    const response = await fetch(`${API_BASE}/locations/geocode?q=${encodeURIComponent(query.trim())}`);
    const result = await handleResponse<{ success: boolean; data: Location }>(response);
    return result.data;
  },
};


