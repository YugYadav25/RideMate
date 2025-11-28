const axios = require('axios');

/**
 * Weather Service using Open-Meteo API (Free, no API key required)
 * API Documentation: https://open-meteo.com/en/docs
 */

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

// Weather condition thresholds for "bad weather"
const BAD_WEATHER_THRESHOLDS = {
    HEAVY_RAIN_MM_PER_HOUR: 2.5,
    POOR_VISIBILITY_M: 1000,
    STRONG_WIND_KMH: 40,
};

// Weather codes from Open-Meteo API
// https://open-meteo.com/en/docs#weathervariables
const SEVERE_WEATHER_CODES = {
    THUNDERSTORM: [95, 96, 99], // Thunderstorm, thunderstorm with hail
    SNOW: [71, 73, 75, 77, 85, 86], // Snow fall, snow grains, snow showers
    FREEZING_RAIN: [66, 67], // Freezing rain
};

/**
 * Fetch current weather data for given coordinates
 * @param {number} lat - Latitude
 * @param {number} lng - Longitude
 * @returns {Promise<Object>} Weather data
 */
const getWeatherData = async (lat, lng) => {
    try {
        const response = await axios.get(OPEN_METEO_BASE_URL, {
            params: {
                latitude: lat,
                longitude: lng,
                current: 'temperature_2m,precipitation,weather_code,wind_speed_10m,visibility',
                timezone: 'auto',
            },
            timeout: 5000,
        });

        if (!response.data || !response.data.current) {
            throw new Error('Invalid weather data response');
        }

        const current = response.data.current;

        return {
            temperature: current.temperature_2m,
            precipitation: current.precipitation || 0,
            weatherCode: current.weather_code,
            windSpeed: current.wind_speed_10m || 0,
            visibility: current.visibility || 10000, // Default to 10km if not available
            timestamp: current.time,
        };
    } catch (error) {
        console.error('Weather API error:', error.message);
        // Return null on error - we'll handle gracefully
        return null;
    }
};

/**
 * Get human-readable weather description from weather code
 * @param {number} code - Weather code from Open-Meteo
 * @returns {string} Weather description
 */
const getWeatherDescription = (code) => {
    const weatherDescriptions = {
        0: 'Clear sky',
        1: 'Mainly clear',
        2: 'Partly cloudy',
        3: 'Overcast',
        45: 'Foggy',
        48: 'Depositing rime fog',
        51: 'Light drizzle',
        53: 'Moderate drizzle',
        55: 'Dense drizzle',
        61: 'Slight rain',
        63: 'Moderate rain',
        65: 'Heavy rain',
        66: 'Light freezing rain',
        67: 'Heavy freezing rain',
        71: 'Slight snow',
        73: 'Moderate snow',
        75: 'Heavy snow',
        77: 'Snow grains',
        80: 'Slight rain showers',
        81: 'Moderate rain showers',
        82: 'Violent rain showers',
        85: 'Slight snow showers',
        86: 'Heavy snow showers',
        95: 'Thunderstorm',
        96: 'Thunderstorm with slight hail',
        99: 'Thunderstorm with heavy hail',
    };

    return weatherDescriptions[code] || 'Unknown';
};

/**
 * Classify weather as good or bad based on conditions
 * @param {Object} weatherData - Weather data from getWeatherData
 * @returns {boolean} True if bad weather, false otherwise
 */
const isBadWeather = (weatherData) => {
    if (!weatherData) {
        // If we can't get weather data, assume good weather (don't penalize)
        return false;
    }

    const { precipitation, weatherCode, windSpeed, visibility } = weatherData;

    // Check for heavy precipitation
    if (precipitation > BAD_WEATHER_THRESHOLDS.HEAVY_RAIN_MM_PER_HOUR) {
        return true;
    }

    // Check for severe weather codes
    const allSevereWeatherCodes = [
        ...SEVERE_WEATHER_CODES.THUNDERSTORM,
        ...SEVERE_WEATHER_CODES.SNOW,
        ...SEVERE_WEATHER_CODES.FREEZING_RAIN,
    ];

    if (allSevereWeatherCodes.includes(weatherCode)) {
        return true;
    }

    // Check for poor visibility
    if (visibility < BAD_WEATHER_THRESHOLDS.POOR_VISIBILITY_M) {
        return true;
    }

    // Check for strong winds
    if (windSpeed > BAD_WEATHER_THRESHOLDS.STRONG_WIND_KMH) {
        return true;
    }

    return false;
};

/**
 * Get weather information for both start and destination of a ride
 * @param {number} startLat - Start latitude
 * @param {number} startLng - Start longitude
 * @param {number} destLat - Destination latitude
 * @param {number} destLng - Destination longitude
 * @returns {Promise<Object>} Weather information for both locations
 */
const getWeatherForRide = async (startLat, startLng, destLat, destLng) => {
    try {
        // Fetch weather data for both locations in parallel
        const [startWeatherData, destWeatherData] = await Promise.all([
            getWeatherData(startLat, startLng),
            getWeatherData(destLat, destLng),
        ]);

        const startWeather = {
            condition: startWeatherData ? getWeatherDescription(startWeatherData.weatherCode) : 'Unknown',
            isBad: isBadWeather(startWeatherData),
            temperature: startWeatherData?.temperature || null,
            precipitation: startWeatherData?.precipitation || 0,
            windSpeed: startWeatherData?.windSpeed || 0,
            visibility: startWeatherData?.visibility || null,
            weatherCode: startWeatherData?.weatherCode || null,
        };

        const destWeather = {
            condition: destWeatherData ? getWeatherDescription(destWeatherData.weatherCode) : 'Unknown',
            isBad: isBadWeather(destWeatherData),
            temperature: destWeatherData?.temperature || null,
            precipitation: destWeatherData?.precipitation || 0,
            windSpeed: destWeatherData?.windSpeed || 0,
            visibility: destWeatherData?.visibility || null,
            weatherCode: destWeatherData?.weatherCode || null,
        };

        // Determine if weather surcharge should be applied
        const hasBadWeather = startWeather.isBad || destWeather.isBad;

        return {
            startWeather,
            destWeather,
            hasBadWeather,
            weatherSurchargeApplicable: hasBadWeather,
        };
    } catch (error) {
        console.error('Error fetching weather for ride:', error.message);
        // Return safe defaults on error
        return {
            startWeather: {
                condition: 'Unknown',
                isBad: false,
                temperature: null,
                precipitation: 0,
                windSpeed: 0,
                visibility: null,
                weatherCode: null,
            },
            destWeather: {
                condition: 'Unknown',
                isBad: false,
                temperature: null,
                precipitation: 0,
                windSpeed: 0,
                visibility: null,
                weatherCode: null,
            },
            hasBadWeather: false,
            weatherSurchargeApplicable: false,
        };
    }
};

module.exports = {
    getWeatherData,
    getWeatherDescription,
    isBadWeather,
    getWeatherForRide,
    BAD_WEATHER_THRESHOLDS,
};
