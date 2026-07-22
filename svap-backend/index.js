require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const swapRoutes = require('./routes/swapRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'SwapZone Backend Running ✅', port });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/swap-requests', swapRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/upload', uploadRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

app.listen(port, () => {
  console.log(`✅ SwapZone Backend running on http://localhost:${port}`);
  console.log('Routes:');
  console.log('  POST   /api/auth/signup');
  console.log('  POST   /api/auth/login');
  console.log('  GET    /api/auth/profile/:userId');
  console.log('  PUT    /api/auth/profile/:userId');
  console.log('  GET    /api/products');
  console.log('  GET    /api/products/:id');
  console.log('  GET    /api/products/user/:userId');
  console.log('  POST   /api/products');
  console.log('  PUT    /api/products/:id');
  console.log('  DELETE /api/products/:id');
  console.log('  GET    /api/swap-requests/user/:userId');
  console.log('  POST   /api/swap-requests');
  console.log('  PATCH  /api/swap-requests/:id');
  console.log('  GET    /api/notifications/user/:userId');
  console.log('  PATCH  /api/notifications/user/:userId/read-all');
});
