const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: String, required: true },
  gender: { type: String, enum: ['Men', 'Women', 'Kids', 'Unisex', 'Home', 'Electronics'], default: 'Unisex' },
  price: { type: Number, required: true },
  originalPrice: { type: Number },
  discount: { type: String },
  badge: { type: String },
  stock: { type: Number, default: 50 },
  rating: { type: Number, default: 4.5 },
  reviewsCount: { type: Number, default: 1 },
  image: { type: String, required: true },
  costPrice: { type: Number },
  description: { type: String },
  tags: [{ type: String }],
  inStock: { type: Boolean, default: true },
  isCustomizable: { type: Boolean, default: false },
  customizationType: { type: String, enum: ['text', 'image', 'both', 'none'], default: 'none' },
  customizationPrompt: { type: String, default: '' }
}, { timestamps: true });

module.exports = mongoose.model('Product', productSchema);
