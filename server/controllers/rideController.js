const Ride = require('../models/Ride');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const { validateRideInput } = require('../utils/validate');
const { geocode } = require('../utils/geocoding');
const { createNotification } = require('./notificationController');
const { haversineDistanceKm } = require('../utils/distance');

const parseRideDateTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const isoTime = timeStr.length === 5 ? `${timeStr}:00` : timeStr;
  const candidate = new Date(`${dateStr}T${isoTime}Z`);
  if (isNaN(candidate.getTime())) {
    // Try without forcing UTC
    const fallback = new Date(`${dateStr}T${isoTime}`);
    return isNaN(fallback.getTime()) ? null : fallback;
  }
  return candidate;
};

const normalizeScore = (value, max) => {
  if (value === null || value === undefined || !isFinite(value)) {
    return 0;
  }
  const clamped = Math.min(Math.max(value, 0), max);
  return 1 - clamped / max;
};

const computeMatchScore = ({ pickupDistanceKm, dropDistanceKm, timeDiffMinutes, routeSimilarity }) => {
  const pickupScore = normalizeScore(pickupDistanceKm, 20);
  const dropScore = normalizeScore(dropDistanceKm, 20);
  const timeScore = timeDiffMinutes === null ? 0.5 : normalizeScore(timeDiffMinutes, 180);
  const similarityScore = routeSimilarity ?? ((pickupScore + dropScore) / 2);
  // Weighted sum prioritizing pickup/drop proximity
  return (
    pickupScore * 0.35 +
    dropScore * 0.35 +
    timeScore * 0.2 +
    similarityScore * 0.1
  );
};

const classifyMatch = ({ pickupDistanceKm, dropDistanceKm, timeDiffMinutes }) => {
  const withinPerfect =
    pickupDistanceKm <= 5 && dropDistanceKm <= 5 && (timeDiffMinutes ?? 0) <= 60;
  if (withinPerfect) return 'perfect';

  const withinGood =
    pickupDistanceKm <= 8 && dropDistanceKm <= 8 && (timeDiffMinutes ?? 0) <= 90;
  if (withinGood) return 'good';

  const withinNearby =
    pickupDistanceKm <= 15 && dropDistanceKm <= 15 && (timeDiffMinutes ?? 0) <= 120;
  return withinNearby ? 'nearby' : null;
};

const updateUserRating = async (userId, rating) => {
  if (!userId || typeof rating !== 'number') return;
  const user = await User.findById(userId);
  if (!user) return;

  const totalReviews = user.totalReviews || 0;
  const currentRating = user.rating || 5;
  const newTotal = totalReviews + 1;
  const newRating = ((currentRating * totalReviews) + rating) / newTotal;

  user.rating = parseFloat(newRating.toFixed(1));
  user.totalReviews = newTotal;
  await user.save();
};

const resolveLocationInput = async (input, fieldName) => {
  if (!input) {
    throw new Error(`Missing ${fieldName} location`);
  }

  if (typeof input === 'string') {
    const geocoded = await geocode(input);
    if (!geocoded) {
      throw new Error(`Could not geocode ${fieldName}: ${input}`);
    }
    return {
      label: geocoded.name || input,
      coordinates: { lat: geocoded.lat, lng: geocoded.lng },
    };
  }

  const lat =
    input.lat ??
    input.latitude ??
    input.coordinates?.lat ??
    input.coordinates?.latitude;
  const lng =
    input.lng ??
    input.longitude ??
    input.coordinates?.lng ??
    input.coordinates?.longitude;

  if (lat === undefined || lng === undefined) {
    // Attempt to geocode using human-friendly label
    const fallbackName = input.label || input.name;
    if (fallbackName) {
      const geocoded = await geocode(fallbackName);
      if (geocoded) {
        return {
          label: geocoded.name || fallbackName,
          coordinates: { lat: geocoded.lat, lng: geocoded.lng },
        };
      }
    }
    throw new Error(`Incomplete coordinates for ${fieldName}`);
  }

  return {
    label: input.label || input.name || fieldName,
    coordinates: { lat: parseFloat(lat), lng: parseFloat(lng) },
  };
};

// Transform ride to match frontend format
const transformRide = (ride) => {
  if (!ride) return null;

  const rideObj = ride.toObject ? ride.toObject() : ride;

  // Handle driver - could be populated object or just ID
  const driverName = rideObj.driver?.name || (typeof rideObj.driver === 'string' ? 'Unknown' : 'Unknown');
  const driverRating = rideObj.driver?.rating || 4.5;

  // Handle vehicle details (populated)
  let vehicleDetails = null;
  if (rideObj.vehicle) {
    vehicleDetails = {
      _id: rideObj.vehicle._id.toString(),
      registrationNumber: rideObj.vehicle.registrationNumber,
      model: rideObj.vehicle.model,
      make: rideObj.vehicle.make,
      color: rideObj.vehicle.color,
      type: rideObj.vehicle.vehicleType,
      seatingLimit: rideObj.vehicle.seatingLimit
    };
  }

  return {
    _id: rideObj._id.toString(),
    id: rideObj._id.toString(),
    driver: {
      name: driverName,
      rating: driverRating,
      id: rideObj.driver?._id?.toString(),
      verificationStatus: rideObj.driver?.verificationStatus || 'unverified'
    },
    start: {
      label: rideObj.from || '',
      coordinates: {
        // GeoJSON format: coordinates is [lng, lat]
        lat: rideObj.startCoordinates?.coordinates?.[1] || rideObj.startCoordinates?.lat || 0,
        lng: rideObj.startCoordinates?.coordinates?.[0] || rideObj.startCoordinates?.lng || 0,
      },
    },
    destination: {
      label: rideObj.to || '',
      coordinates: {
        // GeoJSON format: coordinates is [lng, lat]
        lat: rideObj.destCoordinates?.coordinates?.[1] || rideObj.destCoordinates?.lat || 0,
        lng: rideObj.destCoordinates?.coordinates?.[0] || rideObj.destCoordinates?.lng || 0,
      },
    },
    date: rideObj.date || '',
    time: rideObj.time || '',
    status: rideObj.isActive !== false ? 'Active' : 'Completed',
    rideStatus: rideObj.rideStatus || 'pending',
    startTime: rideObj.startTime ? rideObj.startTime.toISOString() : null,
    endTime: rideObj.endTime ? rideObj.endTime.toISOString() : null,
    seats: {
      total: (rideObj.seatsAvailable || 0) + (rideObj.participants?.reduce((sum, p) => sum + (p.seatsBooked || 1), 0) || 0),
      available: rideObj.seatsAvailable || 0,
    },
    notes: rideObj.notes || '',
    requests: (rideObj.requests || []).map(req => ({
      _id: req._id?.toString() || '',
      rider: req.rider?._id ? {
        id: req.rider._id.toString(),
        name: req.rider.name || req.name || 'Unknown',
        email: req.rider.email || '',
        phone: req.rider.phone || '',
      } : null,
      name: req.rider?.name || req.name || 'Unknown',
      rating: req.rating || 5,
      status: req.status || 'Pending',
      seatsRequested: req.seatsRequested || 1,
      addons: req.addons,
      addonCharges: req.addonCharges,
      finalCost: req.finalCost,
      riderReview: req.riderReview,
      driverReview: req.driverReview,
      driverRated: !!req.driverRated,
      riderRatedDriver: !!req.riderRatedDriver,
      createdAt: req.createdAt ? req.createdAt.toISOString() : new Date().toISOString(),
    })),
    participants: (rideObj.participants || []).map(part => ({
      rider: part.rider?._id ? {
        id: part.rider._id.toString(),
        name: part.rider.name || part.name || 'Unknown',
        email: part.rider.email || '',
        phone: part.rider.phone || '',
      } : null,
      name: part.rider?.name || part.name || 'Unknown',
      status: part.status || 'Confirmed',
      seatsBooked: part.seatsBooked || 1,
      addons: part.addons,
      finalCost: part.finalCost,
    })),
    vehicle: vehicleDetails,
    driverLocation: rideObj.driverLocation?.coordinates ? {
      lat: rideObj.driverLocation.coordinates[1],
      lng: rideObj.driverLocation.coordinates[0],
    } : null,
    createdAt: rideObj.createdAt ? rideObj.createdAt.toISOString() : new Date().toISOString(),
    updatedAt: rideObj.updatedAt ? rideObj.updatedAt.toISOString() : new Date().toISOString(),
  };
};

// @desc    Create a new ride
// @route   POST /api/rides
// @access  Private (Driver only)
const createRide = async (req, res, next) => {
  try {
    console.log(`[Ride] Create request by user: ${req.user.id}`);
    let from, to, startCoordsGeoJSON, destCoordsGeoJSON;

    // Handle location input - can be place name (string) or object with coordinates
    if (req.body.start && req.body.destination) {
      // New format from frontend
      from = req.body.start.label || req.body.start.name || req.body.start;
      to = req.body.destination.label || req.body.destination.name || req.body.destination;

      // Check if coordinates are provided
      const startLat = req.body.start.lat || req.body.start.coordinates?.lat;
      const startLng = req.body.start.lng || req.body.start.coordinates?.lng;
      const destLat = req.body.destination.lat || req.body.destination.coordinates?.lat;
      const destLng = req.body.destination.lng || req.body.destination.coordinates?.lng;

      // If coordinates provided, use them; otherwise geocode the place name
      if (startLat && startLng) {
        startCoordsGeoJSON = {
          type: 'Point',
          coordinates: [parseFloat(startLng), parseFloat(startLat)], // GeoJSON: [lng, lat]
        };
      } else if (typeof from === 'string' && from.trim()) {
        // Geocode the location name
        try {
          const geocoded = await geocode(from);
          if (geocoded) {
            startCoordsGeoJSON = {
              type: 'Point',
              coordinates: [geocoded.lng, geocoded.lat],
            };
            from = geocoded.name; // Use the geocoded name
          } else {
            return res.status(400).json({
              success: false,
              message: `Could not find location: ${from}`,
            });
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: `Geocoding failed for start location: ${error.message}`,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Start location is required (provide name or coordinates)',
        });
      }

      if (destLat && destLng) {
        destCoordsGeoJSON = {
          type: 'Point',
          coordinates: [parseFloat(destLng), parseFloat(destLat)],
        };
      } else if (typeof to === 'string' && to.trim()) {
        // Geocode the location name
        try {
          const geocoded = await geocode(to);
          if (geocoded) {
            destCoordsGeoJSON = {
              type: 'Point',
              coordinates: [geocoded.lng, geocoded.lat],
            };
            to = geocoded.name; // Use the geocoded name
          } else {
            return res.status(400).json({
              success: false,
              message: `Could not find location: ${to}`,
            });
          }
        } catch (error) {
          return res.status(400).json({
            success: false,
            message: `Geocoding failed for destination: ${error.message}`,
          });
        }
      } else {
        return res.status(400).json({
          success: false,
          message: 'Destination location is required (provide name or coordinates)',
        });
      }
    } else if (req.body.from && req.body.to) {
      // Old format - geocode place names
      from = req.body.from.trim();
      to = req.body.to.trim();

      try {
        const [startGeocoded, destGeocoded] = await Promise.all([
          geocode(from),
          geocode(to),
        ]);

        if (!startGeocoded) {
          return res.status(400).json({
            success: false,
            message: `Could not find start location: ${from}`,
          });
        }
        if (!destGeocoded) {
          return res.status(400).json({
            success: false,
            message: `Could not find destination: ${to}`,
          });
        }

        startCoordsGeoJSON = {
          type: 'Point',
          coordinates: [startGeocoded.lng, startGeocoded.lat],
        };
        destCoordsGeoJSON = {
          type: 'Point',
          coordinates: [destGeocoded.lng, destGeocoded.lat],
        };
        from = startGeocoded.name;
        to = destGeocoded.name;
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: `Geocoding failed: ${error.message}`,
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: start/from and destination/to locations',
      });
    }

    // Validate other required fields
    if (!req.body.date || !req.body.time) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: date, time',
      });
    }

    const seats = req.body.seats || req.body.seatsAvailable || 1;
    const price = req.body.price || 0;

    // Handle vehicle ID
    const vehicleId = req.body.vehicleId || null;
    if (vehicleId) {
      const vehicle = await Vehicle.findById(vehicleId);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehicle not found',
        });
      }
      if (vehicle.driver.toString() !== req.user.id) {
        return res.status(403).json({
          success: false,
          message: 'You are not authorized to use this vehicle',
        });
      }
    }

    // Handle driver location (lat/lng from request body)
    let driverLocationGeoJSON = null;
    if (req.body.driverLocation) {
      const driverLat = req.body.driverLocation.lat || req.body.driverLocation.latitude;
      const driverLng = req.body.driverLocation.lng || req.body.driverLocation.longitude;
      if (driverLat && driverLng) {
        driverLocationGeoJSON = {
          type: 'Point',
          coordinates: [parseFloat(driverLng), parseFloat(driverLat)], // GeoJSON: [lng, lat]
        };
      }
    }

    // Update driver's location in User model if provided
    if (driverLocationGeoJSON) {
      await User.findByIdAndUpdate(req.user.id, {
        location: driverLocationGeoJSON,
      });
    }

    const ride = await Ride.create({
      driver: req.user.id,
      from: from.trim(),
      to: to.trim(),
      startCoordinates: startCoordsGeoJSON,
      destCoordinates: destCoordsGeoJSON,
      date: req.body.date,
      time: req.body.time,
      duration: parseFloat(req.body.duration || 2),
      price: parseFloat(price),
      seatsAvailable: parseInt(seats),
      notes: req.body.notes || '',
      requests: [],
      participants: [],
      isActive: true,
      vehicle: vehicleId,
      driverLocation: driverLocationGeoJSON || startCoordsGeoJSON,
    });

    const populatedRide = await Ride.findById(ride._id).populate({
      path: 'driver',
      select: 'name email phone role verificationStatus',
    }).populate('vehicle');

    console.log(`[Ride] Created successfully: ${ride._id}`);

    res.status(201).json(transformRide(populatedRide));
  } catch (error) {
    console.error(`[Ride] Create error:`, error);
    next(error);
  }
};

// @desc    Get all rides
// @route   GET /api/rides
// @access  Public
const getRides = async (req, res, next) => {
  try {
    // console.log(`[Ride] GetRides request with query:`, req.query); // Commented out to reduce noise
    const {
      from,
      to,
      date,
      isActive,
      nearStart,
      nearDest,
      radius,
      driver,
      driverId,
      participant,
      participantId,
    } = req.query;

    // Build query
    const query = {};

    // Text-based search (for backward compatibility)
    if (from && !nearStart) {
      query.from = { $regex: from, $options: 'i' };
    }

    if (to && !nearDest) {
      query.to = { $regex: to, $options: 'i' };
    }

    // Geo-based search for start location
    if (nearStart) {
      try {
        const geocoded = await geocode(nearStart);
        if (geocoded) {
          const searchRadius = parseFloat(radius) || 50000; // Default 50km in meters
          query.startCoordinates = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [geocoded.lng, geocoded.lat],
              },
              $maxDistance: searchRadius,
            },
          };
        }
      } catch (error) {
        console.error('Geocoding error for start location:', error.message);
        // Fallback to text search
        query.from = { $regex: nearStart, $options: 'i' };
      }
    }

    // Geo-based search for destination location
    if (nearDest) {
      try {
        const geocoded = await geocode(nearDest);
        if (geocoded) {
          const searchRadius = parseFloat(radius) || 50000; // Default 50km in meters
          query.destCoordinates = {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [geocoded.lng, geocoded.lat],
              },
              $maxDistance: searchRadius,
            },
          };
        }
      } catch (error) {
        console.error('Geocoding error for destination:', error.message);
        // Fallback to text search
        query.to = { $regex: nearDest, $options: 'i' };
      }
    }

    if (date) {
      query.date = date;
    }

    if (isActive !== undefined) {
      query.isActive = isActive === 'true';
    }

    if (driverId) {
      query.driver = driverId;
    } else if (driver) {
      // Find user by name and filter rides by driver ID
      const driverUser = await User.findOne({ name: driver, role: 'driver' });
      if (driverUser) {
        query.driver = driverUser._id;
      }
    }

    // Filter by participant if provided (for riders to see their booked rides)
    if (participantId) {
      query.$or = [
        { 'participants.rider': participantId },
        { 'requests.rider': participantId }
      ];
    } else if (participant) {
      const participantUser = await User.findOne({ name: participant, role: 'rider' });
      if (participantUser) {
        query.$or = [
          { 'participants.rider': participantUser._id },
          { 'requests.rider': participantUser._id }
        ];
      } else {
        query.$or = [
          { 'participants.name': participant },
          { 'requests.name': participant }
        ];
      }
    }

    // Hide full rides from public search (unless filtering by driver or participant for dashboard views)
    if (!driver && !participant && !driverId && !participantId) {
      query.seatsAvailable = { $gt: 0 };
    }

    // Exclude completed rides from public search (unless filtering by driver or participant for dashboard views)
    if (!driver && !participant && !driverId && !participantId) {
      query.rideStatus = { $ne: 'completed' };
    }

    const rides = await Ride.find(query)
      .populate({
        path: 'driver',
        select: 'name email phone role verificationStatus',
      })
      .populate('vehicle')
      .populate({
        path: 'requests.rider',
        select: 'name email phone rating',
      })
      .populate({
        path: 'participants.rider',
        select: 'name email phone',
      })
      .sort({ date: 1, time: 1 })
      .limit(100);

    // Transform rides to match frontend format
    const transformedRides = rides.map(transformRide);

    res.json(transformedRides);
  } catch (error) {
    console.error(`[Ride] GetRides error:`, error);
    next(error);
  }
};

// @desc    Get single ride
// @route   GET /api/rides/:id
// @access  Public
const getRide = async (req, res, next) => {
  try {
    // console.log(`[Ride] GetRide request for ID: ${req.params.id}`);
    const ride = await Ride.findById(req.params.id)
      .populate({
        path: 'driver',
        select: 'name email phone role verificationStatus',
      })
      .populate('vehicle')
      .populate({
        path: 'requests.rider',
        select: 'name email phone rating',
      })
      .populate({
        path: 'participants.rider',
        select: 'name email phone',
      });

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    res.json(transformRide(ride));
  } catch (error) {
    next(error);
  }
};

// @desc    Update ride
// @route   PUT /api/rides/:id
// @access  Private (Driver only)
const updateRide = async (req, res, next) => {
  try {
    console.log(`[Ride] Update request for ID: ${req.params.id} by User: ${req.user.id}`);
    let ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Make sure user is the driver
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this ride',
      });
    }

    // Validate input if provided
    if (Object.keys(req.body).length > 0) {
      const validation = validateRideInput({ ...ride.toObject(), ...req.body });
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          message: validation.errors.join(', '),
        });
      }
    }

    // Map 'status' field to 'isActive' if provided (for backward compatibility or PATCH requests)
    let isActive = req.body.isActive;
    if (req.body.status === 'Completed') {
      isActive = false;
    } else if (req.body.status === 'Active') {
      isActive = true;
    }

    // Check if ride is being completed (was active, now becoming inactive/completed)
    if (ride.isActive && isActive === false) {
      // Calculate distance
      const start = {
        lat: ride.startCoordinates.coordinates[1],
        lng: ride.startCoordinates.coordinates[0]
      };
      const end = {
        lat: ride.destCoordinates.coordinates[1],
        lng: ride.destCoordinates.coordinates[0]
      };
      const distance = haversineDistanceKm(start, end);

      if (distance > 0 && distance !== Number.POSITIVE_INFINITY) {
        const co2Saved = Math.round(distance * 0.2 * 100) / 100; // 0.2 kg per km
        const points = Math.round(distance * 10);

        // Update Driver
        await User.findByIdAndUpdate(ride.driver, {
          $inc: { co2Saved: co2Saved, greenPoints: points }
        });

        // Update Participants
        for (const participant of ride.participants) {
          if (participant.rider) {
            await User.findByIdAndUpdate(participant.rider, {
              $inc: { co2Saved: co2Saved, greenPoints: points }
            });
          }
        }
      }
    }

    // Update ride
    ride = await Ride.findByIdAndUpdate(
      req.params.id,
      {
        from: req.body.from || ride.from,
        to: req.body.to || ride.to,
        date: req.body.date || ride.date,
        time: req.body.time || ride.time,
        price: req.body.price !== undefined ? parseFloat(req.body.price) : ride.price,
        seatsAvailable: req.body.seatsAvailable !== undefined ? parseInt(req.body.seatsAvailable) : ride.seatsAvailable,
        isActive: isActive !== undefined ? isActive : ride.isActive,
      },
      { new: true, runValidators: true }
    ).populate('driver', 'name rating verificationStatus');

    res.json(transformRide(ride));
  } catch (error) {
    console.error(`[Ride] Update error:`, error);
    next(error);
  }
};

// @desc    Delete ride
// @route   DELETE /api/rides/:id
// @access  Private (Driver only)
const deleteRide = async (req, res, next) => {
  try {
    console.log(`[Ride] Delete request for ID: ${req.params.id} by User: ${req.user.id}`);
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Make sure user is the driver
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this ride',
      });
    }

    await ride.deleteOne();

    console.log(`[Ride] Deleted successfully: ${req.params.id}`);

    res.json({
      success: true,
      message: 'Ride deleted successfully',
    });
  } catch (error) {
    console.error(`[Ride] Delete error:`, error);
    next(error);
  }
};

// @desc    Add a ride request (rider wants to book)
// @route   POST /api/rides/:id/requests
// @access  Private (Rider only)
const addRequest = async (req, res, next) => {
  try {
    console.log(`[Ride] AddRequest for ride: ${req.params.id} by user: ${req.user.id}`);
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Check if ride is active
    if (!ride.isActive) {
      return res.status(400).json({
        success: false,
        message: 'Ride is not active',
      });
    }

    // Check if user is a rider (allow if role is not 'driver' or if role is 'rider')
    // This handles cases where role might be undefined or different
    if (req.user.role === 'driver') {
      return res.status(403).json({
        success: false,
        message: 'Drivers cannot request to book their own rides. Only riders can request to book rides.',
      });
    }

    // Log for debugging if role is unexpected
    if (req.user.role && req.user.role !== 'rider') {
      console.warn(`Unexpected user role: ${req.user.role} for user ${req.user.id}`);
    }

    // Check if rider already has a pending or approved request
    const existingRequest = ride.requests.find(
      (r) => r.rider && r.rider.toString() === req.user.id.toString() && r.status !== 'Rejected'
    );

    if (existingRequest) {
      return res.status(400).json({
        success: false,
        message: 'You have already requested to book this ride',
      });
    }

    // Get seats requested (default 1)
    const seatsRequested = parseInt(req.body.seatsRequested || req.body.seats || 1);

    // Check if enough seats available
    if (ride.seatsAvailable < seatsRequested) {
      return res.status(400).json({
        success: false,
        message: `Only ${ride.seatsAvailable} seat(s) available`,
      });
    }

    // Calculate add-on charges
    const addons = req.body.addons || { firstAid: false, doorToDoor: false };
    let addonCharges = 0;
    if (addons.firstAid) addonCharges += 15;
    if (addons.doorToDoor) addonCharges += 25;

    const finalCost = (ride.price * seatsRequested) + addonCharges;

    // Add request to ride
    const newRequest = {
      rider: req.user.id,
      name: req.user.name || req.body.name || 'Rider',
      rating: req.body.rating || 5,
      status: 'Pending',
      seatsRequested: seatsRequested,
      addons,
      addonCharges,
      finalCost,
    };

    ride.requests.push(newRequest);
    await ride.save();

    // Create a Booking record for the rider (status: Pending)
    await Booking.create({
      ride: ride._id,
      rider: req.user.id,
      seatsBooked: seatsRequested,
      totalPrice: finalCost,
      status: 'Pending',
    });

    // Populate and return updated ride
    const populatedRide = await Ride.findById(ride._id).populate({
      path: 'driver',
      select: 'name email phone role',
    }).populate('vehicle').populate({
      path: 'requests.rider',
      select: 'name email phone',
    });

    console.log(`[Ride] Request added successfully: ${newRequest.rider} to ride ${ride._id}`);

    // Send notification to driver
    try {
      const riderName = req.user.name || 'A rider';
      await createNotification(
        ride.driver,
        'ride_request',
        `${riderName} has requested to join your ride from ${ride.from} to ${ride.to}`,
        ride._id?.toString() || ride._id,
        newRequest._id?.toString()
      );
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    res.status(201).json(transformRide(populatedRide));
  } catch (error) {
    console.error(`[Ride] AddRequest error:`, error);
    next(error);
  }
};

// @desc    Update request status (approve/reject)
// @route   PATCH /api/rides/:id/requests/:requestId
// @access  Private (Driver only, owner only)
const updateRequestStatus = async (req, res, next) => {
  try {
    console.log(`[Ride] UpdateRequestStatus for ride: ${req.params.id}, request: ${req.params.requestId}`);
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Check if user is the driver
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the driver can approve or reject requests',
      });
    }

    let { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status must be either "Approved" or "Rejected"',
      });
    }

    // Find the request
    const request = ride.requests.id(req.params.requestId);
    if (!request) {
      console.error(`Request not found: ${req.params.requestId} in ride ${req.params.id}`);
      return res.status(404).json({
        success: false,
        message: 'Request not found',
      });
    }

    console.log(`Processing request ${req.params.requestId} for ride ${req.params.id}. Status: ${status}, Current: ${request.status}`);

    // Check if request is already processed
    if (request.status === 'Approved' && status === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Request is already approved',
      });
    }

    // Check if payment is required for approval
    if (status === 'Approved' && ride.price > 0) {
      status = 'PaymentPending';
    }

    // Handle "Approved" status (Free rides only, or manual override if we ever allow it)
    if (status === 'Approved' && request.status !== 'Approved') {
      const seatsToBook = request.seatsRequested || 1;

      // Check if enough seats are available
      if (ride.seatsAvailable < seatsToBook) {
        return res.status(400).json({
          success: false,
          message: `Not enough seats available. Requested: ${seatsToBook}, Available: ${ride.seatsAvailable}`,
        });
      }

      // Decrement available seats
      ride.seatsAvailable -= seatsToBook;

      // Add to participants if not already there
      const existingParticipant = ride.participants.find(
        p => p.rider && p.rider.toString() === request.rider.toString()
      );

      if (!existingParticipant) {
        ride.participants.push({
          rider: request.rider,
          name: request.name,
          status: 'Confirmed',
          seatsBooked: seatsToBook,
          addons: request.addons,
          addonCharges: request.addonCharges,
          finalCost: request.finalCost,
        });
      }
    }

    // If changing from Approved to Rejected, restore seats and remove from participants
    if (request.status === 'Approved' && status === 'Rejected') {
      const seatsToRestore = request.seatsRequested || 1;
      ride.seatsAvailable += seatsToRestore;
      // Remove from participants
      ride.participants = ride.participants.filter(
        p => p.rider && p.rider.toString() !== request.rider.toString()
      );
    }

    // PaymentPending check moved up

    // Update the request status
    request.status = status;

    // If Approved (free ride) or PaymentPending, we don't add to participants yet
    // Only add to participants when status is 'Approved' AND (price is 0 OR payment confirmed)
    // Logic handled above.

    // Fix invalid driverLocation if present (legacy data issue)
    if (ride.driverLocation && (!ride.driverLocation.coordinates || ride.driverLocation.coordinates.length === 0)) {
      console.warn('Fixing invalid driverLocation for ride:', ride._id);
      if (ride.startCoordinates && ride.startCoordinates.coordinates) {
        ride.driverLocation = ride.startCoordinates;
      } else {
        ride.driverLocation = { type: 'Point', coordinates: [0, 0] };
      }
    }

    try {
      await ride.save();
      console.log('Ride saved successfully');
    } catch (saveError) {
      console.error('Error saving ride:', saveError);
      throw saveError;
    }

    // Update the corresponding Booking record
    // We match by ride ID and rider ID since we don't store booking ID in the request object yet
    const bookingUpdate = await Booking.findOneAndUpdate(
      { ride: ride._id, rider: request.rider },
      { status: status },
      { new: true }
    );

    if (!bookingUpdate) {
      console.warn(`No booking found for ride ${ride._id} and rider ${request.rider}`);
    } else {
      console.log(`Booking updated: ${bookingUpdate._id}`);
    }

    // Populate and return updated ride
    const populatedRide = await Ride.findById(ride._id).populate({
      path: 'driver',
      select: 'name email phone role',
    }).populate('vehicle').populate({
      path: 'requests.rider',
      select: 'name email phone',
    }).populate({
      path: 'participants.rider',
      select: 'name email phone',
    });

    console.log(`[Ride] Request status updated successfully: ${status}`);

    // Send notification to rider
    try {
      const rider = await User.findById(request.rider);
      const driverName = ride.driver?.name || 'Driver';
      if (status === 'Approved') {
        await createNotification(
          request.rider,
          'request_accepted',
          `${driverName} has accepted your ride request from ${ride.from} to ${ride.to}`,
          ride._id?.toString() || ride._id,
          request._id?.toString()
        );
        if (ride.rideStatus === 'pending') {
          ride.rideStatus = 'accepted';
          await ride.save();
        }
      } else if (status === 'PaymentPending') {
        await createNotification(
          request.rider,
          'payment_required',
          `${driverName} has accepted your request. Please complete payment to confirm.`,
          ride._id?.toString() || ride._id,
          request._id?.toString()
        );
      } else if (status === 'Rejected') {
        await createNotification(
          request.rider,
          'request_rejected',
          `${driverName} has rejected your ride request from ${ride.from} to ${ride.to}`,
          ride._id?.toString() || ride._id,
          request._id?.toString()
        );
        // Update rideStatus to 'rejected' if all requests are rejected
        const hasApprovedRequests = ride.requests.some(r => r.status === 'Approved');
        if (!hasApprovedRequests && ride.requests.every(r => r.status === 'Rejected' || r._id.toString() === request._id.toString())) {
          ride.rideStatus = 'rejected';
          await ride.save();
        }
      }
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    // Re-populate to get updated rideStatus
    const finalRide = await Ride.findById(ride._id).populate({
      path: 'driver',
      select: 'name email phone role',
    }).populate('vehicle').populate({
      path: 'requests.rider',
      select: 'name email phone',
    }).populate({
      path: 'participants.rider',
      select: 'name email phone',
    });

    res.json(transformRide(finalRide));
  } catch (error) {
    console.error(`[Ride] UpdateRequestStatus error:`, error);
    next(error);
  }
};

const findRideMatches = async (req, res, next) => {
  try {
    console.log(`[Ride] FindMatches request`);
    const { pickup, drop, preferredTime, seatsRequired = 1 } = req.body || {};

    if (!pickup || !drop) {
      return res.status(400).json({
        success: false,
        message: 'pickup and drop are required to find rides',
      });
    }

    const riderPickup = await resolveLocationInput(pickup, 'pickup');
    const riderDrop = await resolveLocationInput(drop, 'drop');
    const seatsNeeded = Math.max(parseInt(seatsRequired, 10) || 1, 1);

    let preferredDateTime = null;
    if (preferredTime) {
      const parsed = new Date(preferredTime);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'preferredTime must be a valid date string or ISO timestamp',
        });
      }
      preferredDateTime = parsed;
    }

    const query = {
      isActive: true,
      seatsAvailable: { $gt: 0 },
      rideStatus: { $ne: 'completed' }, // Exclude completed rides from search
    };

    if (preferredDateTime) {
      query.date = preferredDateTime.toISOString().split('T')[0];
    }

    const rides = await Ride.find(query)
      .populate({
        path: 'driver',
        select: 'name email phone role rating',
      })
      .populate('vehicle')
      .populate({
        path: 'requests.rider',
        select: 'name email phone rating',
      })
      .populate({
        path: 'participants.rider',
        select: 'name email phone',
      })
      .limit(200);

    const categorized = {
      perfect: [],
      good: [],
      nearby: [],
    };

    rides.forEach((rideDoc) => {
      if (rideDoc.seatsAvailable < seatsNeeded) return;

      const ride = transformRide(rideDoc);
      const pickupCoordinates = ride.start?.coordinates;
      const dropCoordinates = ride.destination?.coordinates;
      if (!pickupCoordinates || !dropCoordinates) return;

      const pickupDistanceKm = haversineDistanceKm(riderPickup.coordinates, pickupCoordinates);
      const dropDistanceKm = haversineDistanceKm(riderDrop.coordinates, dropCoordinates);
      const rideDateTime = parseRideDateTime(ride.date, ride.time);
      const timeDiffMinutes =
        preferredDateTime && rideDateTime
          ? Math.abs(preferredDateTime.getTime() - rideDateTime.getTime()) / 60000
          : null;

      // Enforce base time window when preferredTime provided
      if (preferredDateTime && timeDiffMinutes !== null && timeDiffMinutes > 120) {
        return;
      }

      const routeSimilarity = (normalizeScore(pickupDistanceKm, 25) + normalizeScore(dropDistanceKm, 25)) / 2;
      const metrics = {
        pickupDistanceKm,
        dropDistanceKm,
        timeDiffMinutes,
        seatsAvailable: rideDoc.seatsAvailable,
        routeSimilarity,
      };

      const bucket = classifyMatch(metrics);
      if (!bucket) return;

      const score = computeMatchScore({
        pickupDistanceKm,
        dropDistanceKm,
        timeDiffMinutes,
        routeSimilarity,
      });

      categorized[bucket].push({
        ride,
        metrics,
        score,
        matchQuality: bucket,
      });
    });

    const sortMatches = (list) =>
      list.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.metrics.pickupDistanceKm !== b.metrics.pickupDistanceKm) {
          return a.metrics.pickupDistanceKm - b.metrics.pickupDistanceKm;
        }
        if (a.metrics.dropDistanceKm !== b.metrics.dropDistanceKm) {
          return a.metrics.dropDistanceKm - b.metrics.dropDistanceKm;
        }
        return (a.metrics.timeDiffMinutes || 0) - (b.metrics.timeDiffMinutes || 0);
      });

    const responsePayload = {
      success: true,
      rider: {
        pickup: riderPickup,
        drop: riderDrop,
        preferredTime: preferredDateTime ? preferredDateTime.toISOString() : null,
        seatsRequired: seatsNeeded,
      },
      matches: {
        perfect: sortMatches(categorized.perfect),
        good: sortMatches(categorized.good),
        nearby: sortMatches(categorized.nearby),
      },
      totals: {
        perfect: categorized.perfect.length,
        good: categorized.good.length,
        nearby: categorized.nearby.length,
      },
    };
    res.json(responsePayload);
  } catch (error) {
    console.error(`[Ride] FindMatches error:`, error);
    next(error);
  }
};

// @desc    Rate a ride (driver or rider)
// @route   POST /api/rides/:id/rate
// @access  Private
const rateRide = async (req, res, next) => {
  try {
    console.log(`[Ride] RateRide request for ride: ${req.params.id} by user: ${req.user.id}`);
    const { rating, type, targetUserId } = req.body;
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    if (ride.rideStatus !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ride must be completed before submitting ratings',
      });
    }

    if (type === 'driver') {
      // Rider rating the driver
      // Find the request for this rider
      const request = ride.requests.find(r => r.rider && r.rider.toString() === req.user.id);
      if (!request) {
        return res.status(403).json({ success: false, message: 'You are not a participant of this ride' });
      }

      if (request.riderRatedDriver) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this driver for this ride',
        });
      }

      await updateUserRating(ride.driver, rating);
      request.riderRatedDriver = true;

    } else if (type === 'rider') {
      // Driver rating a rider
      if (ride.driver.toString() !== req.user.id) {
        return res.status(403).json({ success: false, message: 'Only the driver can rate riders' });
      }

      if (!targetUserId) {
        return res.status(400).json({ success: false, message: 'Target user ID required for rider rating' });
      }

      const request = ride.requests.find(r => r.rider && r.rider.toString() === targetUserId);
      if (!request) {
        return res.status(404).json({ success: false, message: 'Rider request not found' });
      }

      if (request.driverRated) {
        return res.status(400).json({
          success: false,
          message: 'You have already rated this rider for this ride',
        });
      }

      await updateUserRating(targetUserId, rating);
      request.driverRated = true;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid rating type' });
    }

    await ride.save();

    // Return updated ride
    const populatedRide = await Ride.findById(ride._id).populate({
      path: 'driver',
      select: 'name email phone role',
    }).populate('vehicle').populate({
      path: 'requests.rider',
      select: 'name email phone rating',
    });

    console.log(`[Ride] Rated successfully`);
    res.json(transformRide(populatedRide));
  } catch (error) {
    console.error(`[Ride] RateRide error:`, error);
    next(error);
  }
};

// @desc    Delete a ride request (Rider only)
// @route   DELETE /api/rides/:id/requests
// @access  Private
const deleteRequest = async (req, res, next) => {
  try {
    console.log(`[Ride] DeleteRequest for ride: ${req.params.id} by user: ${req.user.id}`);
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Find the request for this rider
    const requestIndex = ride.requests.findIndex(
      (r) => r.rider && r.rider.toString() === req.user.id
    );

    if (requestIndex === -1) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    const request = ride.requests[requestIndex];

    // Only allow deleting Pending or Rejected requests
    // Approved requests must be cancelled via cancelBooking
    if (request.status === 'Approved') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete an approved request. Please cancel the booking instead.'
      });
    }

    // Remove request
    ride.requests.splice(requestIndex, 1);
    await ride.save();

    // Also remove any associated booking (Pending or Rejected)
    await Booking.findOneAndDelete({
      ride: ride._id,
      rider: req.user.id,
      status: { $in: ['Pending', 'Rejected'] }
    });

    console.log(`[Ride] Request deleted successfully`);
    res.json({ success: true, message: 'Request deleted successfully' });
  } catch (error) {
    console.error(`[Ride] DeleteRequest error:`, error);
    next(error);
  }
};

// @desc    Cancel a booking (Rider only)
// @route   POST /api/rides/:id/cancel
// @access  Private
const cancelBooking = async (req, res, next) => {
  try {
    console.log(`[Ride] CancelBooking for ride: ${req.params.id} by user: ${req.user.id}`);
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    // Check if rider is a participant
    const participantIndex = ride.participants.findIndex(
      (p) => p.rider && p.rider.toString() === req.user.id
    );

    if (participantIndex === -1) {
      return res.status(404).json({ success: false, message: 'You are not a participant of this ride' });
    }

    const participant = ride.participants[participantIndex];
    const seatsToRestore = participant.seatsBooked || 1;

    // Remove from participants
    ride.participants.splice(participantIndex, 1);

    // Restore seats
    ride.seatsAvailable += seatsToRestore;

    // Remove the request
    const requestIndex = ride.requests.findIndex(
      (r) => r.rider && r.rider.toString() === req.user.id
    );
    if (requestIndex !== -1) {
      ride.requests.splice(requestIndex, 1);
    }

    await ride.save();

    // Update Booking status to Cancelled
    await Booking.findOneAndUpdate(
      { ride: ride._id, rider: req.user.id },
      { status: 'Cancelled' }
    );

    // Send notification to driver about cancellation
    try {
      const riderName = req.user.name || 'A rider';
      await createNotification(
        ride.driver,
        'request_cancelled',
        `${riderName} has cancelled their booking for the ride from ${ride.from} to ${ride.to}`,
        ride._id?.toString() || ride._id
      );
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    console.log(`[Ride] Booking cancelled successfully`);
    res.json({ success: true, message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error(`[Ride] CancelBooking error:`, error);
    next(error);
  }
};

// @desc    Start a ride (Driver only)
// @route   POST /api/rides/:id/start
// @access  Private (Driver only)
const startRide = async (req, res, next) => {
  try {
    console.log(`[Ride] StartRide for ride: ${req.params.id} by user: ${req.user.id}`);
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Check if user is the driver
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the driver can start the ride',
      });
    }

    // Check if ride can be started
    if (ride.rideStatus === 'started') {
      return res.status(400).json({
        success: false,
        message: 'Ride has already been started',
      });
    }

    if (ride.rideStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot start a completed ride',
      });
    }

    // Check if driver already has another ride that is started
    const existingStartedRide = await Ride.findOne({
      driver: req.user.id,
      rideStatus: 'started',
      _id: { $ne: ride._id }, // Exclude current ride
    });

    if (existingStartedRide) {
      return res.status(400).json({
        success: false,
        message: 'You already have an ongoing ride. Please complete it before starting another one.',
      });
    }

    // Update ride status
    ride.rideStatus = 'started';
    ride.startTime = new Date();
    ride.isActive = true;
    await ride.save();

    // Send notifications to all participants
    try {
      const driverName = ride.driver?.name || 'Driver';
      for (const participant of ride.participants) {
        if (participant.rider) {
          await createNotification(
            participant.rider,
            'ride_started',
            `${driverName} has started the ride from ${ride.from} to ${ride.to}`,
            ride._id?.toString() || ride._id
          );
        }
      }
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError);
    }

    // Populate and return updated ride
    const populatedRide = await Ride.findById(ride._id).populate({
      path: 'driver',
      select: 'name email phone role',
    }).populate('vehicle').populate({
      path: 'requests.rider',
      select: 'name email phone',
    }).populate({
      path: 'participants.rider',
      select: 'name email phone',
    });

    console.log(`[Ride] Ride started successfully: ${ride._id}`);
    res.json(transformRide(populatedRide));
  } catch (error) {
    console.error(`[Ride] StartRide error:`, error);
    next(error);
  }
};

// @desc    Complete a ride (Driver only)
// @route   POST /api/rides/:id/complete
// @access  Private (Driver only)
const completeRide = async (req, res, next) => {
  try {
    console.log(`[Ride] CompleteRide for ride: ${req.params.id} by user: ${req.user.id}`);
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({
        success: false,
        message: 'Ride not found',
      });
    }

    // Check if user is the driver
    if (ride.driver.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the driver can complete the ride',
      });
    }

    // Check if ride can be completed
    if (ride.rideStatus === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Ride has already been completed',
      });
    }

    if (ride.rideStatus !== 'started') {
      return res.status(400).json({
        success: false,
        message: 'Ride must be started before it can be completed',
      });
    }

    // Update ride status
    ride.rideStatus = 'completed';
    ride.endTime = new Date();
    ride.isActive = false;
    await ride.save();

    // Calculate distance and update user stats (similar to updateRide)
    const start = {
      lat: ride.startCoordinates.coordinates[1],
      lng: ride.startCoordinates.coordinates[0]
    };
    const end = {
      lat: ride.destCoordinates.coordinates[1],
      lng: ride.destCoordinates.coordinates[0]
    };
    const distance = haversineDistanceKm(start, end);

    if (distance > 0 && distance !== Number.POSITIVE_INFINITY) {
      const co2Saved = Math.round(distance * 0.2 * 100) / 100;
      const points = Math.round(distance * 10);

      // Update Driver
      await User.findByIdAndUpdate(ride.driver, {
        $inc: { co2Saved: co2Saved, greenPoints: points }
      });

      // Update Participants
      for (const participant of ride.participants) {
        if (participant.rider) {
          await User.findByIdAndUpdate(participant.rider, {
            $inc: { co2Saved: co2Saved, greenPoints: points }
          });
        }
      }
    }

    // Send notifications to all participants
    try {
      const driverName = ride.driver?.name || 'Driver';
      for (const participant of ride.participants) {
        if (participant.rider) {
          await createNotification(
            participant.rider,
            'ride_completed',
            `${driverName} has completed the ride from ${ride.from} to ${ride.to}`,
            ride._id?.toString() || ride._id
          );
        }
      }
    } catch (notifError) {
      console.error('Failed to send notifications:', notifError);
    }

    // Populate and return updated ride
    const populatedRide = await Ride.findById(ride._id).populate({
      path: 'driver',
      select: 'name email phone role',
    }).populate('vehicle').populate({
      path: 'requests.rider',
      select: 'name email phone',
    }).populate({
      path: 'participants.rider',
      select: 'name email phone',
    });

    console.log(`[Ride] Ride completed successfully: ${ride._id}`);
    res.json(transformRide(populatedRide));
  } catch (error) {
    console.error(`[Ride] CompleteRide error:`, error);
    next(error);
  }
};

// @desc    Confirm payment and finalize booking
// @route   POST /api/rides/:id/payment/confirm
// @access  Private
const confirmPayment = async (req, res, next) => {
  try {
    console.log(`[Ride] ConfirmPayment for ride: ${req.params.id} by user: ${req.user.id}`);
    const ride = await Ride.findById(req.params.id);

    if (!ride) {
      return res.status(404).json({ success: false, message: 'Ride not found' });
    }

    const request = ride.requests.find(r => r.rider && r.rider.toString() === req.user.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }

    if (request.status !== 'PaymentPending') {
      return res.status(400).json({ success: false, message: 'Payment is not pending for this request' });
    }

    const seatsToBook = request.seatsRequested || 1;

    // CRITICAL: Check if seats are still available
    if (ride.seatsAvailable < seatsToBook) {
      return res.status(400).json({
        success: false,
        message: `Sorry, only ${ride.seatsAvailable} seat(s) are left. Someone else booked while you were paying.`
      });
    }

    // Update request status
    request.status = 'Approved';

    // Add to participants
    ride.participants.push({
      rider: request.rider,
      name: request.name,
      status: 'Confirmed',
      seatsBooked: seatsToBook,
      addons: request.addons,
      finalCost: request.finalCost
    });

    // Decrement seats
    ride.seatsAvailable -= seatsToBook;

    await ride.save();

    // Update Booking
    await Booking.findOneAndUpdate(
      { ride: ride._id, rider: req.user.id },
      { status: 'Approved' }
    );

    // Send notifications (non-blocking for response)
    try {
      // Notify Driver
      await createNotification(
        ride.driver,
        'ride_booked',
        `${request.name} has completed payment and confirmed their seat.`,
        ride._id,
        request._id
      );

      // Notify Rider
      await createNotification(
        req.user.id,
        'ride_confirmed',
        `Payment successful! Your ride with ${ride.driver.name || 'the driver'} is confirmed.`,
        ride._id,
        request._id
      );
    } catch (notifError) {
      console.error('[Ride] Notification failed during payment confirmation:', notifError);
      // We don't fail the request here because the payment/booking is already successful
    }

    res.json({ success: true, message: 'Payment confirmed and ride booked' });

  } catch (error) {
    console.error(`[Ride] ConfirmPayment error:`, error);
    next(error);
  }
};

module.exports = {
  createRide,
  getRides,
  getRide,
  updateRide,
  deleteRide,
  addRequest,
  updateRequestStatus,
  findRideMatches,
  rateRide,
  deleteRequest,
  cancelBooking,
  startRide,
  completeRide,
  confirmPayment
};
