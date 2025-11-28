const axios = require('axios');

/**
 * Geocoding service supporting multiple providers
 * 
 * FREE PROVIDERS (No payment required):
 * - nominatim: OpenStreetMap Nominatim (FREE, unlimited, 1 req/sec recommended)
 * - geoapify: Geoapify Geocoding API (FREE: 3000 requests/day)
 * - positionstack: PositionStack API (FREE: 25,000 requests/month)
 * 
 * PAID PROVIDERS (Require API keys and billing):
 * - locationiq: LocationIQ (Free tier available, requires API key)
 * - google: Google Maps Geocoding API (Requires billing, $200/month free credit)
 * - mapbox: Mapbox Geocoding API (Requires billing, free tier available)
 */

// Get geocoding provider from environment
const GEOCODING_PROVIDER = process.env.GEOCODING_PROVIDER || 'nominatim';

/**
 * Geocode a location name to coordinates using OpenStreetMap Nominatim
 */
const geocodeNominatim = async (query) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 5,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'RideMate/1.0', // Required by Nominatim
      },
      timeout: 5000,
    });

    if (!response.data || response.data.length === 0) {
      return null;
    }

    const result = response.data[0];
    return {
      name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      placeId: result.place_id,
    };
  } catch (error) {
    console.error('Nominatim geocoding error:', error.message);
    throw new Error('Failed to geocode location using Nominatim');
  }
};

/**
 * Search for location autocomplete using Nominatim
 */
const searchNominatim = async (query) => {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        q: query,
        format: 'json',
        limit: 10,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'RideMate/1.0',
      },
      timeout: 5000,
    });

    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name,
      placeId: item.place_id,
    }));
  } catch (error) {
    console.error('Nominatim search error:', error.message);
    return [];
  }
};

/**
 * Geocode using Google Maps Geocoding API
 */
const geocodeGoogle = async (query) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/geocode/json', {
      params: {
        address: query,
        key: apiKey,
      },
      timeout: 5000,
    });

    if (response.data.status !== 'OK' || !response.data.results || response.data.results.length === 0) {
      return null;
    }

    const result = response.data.results[0];
    const location = result.geometry.location;
    return {
      name: result.formatted_address,
      lat: location.lat,
      lng: location.lng,
      address: result.formatted_address,
      placeId: result.place_id,
    };
  } catch (error) {
    console.error('Google geocoding error:', error.message);
    throw new Error('Failed to geocode location using Google Maps');
  }
};

/**
 * Search for location autocomplete using Google Places API
 */
const searchGoogle = async (query) => {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('GOOGLE_MAPS_API_KEY not configured');
  }

  try {
    const response = await axios.get('https://maps.googleapis.com/maps/api/place/autocomplete/json', {
      params: {
        input: query,
        key: apiKey,
      },
      timeout: 5000,
    });

    if (response.data.status !== 'OK' || !response.data.predictions) {
      return [];
    }

    // Get details for each prediction
    const promises = response.data.predictions.slice(0, 10).map(async (prediction) => {
      try {
        const detailsResponse = await axios.get('https://maps.googleapis.com/maps/api/place/details/json', {
          params: {
            place_id: prediction.place_id,
            fields: 'geometry,formatted_address',
            key: apiKey,
          },
          timeout: 5000,
        });

        if (detailsResponse.data.status === 'OK' && detailsResponse.data.result) {
          const location = detailsResponse.data.result.geometry.location;
          return {
            name: prediction.description,
            lat: location.lat,
            lng: location.lng,
            address: detailsResponse.data.result.formatted_address,
            placeId: prediction.place_id,
          };
        }
      } catch (error) {
        console.error('Error fetching place details:', error.message);
      }
      return null;
    });

    const results = await Promise.all(promises);
    return results.filter((r) => r !== null);
  } catch (error) {
    console.error('Google Places search error:', error.message);
    return [];
  }
};

/**
 * Geocode using Mapbox Geocoding API
 */
const geocodeMapbox = async (query) => {
  const apiKey = process.env.MAPBOX_ACCESS_TOKEN;
  if (!apiKey) {
    throw new Error('MAPBOX_ACCESS_TOKEN not configured');
  }

  try {
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, {
      params: {
        access_token: apiKey,
        limit: 1,
      },
      timeout: 5000,
    });

    if (!response.data.features || response.data.features.length === 0) {
      return null;
    }

    const feature = response.data.features[0];
    const [lng, lat] = feature.center;
    return {
      name: feature.place_name,
      lat: lat,
      lng: lng,
      address: feature.place_name,
      placeId: feature.id,
    };
  } catch (error) {
    console.error('Mapbox geocoding error:', error.message);
    throw new Error('Failed to geocode location using Mapbox');
  }
};

/**
 * Search for location autocomplete using Mapbox
 */
const searchMapbox = async (query) => {
  const apiKey = process.env.MAPBOX_ACCESS_TOKEN;
  if (!apiKey) {
    throw new Error('MAPBOX_ACCESS_TOKEN not configured');
  }

  try {
    const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`, {
      params: {
        access_token: apiKey,
        limit: 10,
      },
      timeout: 5000,
    });

    if (!response.data.features || response.data.features.length === 0) {
      return [];
    }

    return response.data.features.map((feature) => {
      const [lng, lat] = feature.center;
      return {
        name: feature.place_name,
        lat: lat,
        lng: lng,
        address: feature.place_name,
        placeId: feature.id,
      };
    });
  } catch (error) {
    console.error('Mapbox search error:', error.message);
    return [];
  }
};

/**
 * Geocode using Geoapify (FREE: 3000 requests/day)
 * Sign up at: https://www.geoapify.com/ (Free account, no credit card)
 */
const geocodeGeoapify = async (query) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    throw new Error('GEOAPIFY_API_KEY not configured. Get free key at https://www.geoapify.com/');
  }

  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/search', {
      params: {
        text: query,
        apiKey: apiKey,
        limit: 1,
      },
      timeout: 5000,
    });

    if (!response.data.features || response.data.features.length === 0) {
      return null;
    }

    const feature = response.data.features[0];
    const [lng, lat] = feature.geometry.coordinates;
    return {
      name: feature.properties.formatted,
      lat: lat,
      lng: lng,
      address: feature.properties.formatted,
      placeId: feature.properties.place_id,
    };
  } catch (error) {
    console.error('Geoapify geocoding error:', error.message);
    throw new Error('Failed to geocode location using Geoapify');
  }
};

/**
 * Search for location autocomplete using Geoapify
 */
const searchGeoapify = async (query) => {
  const apiKey = process.env.GEOAPIFY_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await axios.get('https://api.geoapify.com/v1/geocode/autocomplete', {
      params: {
        text: query,
        apiKey: apiKey,
        limit: 10,
      },
      timeout: 5000,
    });

    if (!response.data.features || response.data.features.length === 0) {
      return [];
    }

    return response.data.features.map((feature) => {
      const [lng, lat] = feature.geometry.coordinates;
      return {
        name: feature.properties.formatted,
        lat: lat,
        lng: lng,
        address: feature.properties.formatted,
        placeId: feature.properties.place_id,
      };
    });
  } catch (error) {
    console.error('Geoapify search error:', error.message);
    return [];
  }
};

/**
 * Geocode using PositionStack (FREE: 25,000 requests/month)
 * Sign up at: https://positionstack.com/ (Free account, no credit card)
 */
const geocodePositionStack = async (query) => {
  const apiKey = process.env.POSITIONSTACK_API_KEY;
  if (!apiKey) {
    throw new Error('POSITIONSTACK_API_KEY not configured. Get free key at https://positionstack.com/');
  }

  try {
    const response = await axios.get('http://api.positionstack.com/v1/forward', {
      params: {
        access_key: apiKey,
        query: query,
        limit: 1,
      },
      timeout: 5000,
    });

    if (!response.data.data || response.data.data.length === 0) {
      return null;
    }

    const result = response.data.data[0];
    return {
      name: result.label || result.name,
      lat: parseFloat(result.latitude),
      lng: parseFloat(result.longitude),
      address: result.label || result.name,
      placeId: result.id || `${result.latitude},${result.longitude}`,
    };
  } catch (error) {
    console.error('PositionStack geocoding error:', error.message);
    throw new Error('Failed to geocode location using PositionStack');
  }
};

/**
 * Search for location autocomplete using PositionStack
 */
const searchPositionStack = async (query) => {
  const apiKey = process.env.POSITIONSTACK_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await axios.get('http://api.positionstack.com/v1/forward', {
      params: {
        access_key: apiKey,
        query: query,
        limit: 10,
      },
      timeout: 5000,
    });

    if (!response.data.data || response.data.data.length === 0) {
      return [];
    }

    return response.data.data.map((result) => ({
      name: result.label || result.name,
      lat: parseFloat(result.latitude),
      lng: parseFloat(result.longitude),
      address: result.label || result.name,
      placeId: result.id || `${result.latitude},${result.longitude}`,
    }));
  } catch (error) {
    console.error('PositionStack search error:', error.message);
    return [];
  }
};

/**
 * Geocode using LocationIQ (Free tier available)
 * Sign up at: https://locationiq.com/
 */
const geocodeLocationIQ = async (query) => {
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) {
    throw new Error('LOCATIONIQ_API_KEY not configured. Get key at https://locationiq.com/');
  }

  try {
    const response = await axios.get('https://us1.locationiq.com/v1/search.php', {
      params: {
        key: apiKey,
        q: query,
        format: 'json',
        limit: 1,
      },
      timeout: 5000,
    });

    if (!response.data || response.data.length === 0) {
      return null;
    }

    const result = response.data[0];
    return {
      name: result.display_name,
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      address: result.display_name,
      placeId: result.place_id,
    };
  } catch (error) {
    console.error('LocationIQ geocoding error:', error.message);
    throw new Error('Failed to geocode location using LocationIQ');
  }
};

/**
 * Search for location autocomplete using LocationIQ
 */
const searchLocationIQ = async (query) => {
  const apiKey = process.env.LOCATIONIQ_API_KEY;
  if (!apiKey) {
    return [];
  }

  try {
    const response = await axios.get('https://api.locationiq.com/v1/autocomplete.php', {
      params: {
        key: apiKey,
        q: query,
        limit: 10,
      },
      timeout: 5000,
    });

    if (!response.data || response.data.length === 0) {
      return [];
    }

    return response.data.map((item) => ({
      name: item.display_name,
      lat: parseFloat(item.lat),
      lng: parseFloat(item.lon),
      address: item.display_name,
      placeId: item.place_id,
    }));
  } catch (error) {
    console.error('LocationIQ search error:', error.message);
    return [];
  }
};

/**
 * Main geocoding function - uses configured provider
 */
const geocode = async (query) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    throw new Error('Invalid query: query must be a non-empty string');
  }

  try {
    switch (GEOCODING_PROVIDER.toLowerCase()) {
      case 'locationiq':
        return await geocodeLocationIQ(query);
      case 'google':
        return await geocodeGoogle(query);
      case 'mapbox':
        return await geocodeMapbox(query);
      case 'geoapify':
        return await geocodeGeoapify(query);
      case 'positionstack':
        return await geocodePositionStack(query);
      case 'nominatim':
      default:
        return await geocodeNominatim(query);
    }
  } catch (error) {
    // Fallback to Nominatim if other providers fail
    if (GEOCODING_PROVIDER.toLowerCase() !== 'nominatim') {
      console.warn(`Primary geocoding provider failed, falling back to Nominatim: ${error.message}`);
      try {
        return await geocodeNominatim(query);
      } catch (fallbackError) {
        throw new Error(`All geocoding providers failed. Last error: ${fallbackError.message}`);
      }
    }
    throw error;
  }
};

/**
 * Main search function for autocomplete - uses configured provider
 */
const search = async (query) => {
  if (!query || typeof query !== 'string' || query.trim().length === 0) {
    return [];
  }

  try {
    switch (GEOCODING_PROVIDER.toLowerCase()) {
      case 'locationiq':
        return await searchLocationIQ(query);
      case 'google':
        return await searchGoogle(query);
      case 'mapbox':
        return await searchMapbox(query);
      case 'geoapify':
        return await searchGeoapify(query);
      case 'positionstack':
        return await searchPositionStack(query);
      case 'nominatim':
      default:
        return await searchNominatim(query);
    }
  } catch (error) {
    // Fallback to Nominatim if other providers fail
    if (GEOCODING_PROVIDER.toLowerCase() !== 'nominatim') {
      console.warn(`Primary search provider failed, falling back to Nominatim: ${error.message}`);
      try {
        return await searchNominatim(query);
      } catch (fallbackError) {
        console.error('All search providers failed:', fallbackError.message);
        return [];
      }
    }
    console.error('Search failed:', error.message);
    return [];
  }
};

module.exports = {
  geocode,
  search,
  GEOCODING_PROVIDER,
};

