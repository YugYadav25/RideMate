export type RideDetails = {
  distanceKm: number;
  durationMinutes: number;
  cost: number;
  pricePerRider: number;
  driverEarning: number;
  platformFee: number;
  fallback?: boolean;
};

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 500;
const EARTH_RADIUS_KM = 6371;
const FALLBACK_SPEED_KMPH = 40;

// Pricing Constants
const FUEL_PRICE_PER_LITER = 100; // pf
const FUEL_EFFICIENCY_KM_PER_LITER = 15; // ef
const WEAR_TEAR_COST_PER_KM = 5; // w
const DRIVER_TIME_RATE_PER_MIN = 2; // rt
const PROFIT_MARGIN = 0.20; // m
const PLATFORM_FEE_RATE = 0.10; // a
const MIN_FARE_PER_RIDER = 50; // fmin
const LONG_TRIP_THRESHOLD_KM = 500; // dt
const REDUCED_PROFIT_MARGIN = 0.10; // mt

const toTwoDecimals = (value: number) => Number(value.toFixed(2));

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const haversineDistanceKm = (startLat: number, startLon: number, destLat: number, destLon: number) => {
  const toRadians = (value: number) => (value * Math.PI) / 180;

  const dLat = toRadians(destLat - startLat);
  const dLon = toRadians(destLon - startLon);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(startLat)) * Math.cos(toRadians(destLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
};

const calculateCost = (distanceKm: number, durationMinutes: number, seats: number = 1) => {
  const d = distanceKm;
  const t = durationMinutes;
  const n = Math.max(1, seats); // Ensure at least 1 rider to avoid division by zero

  // Fuel cost
  const fuelCost = (d / FUEL_EFFICIENCY_KM_PER_LITER) * FUEL_PRICE_PER_LITER;

  // Wear-and-tear cost
  const wearCost = d * WEAR_TEAR_COST_PER_KM;

  // Driver time compensation
  const timeCost = t * DRIVER_TIME_RATE_PER_MIN;

  // Operating cost
  const operatingCost = fuelCost + wearCost + timeCost;

  // Driver profit
  let profitMargin = PROFIT_MARGIN;
  if (d > LONG_TRIP_THRESHOLD_KM) {
    profitMargin = REDUCED_PROFIT_MARGIN;
  }
  const profit = operatingCost * profitMargin;

  // Driver total compensation
  const driverTotal = operatingCost + profit;

  // App fee
  const appFee = driverTotal * PLATFORM_FEE_RATE;

  // Total trip cost
  const totalCost = driverTotal + appFee;

  // Price per rider
  let pricePerRider = totalCost / n;
  if (pricePerRider < MIN_FARE_PER_RIDER) {
    pricePerRider = MIN_FARE_PER_RIDER;
  }

  // Recalculate total cost if min fare was applied? 
  // The user requirement says "if price_per_rider < fmin, use fmin instead".
  // It doesn't explicitly say to update total_cost based on fmin, but usually total cost is what the rider pays.
  // However, total_cost here seems to be the total trip value. 
  // Let's stick to the formula: price_per_rider is the final output for the user.
  // But for the system, we might want to store the "official" total cost.
  // If we enforce min fare, the total collected might be higher than calculated totalCost.
  // Let's assume totalCost remains the "calculated" cost, but pricePerRider is what's displayed/charged.
  // Actually, if pricePerRider is adjusted, the total effective cost is pricePerRider * n.

  return {
    cost: toTwoDecimals(totalCost),
    pricePerRider: toTwoDecimals(pricePerRider),
    driverEarning: toTwoDecimals(driverTotal),
    platformFee: toTwoDecimals(appFee)
  };
};

const buildResult = (distanceKm: number, durationMinutes: number, seats: number, fallback = false): RideDetails => {
  const pricing = calculateCost(distanceKm, durationMinutes, seats);

  return {
    distanceKm: toTwoDecimals(distanceKm),
    durationMinutes,
    cost: pricing.cost,
    pricePerRider: pricing.pricePerRider,
    driverEarning: pricing.driverEarning,
    platformFee: pricing.platformFee,
    fallback: fallback || undefined,
  };
};

export const calculateRideDetails = async (
  startLat: number,
  startLon: number,
  destLat: number,
  destLon: number,
  seats: number = 1
): Promise<RideDetails> => {
  const url = `${OSRM_BASE_URL}/${startLon},${startLat};${destLon},${destLat}?overview=false`;
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`OSRM request failed with status ${response.status}`);
      }

      const data = await response.json();
      const firstRoute = data?.routes?.[0];

      if (!firstRoute) {
        throw new Error('OSRM response missing route data');
      }

      const distanceKm = firstRoute.distance / 1000;
      const durationMinutes = Math.max(1, Math.round(firstRoute.duration / 60));

      return buildResult(distanceKm, durationMinutes, seats);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS);
      }
    }
  }

  const fallbackDistance = Math.max(haversineDistanceKm(startLat, startLon, destLat, destLon), 0.5);
  const durationMinutes = Math.max(1, Math.round((fallbackDistance / FALLBACK_SPEED_KMPH) * 60));

  if (!fallbackDistance || Number.isNaN(fallbackDistance)) {
    throw lastError instanceof Error ? lastError : new Error('OSRM request failed and fallback unavailable');
  }

  return buildResult(fallbackDistance, durationMinutes, seats, true);
};

