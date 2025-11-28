import { geocodePlace } from './weatherApi';

interface DistanceResult {
    origin: string;
    destination: string;
    distanceKm: number;
    durationMin: number;
}

export async function calculateDistance(originName: string, destName: string): Promise<DistanceResult | null> {
    try {
        const originGeo = await geocodePlace(originName);
        const destGeo = await geocodePlace(destName);

        if (!originGeo || !destGeo) {
            return null;
        }

        // OSRM expects {longitude},{latitude}
        const coordinates = `${originGeo.lon},${originGeo.lat};${destGeo.lon},${destGeo.lat}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`;

        const response = await fetch(url);
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const route = data.routes[0];
            const distanceKm = (route.distance / 1000).toFixed(1); // meters to km
            const durationMin = Math.round(route.duration / 60); // seconds to minutes

            return {
                origin: originGeo.name,
                destination: destGeo.name,
                distanceKm: parseFloat(distanceKm),
                durationMin: durationMin
            };
        }
    } catch (error) {
        console.error("OSRM Error:", error);
    }
    return null;
}
