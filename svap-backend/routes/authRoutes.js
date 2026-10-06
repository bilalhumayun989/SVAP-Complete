const express=require('express');const router=express.Router();const otp=require('../controllers/pgOtpController');const pgAuth=require('../controllers/pgAuthController');const pg=require('../controllers/pgProfileController');const {requireAuth,optionalAuth}=require('../middleware/auth');
router.post('/send-otp',otp.sendOtp);router.post('/verify-otp',otp.verifyOtp);router.get('/username-availability',pgAuth.checkUsernameAvailability);
router.post('/signup',requireAuth,pgAuth.signup);router.post('/login',pgAuth.login);
router.post('/create-google-profile',requireAuth,pg.createGoogleProfile);router.post('/refresh-profile',requireAuth,pg.refreshProfile);
router.get('/profile/:userId',optionalAuth,pg.getProfile);router.put('/profile/:userId',requireAuth,pg.updateProfile);
module.exports=router;
