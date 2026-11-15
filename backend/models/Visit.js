const mongoose = require('mongoose');

// Anonymous store analytics: one row per event (page view, product view, add to cart,
// checkout, order). No name, phone, email or IP is stored: `vid` is a random id the
// browser keeps, `sid` a random id per browsing session. Rows delete themselves after 180 days.
const visitSchema = new mongoose.Schema({
  vid: { type: String, required: true },
  sid: { type: String, required: true },
  type: { type: String, enum: ['page', 'product', 'add_to_cart', 'checkout', 'order'], required: true },
  path: { type: String, default: '' },
  productId: { type: String, default: '' },
  source: { type: String, default: 'direct' },
  device: { type: String, enum: ['mobile', 'desktop'], default: 'mobile' },
  newVisitor: { type: Boolean, default: false },
  at: { type: Date, default: Date.now }
});

visitSchema.index({ at: 1 }, { expireAfterSeconds: 180 * 24 * 3600 });
visitSchema.index({ type: 1, at: -1 });

module.exports = mongoose.model('Visit', visitSchema);
