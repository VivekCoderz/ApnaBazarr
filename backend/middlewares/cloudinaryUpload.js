const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary');

// Cloudinary storage for product images
const productImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'apna-bazarr/products',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
    transformation: [{ width: 1200, height: 1200, crop: 'limit', quality: 'auto' }],
  },
});

// Cloudinary storage for product videos
const productVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'apna-bazarr/product-videos',
    allowed_formats: ['mp4', 'webm', 'mov', 'avi'],
    resource_type: 'video',
  },
});

// Cloudinary storage for review photos
const reviewPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'apna-bazarr/reviews',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Cloudinary storage for feedback photos
const feedbackPhotoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'apna-bazarr/feedbacks',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }],
  },
});

// Cloudinary storage for feedback videos
const feedbackVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'apna-bazarr/feedback-videos',
    allowed_formats: ['mp4', 'webm', 'mov'],
    resource_type: 'video',
  },
});

// Cloudinary storage for review videos
const reviewVideoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'apna-bazarr/review-videos',
    allowed_formats: ['mp4', 'webm', 'mov'],
    resource_type: 'video',
  },
});

const MB = 1024 * 1024;
const IMAGE_TYPES = {
  'image/jpeg': ['.jpg', '.jpeg', '.jfif'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};
const VIDEO_TYPES = {
  'video/mp4': ['.mp4', '.m4v'],
  'video/webm': ['.webm'],
  'video/quicktime': ['.mov'],
  'video/x-msvideo': ['.avi'],
};

// Accepts a file only when both its declared type and its file extension are in the
// allowed list (SVG, HTML, PDF etc. are refused). Cloudinary's allowed_formats then
// checks the real file contents on its side.
function typeFilter(allowed, kind) {
  return (req, file, cb) => {
    const exts = allowed[String(file.mimetype).toLowerCase()];
    const name = String(file.originalname || '').toLowerCase();
    // Phones sometimes send camera photos without an extension; the type check still applies
    const extOk = exts && (!name.includes('.') || exts.some(ext => name.endsWith(ext)));
    if (!exts || !extOk) {
      const err = new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file');
      err.message = kind === 'video' ? 'Only MP4, WebM or MOV videos can be uploaded.' : 'Only JPG, PNG or WebP photos can be uploaded.';
      return cb(err);
    }
    cb(null, true);
  };
}

const imageOnly = (allowGif) => {
  const allowed = { ...IMAGE_TYPES };
  if (!allowGif) delete allowed['image/gif'];
  return typeFilter(allowed, 'image');
};

// One file per request, no extra text fields beyond a couple of small ones
const limitsFor = (fileSize) => ({ fileSize, files: 1, fields: 5, fieldSize: 1024, parts: 7 });

const IMAGE_MAX = 5 * MB;
const VIDEO_MAX = 50 * MB;

const uploadProductImage = multer({ storage: productImageStorage, fileFilter: imageOnly(true), limits: limitsFor(IMAGE_MAX) });
const uploadProductVideo = multer({ storage: productVideoStorage, fileFilter: typeFilter(VIDEO_TYPES, 'video'), limits: limitsFor(VIDEO_MAX) });
const uploadReviewPhoto = multer({ storage: reviewPhotoStorage, fileFilter: imageOnly(false), limits: limitsFor(IMAGE_MAX) });
const uploadReviewVideo = multer({ storage: reviewVideoStorage, fileFilter: typeFilter(VIDEO_TYPES, 'video'), limits: limitsFor(VIDEO_MAX) });
const uploadFeedbackPhoto = multer({ storage: feedbackPhotoStorage, fileFilter: imageOnly(false), limits: limitsFor(IMAGE_MAX) });
const uploadFeedbackVideo = multer({ storage: feedbackVideoStorage, fileFilter: typeFilter(VIDEO_TYPES, 'video'), limits: limitsFor(VIDEO_MAX) });

module.exports = {
  IMAGE_MAX,
  VIDEO_MAX,
  uploadProductImage,
  uploadProductVideo,
  uploadReviewPhoto,
  uploadReviewVideo,
  uploadFeedbackPhoto,
  uploadFeedbackVideo,
};
