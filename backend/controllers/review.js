const Review = require('../models/Review');

// POST /reviews — save new product review
exports.createReview = async (req, res) => {
  try {
    const { productId, productName, userName, userEmail, rating, comment, photoUrl, videoUrl } = req.body;
    if (!productId || !userName || !comment) {
      return res.status(400).json({ success: false, message: 'productId, userName and comment are required.' });
    }
    const review = await Review.create({ productId, productName, userName, userEmail, rating, comment, photoUrl, videoUrl });
    res.status(201).json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /reviews?productId=X — fetch reviews for a product
// GET /reviews          — fetch all reviews (admin)
exports.getReviews = async (req, res) => {
  try {
    const filter = req.query.productId ? { productId: req.query.productId } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, reviews });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /reviews/:reviewId/like — toggle like
exports.likeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    if (!review.likes) review.likes = [];
    if (!review.dislikes) review.dislikes = [];

    if (review.likes.includes(email)) {
      review.likes = review.likes.filter(e => e !== email);
    } else {
      review.likes.push(email);
      review.dislikes = review.dislikes.filter(e => e !== email);
    }

    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /reviews/:reviewId/dislike — toggle dislike
exports.dislikeReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    if (!review.likes) review.likes = [];
    if (!review.dislikes) review.dislikes = [];

    if (review.dislikes.includes(email)) {
      review.dislikes = review.dislikes.filter(e => e !== email);
    } else {
      review.dislikes.push(email);
      review.likes = review.likes.filter(e => e !== email);
    }

    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /reviews/:reviewId/comment — add a comment
exports.commentReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { userName, userEmail, text } = req.body;
    if (!userName || !text) {
      return res.status(400).json({ success: false, message: 'userName and text are required.' });
    }

    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    if (!review.comments) review.comments = [];
    review.comments.push({ userName, userEmail, text, createdAt: new Date() });

    await review.save();
    res.json({ success: true, review });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
