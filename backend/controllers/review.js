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
