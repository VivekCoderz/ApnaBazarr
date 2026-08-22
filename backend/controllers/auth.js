const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'apnabazarr_secret_key_2026';

module.exports.signup = async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name,
      email,
      phone: phone || '',
      password: passwordHash
    });

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });
    return res.status(201).json({
      success: true,
      message: 'Signup successful!',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        phone: newUser.phone,
        role: newUser.role || 'user',
        cart: [],
        wishlist: [],
        recentlyViewed: []
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

module.exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid password.' });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/'
    });
    return res.json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role || 'user',
        cart: user.cart || [],
        wishlist: user.wishlist || [],
        recentlyViewed: user.recentlyViewed || []
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

module.exports.logout = (req, res) => {
  // 1. Clear secure sameSite=none cookie (for Production/HTTPS)
  res.cookie('token', '', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    expires: new Date(0)
  });
  // 2. Clear standard cookie (for Local HTTP testing)
  res.cookie('token', '', {
    path: '/',
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ success: true, message: 'Logged out successfully.' });
};

module.exports.getme = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, user });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

module.exports.updateCart = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { cart } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { cart },
      { new: true }
    ).select('-password');

    return res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Server error updating cart.' });
  }
};

module.exports.updateWishlist = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { wishlist } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { wishlist },
      { new: true }
    ).select('-password');

    return res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error('Update wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error updating wishlist.' });
  }
};

module.exports.updateRecentlyViewed = async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const decoded = jwt.verify(token, JWT_SECRET);
    const { recentlyViewed } = req.body;

    const user = await User.findByIdAndUpdate(
      decoded.id,
      { recentlyViewed },
      { new: true }
    ).select('-password');

    return res.json({ success: true, recentlyViewed: user.recentlyViewed });
  } catch (error) {
    console.error('Update recently viewed error:', error);
    res.status(500).json({ success: false, message: 'Server error updating recently viewed.' });
  }
};

module.exports.registerSeller = async (req, res) => {
  try {
    const { shopName, shopDescription, shopAddress, phone } = req.body;

    if (!shopName || !shopAddress || !phone) {
      return res.status(400).json({ success: false, message: 'Please provide shop name, shop address, and contact number.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        role: 'seller',
        sellerProfile: {
          shopName,
          shopDescription: shopDescription || '',
          shopAddress,
          phone,
          status: 'approved'
        }
      },
      { new: true }
    ).select('-password');

    return res.json({
      success: true,
      message: 'Successfully registered as a seller!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Register Seller Error:', error);
    res.status(500).json({ success: false, message: 'Server error during seller registration.' });
  }
};

module.exports.getSellersForAdmin = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.email !== 'admin@apnabazarr.com') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const Product = require('../models/Product');
    const Order = require('../models/Order');
    const Setting = require('../models/Setting');

    let commissionSetting = await Setting.findOne({ key: 'commission_percentage' });
    if (!commissionSetting) {
      commissionSetting = await Setting.create({ key: 'commission_percentage', value: '10' });
    }
    const commissionPercent = Number(commissionSetting.value) || 10;

    const sellers = await User.find({ role: 'seller' });
    const sellerIds = sellers.map(s => s._id);

    // Batch fetch all seller products
    const allSellerProducts = await Product.find({ seller: { $in: sellerIds } });
    
    // Map products to their sellers in memory
    const productsBySeller = {};
    const productSellerMap = {};
    allSellerProducts.forEach(p => {
      const sellerIdStr = String(p.seller);
      if (!productsBySeller[sellerIdStr]) {
        productsBySeller[sellerIdStr] = [];
      }
      productsBySeller[sellerIdStr].push(String(p._id));
      productSellerMap[String(p._id)] = sellerIdStr;
    });

    // Batch fetch all orders that contain any seller products
    const allProductIds = allSellerProducts.map(p => String(p._id));
    const allOrders = await Order.find({ 'items.productId': { $in: allProductIds } });

    // Aggregate sales and counts in memory
    const sellerSales = {};
    const sellerItems = {};
    allOrders.forEach(order => {
      order.items.forEach(item => {
        const prodIdStr = String(item.productId);
        const sellerIdStr = productSellerMap[prodIdStr];
        if (sellerIdStr) {
          if (!sellerSales[sellerIdStr]) sellerSales[sellerIdStr] = 0;
          if (!sellerItems[sellerIdStr]) sellerItems[sellerItems] = 0; // Fix: use sellerItems keys correctly
          if (!sellerItems[sellerIdStr]) sellerItems[sellerIdStr] = 0;
          sellerSales[sellerIdStr] += item.price * item.quantity;
          sellerItems[sellerIdStr] += item.quantity;
        }
      });
    });

    const sellerReports = sellers.map(seller => {
      const sellerIdStr = String(seller._id);
      const prodIds = productsBySeller[sellerIdStr] || [];
      const totalSales = sellerSales[sellerIdStr] || 0;
      const totalItems = sellerItems[sellerIdStr] || 0;
      const commissionEarned = Math.round((totalSales * commissionPercent) / 100);

      return {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        shopName: seller.sellerProfile?.shopName || seller.name,
        shopDescription: seller.sellerProfile?.shopDescription || '',
        shopAddress: seller.sellerProfile?.shopAddress || '',
        phone: seller.sellerProfile?.phone || seller.phone || '',
        productsCount: prodIds.length,
        totalSales,
        totalItems,
        commissionEarned,
        status: seller.sellerProfile?.status || 'approved'
      };
    });

    res.json({ success: true, count: sellerReports.length, sellers: sellerReports, commissionPercent });
  } catch (error) {
    console.error('Fetch Admin Sellers Error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching sellers list.' });
  }
};

module.exports.updateSellerProfile = async (req, res) => {
  try {
    if (req.user.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Forbidden. Seller access required.' });
    }

    const { shopName, shopDescription, shopAddress, phone, isOpen, shopBanner } = req.body;

    if (!shopName || !shopAddress || !phone) {
      return res.status(400).json({ success: false, message: 'Shop name, address, and phone number are required.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        sellerProfile: {
          shopName,
          shopDescription: shopDescription || '',
          shopAddress,
          phone,
          status: 'approved',
          isOpen: isOpen !== undefined ? isOpen : true,
          shopBanner: shopBanner || ''
        }
      },
      { new: true }
    ).select('-password');

    return res.json({
      success: true,
      message: 'Seller shop details updated successfully!',
      user: updatedUser
    });
  } catch (error) {
    console.error('Update Seller Profile Error:', error);
    res.status(500).json({ success: false, message: 'Server error during shop update.' });
  }
};

module.exports.updateSellerStatus = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.email !== 'admin@apnabazarr.com') {
      return res.status(403).json({ success: false, message: 'Forbidden. Admin access required.' });
    }

    const { status } = req.body;
    if (!['approved', 'rejected', 'pending'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status value.' });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.sellerId,
      { 'sellerProfile.status': status },
      { new: true }
    ).select('-password');

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: 'Seller not found.' });
    }

    return res.json({
      success: true,
      message: `Seller status updated to ${status} successfully!`,
      seller: updatedUser
    });
  } catch (error) {
    console.error('Update Seller Status Error:', error);
    res.status(500).json({ success: false, message: 'Server error updating seller status.' });
  }
};