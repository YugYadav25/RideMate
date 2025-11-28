export interface WeatherCondition {
    condition: string;
    isBad: boolean;
    temperature: number | null;
    precipitation: number;
    windSpeed: number;
    visibility: number | null;
    weatherCode: number | null;
}

export interface WeatherData {
    startWeather: WeatherCondition | null;
    destWeather: WeatherCondition | null;
    hasBadWeather: boolean;
}

export interface RideWithWeather {
    basePrice: number;
    weatherSurcharge: number;
    weatherData: WeatherData | null;
}

/**
 * Get weather icon emoji based on weather code
 */
export const getWeatherIcon = (weatherCode: number | null): string => {
    if (!weatherCode) return '🌤️';

    if (weatherCode === 0) return '☀️';
    if (weatherCode >= 1 && weatherCode <= 3) return '⛅';
    if (weatherCode >= 45 && weatherCode <= 48) return '🌫️';
    if (weatherCode >= 51 && weatherCode <= 67) return '🌧️';
    if (weatherCode >= 71 && weatherCode <= 77) return '❄️';
    if (weatherCode >= 80 && weatherCode <= 82) return '🌧️';
    if (weatherCode >= 85 && weatherCode <= 86) return '🌨️';
    if (weatherCode >= 95 && weatherCode <= 99) return '⛈️';

    return '🌤️';
};

/**
 * Get weather condition color based on severity
 */
export const getWeatherColor = (isBad: boolean): string => {
    return isBad ? 'text-red-600' : 'text-green-600';
};

/**
 * Get weather badge background color
 */
export const getWeatherBadgeColor = (isBad: boolean): string => {
    return isBad ? 'bg-red-100 border-red-300' : 'bg-green-100 border-green-300';
};

/**
 * Format weather condition for display
 */
export const formatWeatherCondition = (weather: WeatherCondition | null): string => {
    if (!weather) return 'Unknown';

    const parts: string[] = [];

    if (weather.condition) {
        parts.push(weather.condition);
    }

    if (weather.temperature !== null) {
        parts.push(`${Math.round(weather.temperature)}°C`);
    }

    return parts.join(' • ') || 'Unknown';
};

/**
 * Format price with currency symbol
 */
export const formatPrice = (price: number): string => {
    return `₹${price.toFixed(2)}`;
};

/**
 * Calculate total price including weather surcharge
 */
export const calculateTotalPrice = (basePrice: number, weatherSurcharge: number): number => {
    return basePrice + weatherSurcharge;
};
