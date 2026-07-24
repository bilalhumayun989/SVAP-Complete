const express = require('express');
const router = express.Router();
const savedController = require('../controllers/savedController');

// GET /api/saved/:userId
router.get('/:userId', savedController.getSaved);

// GET /api/saved/:userId/ids
router.get('/:userId/ids', savedController.getSavedIds);

// POST /api/saved
router.post('/', savedController.saveProduct);

// DELETE /api/saved
router.delete('/', savedController.unsaveProduct);

module.exports = router;
