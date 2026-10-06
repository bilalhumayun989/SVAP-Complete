const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();
const root = require('../config/uploadRoot');
const publicBase = String(process.env.API_BASE_URL || '').replace(/\/+$/, '');
const allowed = new Set(['products', 'avatars', 'videos']);
const filename = (_req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname).toLowerCase()}`);
const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const dir = path.join(root, req.params.folder);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename,
});
const upload = multer({
  storage,
  limits: { fileSize: 200 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Unsupported file type'));
  },
});
const paymentScreenshotUpload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Payment screenshot must be an image'));
  },
});

router.post('/image', requireAuth, (req, res, next) => { req.params.folder = 'products'; next(); }, upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' });
  res.json({ url: `${publicBase}/uploads/products/${req.file.filename}` });
});
router.post('/video', requireAuth, (req, res, next) => { req.params.folder = 'videos'; next(); }, upload.single('video'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No video file provided' });
  res.json({ url: `${publicBase}/uploads/videos/${req.file.filename}` });
});
router.post('/payment-screenshot', requireAuth, (req, res, next) => {
  req.params.folder = 'payment-screenshots';
  next();
}, paymentScreenshotUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No payment screenshot uploaded' });
  res.json({
    url: `${publicBase}/uploads/payment-screenshots/${req.file.filename}`,
    path: `payment-screenshots/${req.file.filename}`,
  });
});
router.post('/:folder', requireAuth, (req, res, next) => {
  if (!allowed.has(req.params.folder)) return res.status(400).json({ error: 'Unsupported public upload folder' });
  next();
}, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({
    url: `${publicBase}/uploads/${req.params.folder}/${req.file.filename}`,
    path: `${req.params.folder}/${req.file.filename}`,
  });
});

module.exports = router;