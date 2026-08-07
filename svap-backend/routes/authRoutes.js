const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// POST /api/auth/send-otp
router.post('/send-otp', authController.sendOtp);

// POST /api/auth/verify-otp
router.post('/verify-otp', authController.verifyOtp);

// POST /api/auth/signup
router.post('/signup', authController.signup);

// POST /api/auth/login
router.post('/login', authController.login);

// POST /api/auth/create-google-profile
router.post('/create-google-profile', authController.createGoogleProfile);

// POST /api/auth/refresh-profile
router.post('/refresh-profile', authController.refreshProfile);

// GET /api/auth/profile/:userId
router.get('/profile/:userId', authController.getProfile);

// PUT /api/auth/profile/:userId
router.put('/profile/:userId', authController.updateProfile);

module.exports = router;
