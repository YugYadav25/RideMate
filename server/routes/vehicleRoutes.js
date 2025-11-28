const express = require('express');
const router = express.Router();

// Import controllers
const { addVehicle, getVehicles, updateVehicle, deleteVehicle } = require('../controllers/vehicleController');

// Import middleware
const { authMiddleware, driverMiddleware } = require('../middleware/authMiddleware');

// All vehicle routes require authentication and driver role
router.use(authMiddleware);
router.use(driverMiddleware);

// Vehicle routes
router.post('/', addVehicle);
router.get('/', getVehicles);
router.put('/:vehicleId', updateVehicle);
router.delete('/:vehicleId', deleteVehicle);

module.exports = router;

