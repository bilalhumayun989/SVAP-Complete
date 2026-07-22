const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');

// GET /api/products  (supports ?category=Electronics&search=iphone)
router.get('/', productController.getAllProducts);

// GET /api/products/stories
router.get('/stories', productController.getStories);

// GET /api/products/user/:userId
router.get('/user/:userId', productController.getProductsByUser);

// GET /api/products/:id
router.get('/:id', productController.getProductById);

// POST /api/products
router.post('/', productController.createProduct);

// PUT /api/products/:id
router.put('/:id', productController.updateProduct);

// DELETE /api/products/:id
router.delete('/:id', productController.deleteProduct);

module.exports = router;
