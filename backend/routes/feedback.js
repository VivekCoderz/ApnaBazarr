const router = require('express').Router();
const { createFeedback, getAllFeedbacks } = require('../controllers/feedback');
const { limiters } = require('../middlewares/security');

router.post('/', limiters.feedback, createFeedback);
router.get('/', getAllFeedbacks);

module.exports = router;
