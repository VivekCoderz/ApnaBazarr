const express = require('express');
const router = express.Router();
const cloudinary = require('../config/cloudinary');
const {
  uploadProductImage,
  uploadProductVideo,
  uploadReviewPhoto,
  uploadReviewVideo,
  uploadFeedbackPhoto,
  uploadFeedbackVideo,
} = require('../middlewares/cloudinaryUpload');

/**
 * POST /api/upload/product-image
 * Upload a product image to Cloudinary
 */
router.post('/product-image', uploadProductImage.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
      folder: 'apna-bazarr/products',
      format: req.file.mimetype,
    });
  } catch (err) {
    console.error('Product image upload error:', err);
    res.status(500).json({ error: 'Image upload failed', details: err.message });
  }
});

/**
 * POST /api/upload/product-video
 * Upload a product video to Cloudinary
 */
router.post('/product-video', uploadProductVideo.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });

    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
      folder: 'apna-bazarr/product-videos',
      format: req.file.mimetype,
    });
  } catch (err) {
    console.error('Product video upload error:', err);
    res.status(500).json({ error: 'Video upload failed', details: err.message });
  }
});

/**
 * POST /api/upload/review-photo
 * Upload a customer review photo to Cloudinary
 */
router.post('/review-photo', uploadReviewPhoto.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo file provided' });

    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
      folder: 'apna-bazarr/reviews',
    });
  } catch (err) {
    console.error('Review photo upload error:', err);
    res.status(500).json({ error: 'Photo upload failed', details: err.message });
  }
});

/**
 * POST /api/upload/feedback-photo
 * Upload a customer feedback photo to Cloudinary
 */
router.post('/feedback-photo', uploadFeedbackPhoto.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No photo file provided' });
    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
      folder: 'apna-bazarr/feedbacks',
    });
  } catch (err) {
    console.error('Feedback photo upload error:', err);
    res.status(500).json({ error: 'Photo upload failed', details: err.message });
  }
});

/**
 * POST /api/upload/feedback-video
 * Upload a customer feedback video to Cloudinary
 */
router.post('/feedback-video', uploadFeedbackVideo.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });
    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
      folder: 'apna-bazarr/feedback-videos',
    });
  } catch (err) {
    console.error('Feedback video upload error:', err);
    res.status(500).json({ error: 'Video upload failed', details: err.message });
  }
});

/**
 * POST /api/upload/review-video
 * Upload a customer review video to Cloudinary
 */
router.post('/review-video', uploadReviewVideo.single('file'), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No video file provided' });
    res.json({
      success: true,
      url: req.file.path,
      publicId: req.file.filename,
      folder: 'apna-bazarr/review-videos',
    });
  } catch (err) {
    console.error('Review video upload error:', err);
    res.status(500).json({ error: 'Video upload failed', details: err.message });
  }
});

/**
 * DELETE /api/upload/:publicId
 * Delete an asset from Cloudinary by publicId
 */
router.delete('/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
