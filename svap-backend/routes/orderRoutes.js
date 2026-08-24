const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.get('/', orderController.getOrders);
router.post('/', orderController.createOrder);
router.patch('/:id', orderController.updateOrderStatus);

module.exports = router;
