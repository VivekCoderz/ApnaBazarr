const router = require('express').Router();
const { createReview, getReviews } = require('../controllers/review');

router.post('/', createReview);
router.get('/', getReviews);

module.exports = router;
