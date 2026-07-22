const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');

// GET /api/notifications/user/:userId
router.get('/user/:userId', notificationController.getNotifications);

// PATCH /api/notifications/user/:userId/read-all
router.patch('/user/:userId/read-all', notificationController.markAllRead);

module.exports = router;
