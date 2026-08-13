const router = require('express').Router();
const { createFeedback, getAllFeedbacks } = require('../controllers/feedback');

router.post('/', createFeedback);
router.get('/', getAllFeedbacks);

module.exports = router;
