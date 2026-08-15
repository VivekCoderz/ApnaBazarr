require('dotenv').config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const authRoute = require('./routes/auth.js');
const productsRoute = require('./routes/products.js');
const orderRoute = require('./routes/order.js');
const uploadRoute = require('./routes/upload.js');
const feedbackRoute = require('./routes/feedback.js');
const reviewRoute = require('./routes/review.js');
const settingRoute = require('./routes/setting.js');

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({ origin: ['https://apnabazarr.vercel.app','http://localhost:5173','http://localhost:5174','http://localhost:5175'], credentials: true }));
app.use(cookieParser());

app.use('/auth', authRoute);
app.use('/products', productsRoute);
app.use('/orders', orderRoute);
app.use('/api/upload', uploadRoute);
app.use('/feedbacks', feedbackRoute);
app.use('/reviews', reviewRoute);
app.use('/settings', settingRoute);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'Apna Bazarr API',
    market: 'India (INR)',
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME ? 'connected' : 'not configured'
  });
});

// Database Connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://vivekgarg0605:06062005@business.kyssclv.mongodb.net/ApnaBazar';
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Database connected to Apna Bazarr MongoDB");
  })
  .catch((err) => {
    console.warn("⚠️  MongoDB connection warning:", err.message);
  });

// Global JSON Error Handler
app.use((err, req, res, next) => {
  console.error("❌ Unhandled API Error:", err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || "Internal Server Error"
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Apna Bazarr Backend running`);
});