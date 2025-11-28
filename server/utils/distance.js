const toRadians = (deg) => (deg * Math.PI) / 180;

/**
 * Calculate the great-circle distance between two points on Earth using the Haversine formula
 * @param {Object} a - First point with lat and lng properties
 * @param {Object} b - Second point with lat and lng properties
 * @returns {number} Distance in kilometers, or Infinity if invalid coordinates
 */
const haversineDistanceKm = (a, b) => {
    if (!a || !b || (a.lat === 0 && a.lng === 0) || (b.lat === 0 && b.lng === 0)) {
        return Number.POSITIVE_INFINITY;
    }
    const R = 6371; // Earth radius in km
    const dLat = toRadians(b.lat - a.lat);
    const dLng = toRadians(b.lng - a.lng);
    const lat1 = toRadians(a.lat);
    const lat2 = toRadians(b.lat);

    const sinLat = Math.sin(dLat / 2);
    const sinLng = Math.sin(dLng / 2);

    const aVal = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
    const c = 2 * Math.atan2(Math.sqrt(aVal), Math.sqrt(1 - aVal));
    return R * c;
};

module.exports = { toRadians, haversineDistanceKm };
