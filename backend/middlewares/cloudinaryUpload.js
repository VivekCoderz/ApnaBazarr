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

const uploadProductImage = multer({ storage: productImageStorage });
const uploadProductVideo = multer({ storage: productVideoStorage });
const uploadReviewPhoto = multer({ storage: reviewPhotoStorage });
const uploadReviewVideo = multer({ storage: reviewVideoStorage });
const uploadFeedbackPhoto = multer({ storage: feedbackPhotoStorage });
const uploadFeedbackVideo = multer({ storage: feedbackVideoStorage });

module.exports = {
  uploadProductImage,
  uploadProductVideo,
  uploadReviewPhoto,
  uploadReviewVideo,
  uploadFeedbackPhoto,
  uploadFeedbackVideo,
};
