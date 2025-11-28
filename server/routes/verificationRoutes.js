const express = require('express');
const router = express.Router();
const multer = require('multer');
const { verifyLicense } = require('../controllers/verificationController');
const { authMiddleware: protect } = require('../middleware/authMiddleware');

// Configure multer for temporary file storage
const upload = multer({ dest: 'uploads/' });

router.post('/upload', protect, upload.single('license'), verifyLicense);

module.exports = router;
