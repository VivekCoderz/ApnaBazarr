const router = require('express').Router();
const { createReview, getReviews, likeReview, dislikeReview, commentReview, getSellerReviews } = require('../controllers/review');
const auth = require('../middlewares/auth');
const { limiters } = require('../middlewares/security');

// Posting a review stays open to guests (rate-limited). Likes, dislikes and replies
// need a logged-in account: the identity comes from the session, not the request body.
router.post('/', limiters.review, createReview);
router.get('/', getReviews);
router.get('/seller/my-reviews', auth, getSellerReviews);
router.put('/:reviewId/like', limiters.reviewInteraction, auth, likeReview);
router.put('/:reviewId/dislike', limiters.reviewInteraction, auth, dislikeReview);
router.post('/:reviewId/comment', limiters.reviewInteraction, auth, commentReview);

module.exports = router;
