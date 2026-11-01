const express = require('express');
const router = express.Router();
const multer = require('multer');
const cloudinary = require('../config/cloudinary');
const auth = require('../middlewares/auth');
const { limiters } = require('../middlewares/security');
const {
  IMAGE_MAX,
  VIDEO_MAX,
  uploadProductImage,
  uploadProductVideo,
  uploadReviewPhoto,
  uploadReviewVideo,
  uploadFeedbackPhoto,
  uploadFeedbackVideo,
} = require('../middlewares/cloudinaryUpload');

// Who may upload what:
//   product-image / product-video  -> logged-in sellers and the admin only
//   feedback-photo / feedback-video, review-video -> any logged-in account
//   review-photo / custom-image     -> anyone (guests write reviews and personalise
//                                      products), but images only, 5 MB, rate-limited per IP
// Every endpoint: one file, strict type list, size cap, per-IP rate limit.

const sellerOrAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin' && req.user?.role !== 'seller') {
    return res.status(403).json({ success: false, error: 'Only sellers and the admin can upload product media.' });
  }
  next();
};

// Refuse an obviously oversized request before any of it is streamed to Cloudinary
const maxRequestSize = (fileLimit) => (req, res, next) => {
  const length = Number(req.headers['content-length']);
  if (length && length > fileLimit + 64 * 1024) {
    return res.status(413).json({ success: false, error: `File is too large. Maximum size is ${Math.round(fileLimit / (1024 * 1024))} MB.` });
  }
  next();
};

// Runs multer and turns its errors (wrong type, too big, Cloudinary refusing the file)
// into a short JSON message without internal details
const receive = (uploader, fileLimit) => (req, res, next) => {
  uploader.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      const message = err.code === 'LIMIT_FILE_SIZE'
        ? `File is too large. Maximum size is ${Math.round(fileLimit / (1024 * 1024))} MB.`
        : (err.code === 'LIMIT_UNEXPECTED_FILE' && err.message && !err.message.startsWith('Unexpected')) ? err.message
        : 'Upload rejected. Please send one photo or video file.';
      return res.status(400).json({ success: false, error: message });
    }
    console.error('Upload error:', err);
    // Cloudinary answers 400 when the file's real contents aren't an allowed format
    if (Number(err.http_code) === 400) {
      return res.status(400).json({ success: false, error: 'This file could not be read. Please use a JPG, PNG or WebP photo (or MP4/WebM/MOV video).' });
    }
    return res.status(502).json({ success: false, error: 'Upload failed. Please try again in a minute.' });
  });
};

const image = (uploader) => [limiters.imageUpload, maxRequestSize(IMAGE_MAX), receive(uploader, IMAGE_MAX)];
const video = (uploader) => [limiters.videoUpload, maxRequestSize(VIDEO_MAX), receive(uploader, VIDEO_MAX)];

const sendResult = (folder, missingMessage) => (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: missingMessage });
  res.json({
    success: true,
    url: req.file.path,
    publicId: req.file.filename,
    folder,
    format: req.file.mimetype,
  });
};

/** POST /api/upload/product-image — seller/admin product photo */
router.post('/product-image', auth, sellerOrAdmin, ...image(uploadProductImage),
  sendResult('apna-bazarr/products', 'No image file provided'));

/** POST /api/upload/product-video — seller/admin product video */
router.post('/product-video', auth, sellerOrAdmin, ...video(uploadProductVideo),
  sendResult('apna-bazarr/product-videos', 'No video file provided'));

/** POST /api/upload/review-photo — review photo (guests allowed) */
router.post('/review-photo', ...image(uploadReviewPhoto),
  sendResult('apna-bazarr/reviews', 'No photo file provided'));

/** POST /api/upload/custom-image — customer's personalisation photo (guests allowed) */
router.post('/custom-image', ...image(uploadReviewPhoto),
  sendResult('apna-bazarr/reviews', 'No customization image file provided'));

/** POST /api/upload/feedback-photo — feedback form (requires login, as the form does) */
router.post('/feedback-photo', auth, ...image(uploadFeedbackPhoto),
  sendResult('apna-bazarr/feedbacks', 'No photo file provided'));

/** POST /api/upload/feedback-video — feedback form (requires login) */
router.post('/feedback-video', auth, ...video(uploadFeedbackVideo),
  sendResult('apna-bazarr/feedback-videos', 'No video file provided'));

/** POST /api/upload/review-video — review video (requires login: videos are large) */
router.post('/review-video', auth, ...video(uploadReviewVideo),
  sendResult('apna-bazarr/review-videos', 'No video file provided'));

/**
 * DELETE /api/upload/:publicId
 * Delete an asset from Cloudinary by publicId
 */
router.delete('/:publicId', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ success: false, error: 'Forbidden.' });
    }
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId);
    res.json({ success: true, result });
  } catch (err) {
    console.error('Cloudinary delete error:', err);
    res.status(500).json({ success: false, error: 'Delete failed' });
  }
});

module.exports = router;
