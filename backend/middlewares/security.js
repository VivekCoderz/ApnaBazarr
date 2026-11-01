// Shared security middleware: rate limiters, request-body sanitising and the
// client-IP key used by the limiters.
const { rateLimit, ipKeyGenerator } = require('express-rate-limit');

// Render sits behind Cloudflare, which sets CF-Connecting-IP to the real visitor IP
// (and overwrites any value the visitor sends). Fall back to Express's req.ip
// (trust proxy is set in server.js) when the header is missing, e.g. locally.
function clientIp(req) {
  const cf = req.headers['cf-connecting-ip'];
  return (typeof cf === 'string' && cf.trim()) ? cf.trim() : (req.ip || 'unknown');
}

// IPv6 addresses are grouped by /56 so one visitor can't dodge the limit by rotating
// addresses inside their own block.
const keyByIp = (req) => ipKeyGenerator(clientIp(req));

// Many Indian mobile users share one public IP (carrier-grade NAT), so the limits
// below are deliberately generous; they stop scripted abuse, not normal shoppers.
function limiter({ windowMs, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: keyByIp,
    // We supply our own key from CF-Connecting-IP, so the trust-proxy check does not apply
    validate: { trustProxy: false, xForwardedForHeader: false },
    handler: (req, res) => {
      res.status(429).json({ success: false, message, error: message });
    }
  });
}

const MIN = 60 * 1000;
const TRY_LATER = 'Too many attempts. Please wait a few minutes and try again.';

const limiters = {
  // Whole API: a ceiling against floods (product list etc. are heavy queries)
  global: limiter({ windowMs: 5 * MIN, limit: 1500, message: 'Too many requests. Please slow down and try again shortly.' }),
  // Only failed logins count, so a shared IP with many real customers is not locked out
  login: limiter({ windowMs: 15 * MIN, limit: 20, skipSuccessfulRequests: true, message: 'Too many failed login attempts. Please wait 15 minutes and try again.' }),
  adminLogin: limiter({ windowMs: 15 * MIN, limit: 5, skipSuccessfulRequests: true, message: 'Too many failed admin login attempts. Please wait 15 minutes.' }),
  signup: limiter({ windowMs: 60 * MIN, limit: 10, message: 'Too many sign-ups from this network. Please try again in an hour.' }),
  // COD orders and Razorpay order creation (not /orders/verify: a paid order must never be blocked)
  order: limiter({ windowMs: 60 * MIN, limit: 30, message: 'Too many orders from this network. Please WhatsApp us at +91 93068 10726 if you need help.' }),
  review: limiter({ windowMs: 60 * MIN, limit: 10, message: 'Too many reviews from this network. Please try again later.' }),
  reviewInteraction: limiter({ windowMs: 15 * MIN, limit: 100, message: TRY_LATER }),
  feedback: limiter({ windowMs: 60 * MIN, limit: 10, message: 'Too many feedback messages. Please try again later.' }),
  imageUpload: limiter({ windowMs: 60 * MIN, limit: 30, message: 'Too many uploads. Please try again later.' }),
  videoUpload: limiter({ windowMs: 60 * MIN, limit: 10, message: 'Too many video uploads. Please try again later.' })
};

// Drops object keys that MongoDB would read as operators ($gt, $where, ...) or as
// dotted paths, anywhere in the JSON body. Stops NoSQL-injection payloads such as
// { "email": { "$ne": null } }. Express 5 parses query strings with the "simple"
// parser (no nested objects), so req.query cannot carry operators.
function stripOperators(value, depth = 0) {
  if (depth > 20 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) value[i] = stripOperators(value[i], depth + 1);
    return value;
  }
  for (const key of Object.keys(value)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete value[key];
    } else {
      value[key] = stripOperators(value[key], depth + 1);
    }
  }
  return value;
}

function sanitizeBody(req, res, next) {
  if (req.body && typeof req.body === 'object') stripOperators(req.body);
  next();
}

module.exports = { limiters, sanitizeBody, clientIp };
