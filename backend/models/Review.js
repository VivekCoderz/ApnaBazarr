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
  likes:       { type: [String], default: [] },
  dislikes:    { type: [String], default: [] },
  comments:    [
    {
      userName: { type: String, required: true },
      userEmail: { type: String, default: '' },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);
