require('dotenv').config();

const missingEnv = ['MONGO_URI', 'JWT_SECRET', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET', 'ADMIN_EMAIL', 'ADMIN_PASSWORD']
  .filter(key => !process.env[key]);
if (missingEnv.length) {
  console.error(`❌ Missing environment variables: ${missingEnv.join(', ')}. See backend/.env.example`);
  process.exit(1);
}

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
const resellerRoute = require('./routes/reseller.js');

const app = express();
app.set('trust proxy', 1);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors({ origin: ['https://dhagaro.vercel.app','https://apnabazarr.vercel.app','http://localhost:5173','http://localhost:5174','http://localhost:5175'], credentials: true }));
app.use(cookieParser());

app.use('/auth', authRoute);
app.use('/products', productsRoute);
app.use('/orders', orderRoute);
app.use('/api/upload', uploadRoute);
app.use('/feedbacks', feedbackRoute);
app.use('/reviews', reviewRoute);
app.use('/settings', settingRoute);
app.use('/reseller', resellerRoute);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'Dhagaro API',
    market: 'India (INR)',
    cloudinary: !!process.env.CLOUDINARY_CLOUD_NAME ? 'connected' : 'not configured'
  });
});

// Database Connection
const MONGODB_URI = process.env.MONGO_URI || process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log("✅ Database connected to Dhagaro MongoDB");
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
  console.log(`🚀 Dhagaro Backend running`);
});
