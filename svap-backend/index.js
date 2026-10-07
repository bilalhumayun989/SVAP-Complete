require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const pool = require('./db');
const uploadRoot = require('./config/uploadRoot');

const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/pgProductRoutes');
const swapRoutes = require('./routes/pgSwapRoutes');
const notificationRoutes = require('./routes/pgNotificationRoutes');
const uploadRoutes = require('./routes/pgUploadRoutes');
const orderRoutes = require('./routes/pgOrderRoutes');
const savedRoutes = require('./routes/pgSavedRoutes');
const supportTicketRoutes = require('./routes/pgSupportTicketRoutes');
const adminRoutes = require('./routes/pgAdminRoutes');

const app = express();
const port = process.env.PORT || 5004;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(uploadRoot));

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
app.use('/api/orders', orderRoutes);
app.use('/api/saved', savedRoutes);
app.use('/api/support-tickets', supportTicketRoutes);
app.use('/api/admin', adminRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

const runSwapExpirySweep = async () => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`SELECT * FROM swap_requests WHERE expires_at <= now() AND status IN ('pending','accepted') ORDER BY expires_at FOR UPDATE SKIP LOCKED`);
    let expired = 0;
    for (const sr of rows) {
      const { rows: checkedOutUsers } = await client.query(`SELECT DISTINCT from_user_id FROM orders WHERE swap_request_id=$1 AND from_user_id IN ($2,$3)`, [sr.id,sr.from_user_id,sr.to_user_id]);
      const participantCount=checkedOutUsers.length;
      if (sr.status === 'accepted' && participantCount >= 2) continue;
      const changed=await client.query(`UPDATE swap_requests SET status='cancelled' WHERE id=$1 AND status=$2 RETURNING id`,[sr.id,sr.status]);
      if (!changed.rowCount) continue;
      await client.query(`UPDATE orders SET status='cancelled',admin_notes=concat_ws(E'\\n',NULLIF(admin_notes,''),'Auto-cancelled: SVAP checkout deadline expired. Refund review required.') WHERE swap_request_id=$1 AND status<>'cancelled'`,[sr.id]);
      await client.query(`UPDATE products SET status='active' WHERE id=ANY($1) AND status='in_swap'`,[[sr.offered_product_id,sr.requested_product_id].filter(Boolean)]);
      const {rows:orderRows}=await client.query('SELECT id FROM orders WHERE swap_request_id=$1 ORDER BY created_at LIMIT 1',[sr.id]);
      const orderSuffix=orderRows.length?` Order ID: ${orderRows[0].id}`:'';
      const body=participantCount?`Your SVAP was cancelled because checkout was not completed within 48 hours. Support will contact the paying user about a refund.${orderSuffix}`:'Your SVAP request expired after 48 hours without acceptance.';
      await client.query(`INSERT INTO notifications(user_id,type,title,body,route) VALUES($1,'swap_timeout','SVAP cancelled - timeout',$2,'/requests'),($3,'swap_timeout','SVAP cancelled - timeout',$2,'/requests')`,[sr.from_user_id,body,sr.to_user_id]);
      expired++;
    }
    await client.query('COMMIT');
    if(expired) console.log('[swap-expiry] Cancelled expired SVAPs:',expired);
  } catch (error) { await client.query('ROLLBACK'); console.error('[swap-expiry] Failed:',error.message); }
  finally { client.release(); }
};
// Use backend node-cron so no pg_cron extension is required.
if (process.env.ENABLE_SWAP_SWEEP === 'true') {
  cron.schedule('*/5 * * * *', () => { void runSwapExpirySweep(); });
  setTimeout(() => { void runSwapExpirySweep(); }, 10_000);
}

app.listen(port, '0.0.0.0', () => {  console.log(`✅ SwapZone Backend running on http://localhost:${port}`);
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
