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
const helmet = require("helmet");
const { limiters, sanitizeBody } = require('./middlewares/security.js');

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
app.disable('x-powered-by');

// Security headers. This server only returns JSON, so the strictest CSP is fine; the
// cross-origin resource policy is relaxed because the Vercel site (another origin)
// calls this API with credentials.
app.use(helmet({
  contentSecurityPolicy: { useDefaults: false, directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] } },
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  crossOriginOpenerPolicy: false,
}));
app.use(cors({ origin: ['https://dhagaro.vercel.app','https://apnabazarr.vercel.app','http://localhost:5173','http://localhost:5174','http://localhost:5175'], credentials: true }));
app.use(limiters.global);

// JSON bodies are small (cart, address, product form); files go through multipart uploads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(sanitizeBody);
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

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Not found.' });
});

// Global JSON Error Handler: client errors (bad JSON, body too large) keep their
// short message; anything else is logged and answered with a generic message so
// stack traces, database or Cloudinary details never reach the browser.
app.use((err, req, res, next) => {
  const status = Number(err.status || err.statusCode) || 500;
  if (status >= 500) console.error("❌ Unhandled API Error:", err);
  const message = status === 413 ? 'Request is too large.'
    : status < 500 && err.expose !== false ? (err.message || 'Bad request.')
    : 'Something went wrong. Please try again.';
  res.status(status).json({ success: false, message, error: message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Dhagaro Backend running`);
});
