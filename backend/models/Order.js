const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: String, required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  image: { type: String },
  customText: { type: String },
  customImage: { type: String }
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
  items: [orderItemSchema],
  shippingAddress: shippingAddressSchema,
  paymentMethod: { type: String, required: true },
  paymentStatus: { type: String, default: 'Completed' },
  orderStatus: { 
    type: String, 
    enum: ['Order Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'], 
    default: 'Order Placed' 
  },
  totalAmount: { type: Number, required: true },
  estimatedDelivery: { type: String },
  paymentId: { type: String },
  razorpayOrderId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Order', orderSchema);
