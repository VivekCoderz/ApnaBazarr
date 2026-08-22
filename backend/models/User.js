const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  pincode: { type: String, required: true },
  flatNo: { type: String, required: true },
  area: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  addressType: { type: String, default: 'Home' },
  isDefault: { type: Boolean, default: false }
});

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'seller', 'admin'], default: 'user' },
  sellerProfile: {
    shopName: { type: String },
    shopDescription: { type: String },
    shopAddress: { type: String },
    phone: { type: String },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'approved' },
    isOpen: { type: Boolean, default: true },
    shopBanner: { type: String, default: '' },
    shopLogo: { type: String, default: '' },
    pickupPincode: { type: String, default: '' },
    bankDetails: {
      accountName: { type: String, default: '' },
      accountNumber: { type: String, default: '' },
      ifscCode: { type: String, default: '' },
      bankName: { type: String, default: '' }
    },
    returnPolicy: { type: String, default: '7 Days Return Policy' },
    deliveryInformation: { type: String, default: 'Delivered in 3-5 business days.' },
    followersCount: { type: Number, default: 0 }
  },
  addresses: [addressSchema],
  cart: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true, default: 1 },
      image: { type: String }
    }
  ],
  wishlist: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      image: { type: String }
    }
  ],
  recentlyViewed: [
    {
      productId: { type: String, required: true },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      image: { type: String }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
