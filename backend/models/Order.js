const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
  customText: { type: String },
  customImage: { type: String },
  size: { type: String },
  color: { type: String },
  sellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  commissionPercent: { type: Number, default: 10 },
  commissionAmount: { type: Number, default: 0 },
  shippingCharges: { type: Number, default: 0 },
  sellerPayout: { type: Number, default: 0 },
  payoutStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  itemStatus: {
    type: String,
    enum: ['Order Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled', 'Returned'],
    default: 'Order Placed'
  }
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  pincode: { type: String, required: true },
  flatNo: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  addressType: { type: String, default: 'Home' }
});

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  userEmail: { type: String, required: true },
  // true when placed without being logged in: userEmail is then only contact info typed
  // at checkout and the order is not shown in any account with that email
  isGuest: { type: Boolean, default: false },
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, default: 'Completed' },
  orderStatus: { 
    type: String, 
    enum: ['Order Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'], 
    default: 'Order Placed' 
  },
  // Amount the customer pays/paid: items + shipping - voucherDiscount - onlineDiscount
  totalAmount: { type: Number, required: true },
  // Flat discount for paying online (backend/utils/payment.js); 0 for COD/offline orders
  onlineDiscount: { type: Number, default: 0 },
  // Automatic first-order voucher (backend/utils/voucher.js), e.g. 'PANIPAT30' / 30; '' / 0 when none
  voucherCode: { type: String, default: '' },
  voucherDiscount: { type: Number, default: 0 },
  // Old-clothes take-back (utils/exchange.js). optedIn: customer will hand over old clothes at
  // delivery; collected/kg: set by the admin when we actually pick them up (earns one ₹40
  // credit); redeemedBy: the later order that used that credit.
  exchange: {
    optedIn: { type: Boolean, default: false },
    collected: { type: Boolean, default: false },
    collectedAt: { type: Date },
    kg: { type: Number, default: 0 },
    redeemedBy: { type: String, default: '' }
  },
  estimatedDelivery: { type: String },
  paymentId: { type: String },
  razorpayOrderId: { type: String },
  isOffline: { type: Boolean, default: false },
  resellerCode: { type: String },
  // Marketing channel the customer came from (utm_source / facebook / instagram / google / direct)
  source: { type: String, default: '' },
  resellerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resellerCommission: { type: Number, default: 0 },
  resellerPayoutStatus: { type: String, enum: ['pending', 'paid'], default: 'pending' },
  packagingCost: { type: Number, default: 0 },
  shippingCost: { type: Number, default: 0 },
  packagingCharge: { type: Number, default: 0 },
  shippingCharge: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
