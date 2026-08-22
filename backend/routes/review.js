const router = require('express').Router();
const { createReview, getReviews, likeReview, dislikeReview, commentReview, getSellerReviews } = require('../controllers/review');
const auth = require('../middlewares/auth');

router.post('/', createReview);
router.get('/', getReviews);
router.get('/seller/my-reviews', auth, getSellerReviews);
router.put('/:reviewId/like', likeReview);
router.put('/:reviewId/dislike', dislikeReview);
router.post('/:reviewId/comment', commentReview);

module.exports = router;
