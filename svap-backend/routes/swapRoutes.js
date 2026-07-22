const express = require('express');
const router = express.Router();
const swapController = require('../controllers/swapController');

// GET /api/swap-requests/user/:userId
router.get('/user/:userId', swapController.getMyRequests);

// POST /api/swap-requests
router.post('/', swapController.createSwapRequest);

// PATCH /api/swap-requests/:id
router.patch('/:id', swapController.updateSwapRequestStatus);

module.exports = router;
