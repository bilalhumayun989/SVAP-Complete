const express = require('express');
const router = express.Router();
const multer = require('multer');
const { supabaseAdmin } = require('../config/supabase');

// Separate multer instances with file size limits
const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB for images
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'), false);
  }
});

const uploadVideo = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024 * 1024 }, // 200MB for videos
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'), false);
  }
});

router.post('/image', uploadImage.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const file = req.file;
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    // Upload to Supabase Storage using Admin Client to bypass RLS
    const { data, error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (error) {
      console.error('Storage admin upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    // Get Public URL
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName);

    res.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image too large. Max size is 10MB.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

router.post('/video', uploadVideo.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const file = req.file;
    const productId = req.body.productId || 'unlinked';
    const fileExt = file.originalname.split('.').pop() || 'mp4';
    const fileName = `reels/${productId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { error } = await supabaseAdmin.storage
      .from('product-images')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) {
      console.error('Video storage admin upload error:', error);
      return res.status(500).json({ error: error.message });
    }

    const { data: publicUrlData } = supabaseAdmin.storage
      .from('product-images')
      .getPublicUrl(fileName);

    res.json({ url: publicUrlData.publicUrl });
  } catch (err) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Video too large. Max size is 200MB.' });
    }
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
