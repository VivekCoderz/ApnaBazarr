const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  productId:   { type: String, required: true },
  productName: { type: String, default: '' },
  userName:    { type: String, required: true },
  userEmail:   { type: String, default: '' },
  rating:      { type: Number, required: true, min: 1, max: 5 },
  comment:     { type: String, required: true },
  photoUrl:    { type: String, default: '' },
  videoUrl:    { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
