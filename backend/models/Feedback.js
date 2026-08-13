const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  name:     { type: String, required: true },
  email:    { type: String, required: true },
  rating:   { type: Number, required: true, min: 1, max: 5 },
  category: { type: String, default: 'Product Quality' },
  message:  { type: String, required: true },
  photoUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
