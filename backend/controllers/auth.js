const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const crypto = require('crypto');
const { publicAddress } = require('../utils/address');

// Session cookie: httpOnly (JS can't read it), Secure, and SameSite=None because the
// shop (vercel.app) and the API (onrender.com) are different sites. Lifetime matches
// the JWT expiry so the browser drops it when the token stops working.
const SESSION_DAYS = 7;
const SESSION_COOKIE = {
  httpOnly: true,
  secure: true,
  sameSite: 'none',
  path: '/',
  maxAge: SESSION_DAYS * 24 * 60 * 60 * 1000
};
const LOGIN_FAILED = 'Invalid email or password.';
// Compared against when the email is unknown, so a wrong email takes as long as a
// wrong password (timing would otherwise reveal which emails have accounts)
const DUMMY_HASH = '$2b$10$CwTycUXWue0Thq9StjUM0uJ8.Ao/vF3gkEDGq3V2xwUt9FQ2h2CSu';

// Constant-time string comparison for the admin password
const safeEqual = (a, b) => {
  const ha = crypto.createHash('sha256').update(String(a)).digest();
  const hb = crypto.createHash('sha256').update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
};

// Emails are compared case-insensitively ("Ravi@Gmail.com" is the same account as
// "ravi@gmail.com"). Older accounts may be stored with capitals, so look up both ways.
const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const normaliseEmail = (email) => (typeof email === 'string' ? email.trim() : '');
const findUserByEmail = async (email) =>
  (await User.findOne({ email })) ||
  (await User.findOne({ email: new RegExp(`^${escapeRegex(email)}$`, 'i') }));

// Logged-in user id from the session cookie / bearer token, or null
const sessionUserId = (req) => {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET).id || null;
  } catch {
    return null;
  }
};

module.exports.sessionUserId = sessionUserId;

module.exports.signup = async (req, res) => {
  try {
    const { name, phone, password } = req.body;
    const email = normaliseEmail(req.body.email).toLowerCase();

    if (typeof name !== 'string' || !name.trim() || !email || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password.' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      name: name.trim(),
      email,
      phone: typeof phone === 'string' ? phone.trim() : '',
      password: passwordHash
    });

    const token = jwt.sign({ id: newUser._id, email: newUser.email }, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });

    res.cookie('token', token, SESSION_COOKIE);
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
        recentlyViewed: [],
        addresses: []
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    res.status(500).json({ success: false, message: 'Server error during signup.' });
  }
};

module.exports.login = async (req, res) => {
  try {
    const email = normaliseEmail(req.body.email);
    const { password } = req.body;

    if (!email || typeof password !== 'string' || !password) {
      return res.status(400).json({ success: false, message: 'Please enter email and password.' });
    }

    // Same message (and roughly the same time) for an unknown email and a wrong
    // password, so the login form can't be used to find out who has an account
    const user = await findUserByEmail(email);
    const isMatch = await bcrypt.compare(password, user?.password || DUMMY_HASH);
    if (!user || !isMatch) {
      return res.status(400).json({ success: false, message: LOGIN_FAILED });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });

    res.cookie('token', token, SESSION_COOKIE);
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
        recentlyViewed: user.recentlyViewed || [],
        addresses: (user.addresses || []).map(publicAddress)
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
};

// "Continue with Google": the browser gets a signed ID token from Google Identity Services;
// we ask Google to verify it (tokeninfo checks the signature and expiry), then make sure it
// was issued for OUR client id and that Google has verified the email. Existing accounts with
// the same email are logged in; new emails get an account with an unusable random password.
const GOOGLE_ISSUERS = ['accounts.google.com', 'https://accounts.google.com'];

module.exports.googleLogin = async (req, res) => {
  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return res.status(503).json({ success: false, message: 'Google login is not set up yet.' });

    const credential = req.body?.credential;
    if (typeof credential !== 'string' || credential.length < 100 || credential.length > 4096) {
      return res.status(400).json({ success: false, message: 'Google sign-in failed. Please try again.' });
    }

    const r = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
    const info = r.ok ? await r.json() : null;
    const valid = info && info.aud === clientId && GOOGLE_ISSUERS.includes(info.iss) &&
      (info.email_verified === true || info.email_verified === 'true') && Number(info.exp) * 1000 > Date.now();
    if (!valid || !info.email) {
      return res.status(401).json({ success: false, message: 'Google sign-in failed. Please try again.' });
    }

    const email = normaliseEmail(info.email).toLowerCase();
    let user = await findUserByEmail(email);
    if (!user) {
      const passwordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
      user = await User.create({
        name: (typeof info.name === 'string' && info.name.trim()) || email.split('@')[0],
        email,
        phone: '',
        password: passwordHash
      });
    }

    const token = jwt.sign({ id: user._id, email: user.email }, JWT_SECRET, { expiresIn: `${SESSION_DAYS}d` });
    res.cookie('token', token, SESSION_COOKIE);
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
        recentlyViewed: user.recentlyViewed || [],
        addresses: (user.addresses || []).map(publicAddress)
      }
    });
  } catch (error) {
    console.error('Google Login Error:', error);
    res.status(500).json({ success: false, message: 'Server error during Google sign-in.' });
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
    const userId = sessionUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { cart } = req.body;
    if (!Array.isArray(cart)) return res.status(400).json({ success: false, message: 'Invalid cart.' });

    const user = await User.findByIdAndUpdate(
      userId,
      { cart: cart.slice(0, 100) },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

    return res.json({ success: true, cart: user.cart });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({ success: false, message: 'Server error updating cart.' });
  }
};

module.exports.updateWishlist = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { wishlist } = req.body;
    if (!Array.isArray(wishlist)) return res.status(400).json({ success: false, message: 'Invalid wishlist.' });

    const user = await User.findByIdAndUpdate(
      userId,
      { wishlist: wishlist.slice(0, 100) },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

    return res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    console.error('Update wishlist error:', error);
    res.status(500).json({ success: false, message: 'Server error updating wishlist.' });
  }
};

module.exports.updateRecentlyViewed = async (req, res) => {
  try {
    const userId = sessionUserId(req);
    if (!userId) return res.status(401).json({ success: false, message: 'Not authenticated' });

    const { recentlyViewed } = req.body;
    if (!Array.isArray(recentlyViewed)) return res.status(400).json({ success: false, message: 'Invalid recently viewed.' });

    const user = await User.findByIdAndUpdate(
      userId,
      { recentlyViewed: recentlyViewed.slice(0, 100) },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) return res.status(401).json({ success: false, message: 'Not authenticated' });

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

    if (req.user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'The admin account cannot register as a seller.' });
    }
    const alreadySeller = req.user.role === 'seller' && req.user.sellerProfile?.status;
    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      {
        $set: {
          role: 'seller',
          'sellerProfile.shopName': shopName,
          'sellerProfile.shopDescription': shopDescription || '',
          'sellerProfile.shopAddress': shopAddress,
          'sellerProfile.phone': phone,
          'sellerProfile.status': alreadySeller ? req.user.sellerProfile.status : 'approved'
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

    const { shopName, shopDescription, shopAddress, phone, isOpen, shopBanner, shopLogo, pickupPincode, returnPolicy, deliveryInformation, bankDetails } = req.body;

    if (!shopName || !shopAddress || !phone) {
      return res.status(400).json({ success: false, message: 'Shop name, address, and phone number are required.' });
    }

    // $set individual fields: the approval status stays as the admin set it, and
    // bank details / logo / policies sent by the dashboard are saved (they were dropped before)
    const str = (v) => (typeof v === 'string' ? v : '');
    const set = {
      'sellerProfile.shopName': str(shopName),
      'sellerProfile.shopDescription': str(shopDescription),
      'sellerProfile.shopAddress': str(shopAddress),
      'sellerProfile.phone': str(phone),
      'sellerProfile.isOpen': isOpen !== undefined ? Boolean(isOpen) : true,
      'sellerProfile.shopBanner': str(shopBanner)
    };
    if (shopLogo !== undefined) set['sellerProfile.shopLogo'] = str(shopLogo);
    if (pickupPincode !== undefined) set['sellerProfile.pickupPincode'] = str(pickupPincode);
    if (returnPolicy !== undefined) set['sellerProfile.returnPolicy'] = str(returnPolicy);
    if (deliveryInformation !== undefined) set['sellerProfile.deliveryInformation'] = str(deliveryInformation);
    if (bankDetails && typeof bankDetails === 'object') {
      ['accountName', 'accountNumber', 'ifscCode', 'bankName'].forEach(k => {
        if (bankDetails[k] !== undefined) set[`sellerProfile.bankDetails.${k}`] = str(bankDetails[k]);
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user._id,
      { $set: set },
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

module.exports.adminLogin = async (req, res) => {
  const { email, password } = req.body;
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    return res.status(500).json({ success: false, message: 'Admin login is not configured on the server.' });
  }

  if (typeof email !== 'string' || typeof password !== 'string' || !email || !password
      || !safeEqual(email.trim().toLowerCase(), adminEmail.toLowerCase()) || !safeEqual(password, adminPassword)) {
    return res.status(401).json({ success: false, message: 'Invalid Admin Email or Password!' });
  }

  // 7 days to match the admin panel's apna_admin_token cookie (the panel has no
  // "session expired" handling, so a shorter token would break it mid-week)
  const token = jwt.sign({ admin: true, email: adminEmail }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ success: true, admin: { email: adminEmail, role: 'admin', token } });
};
