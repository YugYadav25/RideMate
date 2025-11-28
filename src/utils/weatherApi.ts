interface GeocodeResult {
    name: string;
    lat: number;
    lon: number;
    timezone: string;
    country: string;
}



interface WeatherResult {
    place: string;
    current_time: string; // Formatted HH:MM
    display_date: string; // Today, Tomorrow, or Date
    temperature: number;
    precipitation: number;
    condition: string;
    is_forecast: boolean;
}

const GEOCODE_CACHE_KEY = 'ridemate_geocode_cache_v6';
const WEATHER_CACHE_KEY = 'ridemate_weather_cache';

// Helper to manage local storage cache
const getCache = (key: string) => {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : {};
    } catch {
        return {};
    }
};

const setCache = (key: string, data: any) => {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
        console.error("Cache save failed", e);
    }
};

export async function geocodePlace(placeName: string): Promise<GeocodeResult | null> {
    const cache = getCache(GEOCODE_CACHE_KEY);
    const cacheEntry = cache[placeName.toLowerCase()];

    // 24 hour cache for geocoding
    if (cacheEntry && (Date.now() - cacheEntry.timestamp < 24 * 60 * 60 * 1000)) {
        console.log('Geocode cache hit for', placeName);
        return cacheEntry.data;
    }

    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(placeName)}&count=1&language=en&format=json`);
        const data = await response.json();

        if (data.results && data.results.length > 0) {
            const result = data.results[0];

            const geoResult: GeocodeResult = {
                name: result.name,
                lat: result.latitude,
                lon: result.longitude,
                timezone: result.timezone || 'UTC',
                country: result.country
            };

            cache[placeName.toLowerCase()] = {
                timestamp: Date.now(),
                data: geoResult
            };
            setCache(GEOCODE_CACHE_KEY, cache);

            return geoResult;
        }
    } catch (error) {
        console.error("Geocoding error:", error);
    }
    return null;
}

function getWeatherCondition(code: number): string {
    // WMO Weather interpretation codes (WW)
    // https://open-meteo.com/en/docs
    if (code === 0) return "Clear sky";
    if (code === 1 || code === 2 || code === 3) return "Mainly clear, partly cloudy, and overcast";
    if (code === 45 || code === 48) return "Fog and depositing rime fog";
    if (code >= 51 && code <= 55) return "Drizzle";
    if (code >= 61 && code <= 65) return "Rain";
    if (code >= 71 && code <= 77) return "Snow";
    if (code >= 80 && code <= 82) return "Rain showers";
    if (code >= 95) return "Thunderstorm";
    return "Unknown";
}

export async function getWeatherForLatLon(
    lat: number,
    lon: number,
    targetDate: Date,
    timezone: string
): Promise<WeatherResult | null> {
    // Round to nearest hour
    targetDate.setMinutes(0, 0, 0);

    const cacheKey = `${lat.toFixed(2)},${lon.toFixed(2)},${targetDate.getTime()}`;
    const cache = getCache(WEATHER_CACHE_KEY);
    const cacheEntry = cache[cacheKey];

    // 5 minute cache for weather
    if (cacheEntry && (Date.now() - cacheEntry.timestamp < 5 * 60 * 1000)) {
        console.log('Weather cache hit');
        return cacheEntry.data;
    }

    try {
        // Open-Meteo requires YYYY-MM-DD format
        const dateStr = targetDate.toISOString().split('T')[0];

        // We ask for 1 day of data to find the specific hour easily
        // Note: Open-Meteo handles historical vs forecast automatically based on date
        // But for simplicity, we use the forecast endpoint which also contains recent history
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,precipitation,weathercode&start_date=${dateStr}&end_date=${dateStr}&timezone=${encodeURIComponent(timezone)}`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.hourly) {
            const hourly = data.hourly;
            // Find the index for the requested hour
            // The API returns time in ISO8601 but in local time if timezone is specified, 
            // OR we can just match the hour.
            // Let's match the hour string "YYYY-MM-DDTHH:00"

            // Construct local time string expected from API
            // This is a bit tricky without a library like date-fns-tz, but Open-Meteo returns an array of time strings.
            // We can just find the one that matches our target hour.

            // Let's try to find the closest time index
            // Since we requested start_date = end_date = targetDate's date, the array should cover that day.
            // We just need the hour index.
            const targetHour = targetDate.getHours();
            const index = targetHour; // Since it starts at 00:00 and is hourly, index should match hour (0-23)

            if (index >= 0 && index < hourly.time.length) {
                // Determine display date
                const today = new Date();
                const tomorrow = new Date(today);
                tomorrow.setDate(tomorrow.getDate() + 1);

                let displayDate = dateStr;
                if (dateStr === today.toISOString().split('T')[0]) displayDate = "Today";
                else if (dateStr === tomorrow.toISOString().split('T')[0]) displayDate = "Tomorrow";

                // Format time HH:MM
                const timeStr = `${targetHour.toString().padStart(2, '0')}:00`;

                const result: WeatherResult = {
                    place: `${lat}, ${lon}`, // Caller will overwrite with name
                    current_time: timeStr,
                    display_date: displayDate,
                    temperature: hourly.temperature_2m[index],
                    precipitation: hourly.precipitation[index],
                    condition: getWeatherCondition(hourly.weathercode[index]),
                    is_forecast: targetDate.getTime() > Date.now()
                };

                cache[cacheKey] = {
                    timestamp: Date.now(),
                    data: result
                };
                setCache(WEATHER_CACHE_KEY, cache);
                return result;
            }
        }
    } catch (error) {
        console.error("Weather API error:", error);
    }
    return null;
}
