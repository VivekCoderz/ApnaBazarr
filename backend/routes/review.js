const router = require('express').Router();
const { createReview, getReviews, likeReview, dislikeReview, commentReview } = require('../controllers/review');

router.post('/', createReview);
router.get('/', getReviews);
router.put('/:reviewId/like', likeReview);
router.put('/:reviewId/dislike', dislikeReview);
router.post('/:reviewId/comment', commentReview);

module.exports = router;
