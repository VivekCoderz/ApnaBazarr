const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;

module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies.token;
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.admin) {
      req.user = {
        _id: new (require('mongoose').Types.ObjectId)('000000000000000000000000'),
        email: 'admin@apnabazarr.com',
        role: 'admin',
        name: 'Dhagaro Admin'
      };
      return next();
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User account not found.' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    return res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
};

// Optional auth for public routes: returns the admin stand-in, the logged-in user, or
// null. Never rejects the request.
module.exports.optionalUser = async (req) => {
  try {
    const token = req.headers.authorization?.split(' ')[1] || req.cookies?.token;
    if (!token) return null;
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.admin) return { role: 'admin', email: 'admin@apnabazarr.com' };
    return await User.findById(decoded.id).select('-password');
  } catch {
    return null;
  }
};
