const express = require('express');
const router = express.Router();

// Import utilities
const { search, geocode } = require('../utils/geocoding');

/**
 * @route   GET /api/locations/search
 * @desc    Search for locations (autocomplete)
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const results = await search(q);
    res.json(results);
  } catch (error) {
    console.error('Location search error:', error);
    res.status(500).json({ message: 'Server error during location search' });
  }
});

/**
 * @route   GET /api/locations/geocode
 * @desc    Geocode a location name to coordinates
 * @access  Public
 */
router.get('/geocode', async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ message: 'Query parameter "q" is required' });
    }

    const result = await geocode(q);

    if (!result) {
      return res.status(404).json({ message: 'Location not found' });
    }

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Geocoding error:', error);
    res.status(500).json({ message: 'Server error during geocoding' });
  }
});

module.exports = router;
