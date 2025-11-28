const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateEmail, validateRole } = require('../utils/validate');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res, next) => {
  try {
    console.log(`[Auth] Register request for email: ${req.body.email}`);
    const {
      name,
      email,
      password,
      phone,
      role,
      emergencyName1,
      emergencyPhone1,
      emergencyName2,
      emergencyPhone2,
      emergencyName3,
      emergencyPhone3,
      profilePhoto,
    } = req.body;

    // Validation
    if (!name || !email || !password || !role) {
      console.log(`[Auth] Register failed: Missing required fields for ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email, password, and role',
      });
    }

    if (!validateEmail(email)) {
      console.log(`[Auth] Register failed: Invalid email format ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email',
      });
    }

    if (password.length < 6) {
      console.log(`[Auth] Register failed: Password too short for ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    if (!validateRole(role)) {
      console.log(`[Auth] Register failed: Invalid role ${role} for ${email}`);
      return res.status(400).json({
        success: false,
        message: 'Role must be either "driver" or "rider"',
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      console.log(`[Auth] Register failed: User already exists ${email}`);
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email',
      });
    }

    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      phone: phone || '',
      role,
      emergencyName1: emergencyName1 || '',
      emergencyPhone1: emergencyPhone1 || '',
      emergencyName2: emergencyName2 || '',
      emergencyPhone2: emergencyPhone2 || '',
      emergencyName3: emergencyName3 || '',
      emergencyPhone3: emergencyPhone3 || '',
      profilePhoto: profilePhoto || '',
      location: {
        type: 'Point',
        coordinates: [0, 0], // Default to [0, 0] to satisfy 2dsphere index
      },
    });

    // Generate token
    const token = generateToken(user._id);

    console.log(`[Auth] Registered successfully: ${user._id} (${user.email})`);

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emergencyName1: user.emergencyName1,
        emergencyPhone1: user.emergencyPhone1,
        emergencyName2: user.emergencyName2,
        emergencyPhone2: user.emergencyPhone2,
        emergencyName3: user.emergencyName3,
        emergencyPhone3: user.emergencyPhone3,
        profilePhoto: user.profilePhoto,
        rating: user.rating,
        co2Saved: user.co2Saved,
        greenPoints: user.greenPoints,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error(`[Auth] Register error:`, error);
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res, next) => {
  try {
    console.log(`[Auth] Login request for email: ${req.body.email}`);
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      console.log(`[Auth] Login failed: Missing credentials`);
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password',
      });
    }

    // Check for user
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

    if (!user) {
      console.log(`[Auth] Login failed: User not found ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Check if password matches
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      console.log(`[Auth] Login failed: Invalid password for ${email}`);
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Generate token
    const token = generateToken(user._id);

    console.log(`[Auth] Login successful: ${user._id} (${user.email})`);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        emergencyName1: user.emergencyName1,
        emergencyPhone1: user.emergencyPhone1,
        emergencyName2: user.emergencyName2,
        emergencyPhone2: user.emergencyPhone2,
        emergencyName3: user.emergencyName3,
        emergencyPhone3: user.emergencyPhone3,
        profilePhoto: user.profilePhoto,
        rating: user.rating,
        co2Saved: user.co2Saved,
        greenPoints: user.greenPoints,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error(`[Auth] Login error:`, error);
    next(error);
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res, next) => {
  try {
    // console.log(`[Auth] GetMe request for user: ${req.user.id}`); // Commented out to reduce noise on every page load
    const user = await User.findById(req.user.id);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        emergencyName1: user.emergencyName1,
        emergencyPhone1: user.emergencyPhone1,
        emergencyName2: user.emergencyName2,
        emergencyPhone2: user.emergencyPhone2,
        emergencyName3: user.emergencyName3,
        emergencyPhone3: user.emergencyPhone3,
        profilePhoto: user.profilePhoto,
        rating: user.rating,
        co2Saved: user.co2Saved,
        greenPoints: user.greenPoints,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error(`[Auth] GetMe error:`, error);
    next(error);
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
const updateProfile = async (req, res, next) => {
  try {
    console.log(`[Auth] UpdateProfile request for user: ${req.user.id}`);
    const {
      name,
      phone,
      emergencyName1,
      emergencyPhone1,
      emergencyName2,
      emergencyPhone2,
      emergencyName3,
      emergencyPhone3,
      profilePhoto,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user) {
      console.log(`[Auth] UpdateProfile failed: User not found ${req.user.id}`);
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (emergencyName1 !== undefined) user.emergencyName1 = emergencyName1;
    if (emergencyPhone1 !== undefined) user.emergencyPhone1 = emergencyPhone1;
    if (emergencyName2 !== undefined) user.emergencyName2 = emergencyName2;
    if (emergencyPhone2 !== undefined) user.emergencyPhone2 = emergencyPhone2;
    if (emergencyName3 !== undefined) user.emergencyName3 = emergencyName3;
    if (emergencyPhone3 !== undefined) user.emergencyPhone3 = emergencyPhone3;
    if (profilePhoto !== undefined) user.profilePhoto = profilePhoto;

    await user.save();

    console.log(`[Auth] Profile updated successfully for user: ${user._id}`);

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt,
        emergencyName1: user.emergencyName1,
        emergencyPhone1: user.emergencyPhone1,
        emergencyName2: user.emergencyName2,
        emergencyPhone2: user.emergencyPhone2,
        emergencyName3: user.emergencyName3,
        emergencyPhone3: user.emergencyPhone3,
        profilePhoto: user.profilePhoto,
        rating: user.rating,
        co2Saved: user.co2Saved,
        greenPoints: user.greenPoints,
        verificationStatus: user.verificationStatus,
      },
    });
  } catch (error) {
    console.error(`[Auth] UpdateProfile error:`, error);
    next(error);
  }
};

module.exports = {
  register,
  login,
  getMe,
  updateProfile,
};
