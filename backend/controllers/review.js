const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const { optionalUser } = require('../middlewares/auth');

const MAX_NAME = 80;
const MAX_COMMENT = 2000;
const MAX_REPLY = 1000;

const cleanText = (value, max) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
const sameEmail = (a, b) => typeof a === 'string' && typeof b === 'string' && a.toLowerCase() === b.toLowerCase();

// Review photos/videos must be files uploaded through our /api/upload endpoints
// (Cloudinary https URLs). Anything else is dropped, so a review can't embed
// arbitrary third-party links or tracking pixels.
function cleanMediaUrl(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' ? url.href.slice(0, 500) : '';
  } catch {
    return '';
  }
}

// The identity a like/dislike is recorded under. Likes have always been stored as the
// account email, so existing likes keep counting; the email now comes from the
// session, never from the request body.
const voterKey = (user) => (user && user.email ? String(user.email) : null);

// What the public (and sellers) may see of a review: no reviewer emails and no lists
// of who liked it, just counts and whether the current visitor liked it.
function publicReview(review, viewer) {
  const r = typeof review.toObject === 'function' ? review.toObject() : review;
  const me = voterKey(viewer);
  const likes = Array.isArray(r.likes) ? r.likes : [];
  const dislikes = Array.isArray(r.dislikes) ? r.dislikes : [];
  return {
    _id: r._id,
    productId: r.productId,
    productName: r.productName,
    userName: r.userName,
    rating: r.rating,
    comment: r.comment,
    photoUrl: r.photoUrl,
    videoUrl: r.videoUrl,
    sellerRating: r.sellerRating,
    createdAt: r.createdAt,
    updatedAt: r.updatedAt,
    likesCount: likes.length,
    dislikesCount: dislikes.length,
    likedByMe: Boolean(me && likes.some(e => sameEmail(e, me))),
    dislikedByMe: Boolean(me && dislikes.some(e => sameEmail(e, me))),
    isMine: Boolean(me && sameEmail(r.userEmail, me)),
    comments: (r.comments || []).map(c => ({
      _id: c._id,
      userName: c.userName,
      text: c.text,
      createdAt: c.createdAt
    }))
  };
}

const serverError = (res, err, label) => {
  console.error(`${label}:`, err);
  res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
};

// POST /reviews — save new product review (guests allowed)
exports.createReview = async (req, res) => {
  try {
    const { productId, rating, sellerRating } = req.body;
    const userName = cleanText(req.body.userName, MAX_NAME);
    const comment = cleanText(req.body.comment, MAX_COMMENT);
    if (!productId || !userName || !comment) {
      return res.status(400).json({ success: false, message: 'productId, userName and comment are required.' });
    }
    if (!mongoose.isValidObjectId(productId)) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }
    const stars = Number(rating);
    if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5 stars.' });
    }
    const serviceStars = Number(sellerRating);
    const validServiceStars = Number.isInteger(serviceStars) && serviceStars >= 1 && serviceStars <= 5 ? serviceStars : undefined;

    const prod = await Product.findById(productId);
    if (!prod) {
      return res.status(404).json({ success: false, message: 'Product not found.' });
    }

    // The reviewer's email comes from their session (empty for guests), never the body
    const viewer = await optionalUser(req);

    const review = await Review.create({
      productId: String(prod._id),
      productName: prod.name,
      userName,
      userEmail: viewer?.email || '',
      rating: stars,
      comment,
      photoUrl: cleanMediaUrl(req.body.photoUrl),
      videoUrl: cleanMediaUrl(req.body.videoUrl),
      sellerId: prod.seller || null,
      sellerRating: validServiceStars
    });

    // Recalculate average rating and reviewsCount for the product
    const allReviews = await Review.find({ productId: String(prod._id) });
    if (allReviews.length > 0) {
      const sum = allReviews.reduce((acc, curr) => acc + (curr.rating || 5), 0);
      const avg = Number((sum / allReviews.length).toFixed(1));
      await Product.findByIdAndUpdate(prod._id, { rating: avg, reviewsCount: allReviews.length });
    }

    res.status(201).json({ success: true, review: publicReview(review, viewer) });
  } catch (err) {
    serverError(res, err, 'Create review error');
  }
};

// GET /reviews?productId=X — reviews for a product (public shape, no emails)
// GET /reviews              — all reviews; the admin gets full records (with emails)
exports.getReviews = async (req, res) => {
  try {
    const viewer = await optionalUser(req);
    const isAdmin = viewer?.role === 'admin';
    const productId = typeof req.query.productId === 'string' ? req.query.productId : '';
    const filter = productId ? { productId } : {};
    const reviews = await Review.find(filter).sort({ createdAt: -1 });
    res.json({
      success: true,
      reviews: isAdmin ? reviews : reviews.map(r => publicReview(r, viewer))
    });
  } catch (err) {
    serverError(res, err, 'Fetch reviews error');
  }
};

// Toggle a like or dislike for the logged-in user (route requires auth)
async function toggleVote(req, res, field, otherField) {
  try {
    const me = voterKey(req.user);
    if (!me) return res.status(401).json({ success: false, message: 'Please log in first.' });
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    const list = (review[field] || []);
    if (list.some(e => sameEmail(e, me))) {
      review[field] = list.filter(e => !sameEmail(e, me));
    } else {
      review[field] = [...list, me];
      review[otherField] = (review[otherField] || []).filter(e => !sameEmail(e, me));
    }

    await review.save();
    res.json({ success: true, review: publicReview(review, req.user) });
  } catch (err) {
    serverError(res, err, `Review ${field} error`);
  }
}

// PUT /reviews/:reviewId/like — toggle like
exports.likeReview = (req, res) => toggleVote(req, res, 'likes', 'dislikes');

// PUT /reviews/:reviewId/dislike — toggle dislike
exports.dislikeReview = (req, res) => toggleVote(req, res, 'dislikes', 'likes');

// POST /reviews/:reviewId/comment — add a reply as the logged-in user (route requires auth)
exports.commentReview = async (req, res) => {
  try {
    const text = cleanText(req.body.text, MAX_REPLY);
    if (!text) {
      return res.status(400).json({ success: false, message: 'Please write a reply.' });
    }
    if (!mongoose.isValidObjectId(req.params.reviewId)) {
      return res.status(404).json({ success: false, message: 'Review not found.' });
    }

    const review = await Review.findById(req.params.reviewId);
    if (!review) return res.status(404).json({ success: false, message: 'Review not found.' });

    if (!review.comments) review.comments = [];
    if (review.comments.length >= 200) {
      return res.status(400).json({ success: false, message: 'This review has too many replies already.' });
    }
    review.comments.push({
      userName: cleanText(req.user.name, MAX_NAME) || 'Customer',
      userEmail: req.user.email || '',
      text,
      createdAt: new Date()
    });

    await review.save();
    res.json({ success: true, review: publicReview(review, req.user) });
  } catch (err) {
    serverError(res, err, 'Comment review error');
  }
};

module.exports.getSellerReviews = async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Forbidden. Seller access required.' });
    }

    const reviews = await Review.find({ sellerId: req.user._id }).sort({ createdAt: -1 });

    let totalRating = 0;
    let avgRating = 0;
    if (reviews.length > 0) {
      totalRating = reviews.reduce((acc, r) => acc + (r.sellerRating || 5), 0);
      avgRating = Number((totalRating / reviews.length).toFixed(1));
    }

    res.json({
      success: true,
      count: reviews.length,
      // Sellers see the review, not the customer's email or who liked it
      reviews: reviews.map(r => publicReview(r, req.user)),
      averageSellerRating: avgRating
    });
  } catch (error) {
    console.error('Fetch seller reviews error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching reviews.' });
  }
};
