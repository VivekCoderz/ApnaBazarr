// Signed "write a review" links sent to customers after delivery. The token proves the
// link came from us for this order + product, so the review can be marked Verified buyer.
const crypto = require('crypto');

const SITE_URL = 'https://dhagaro.vercel.app';

function reviewToken(orderId, productId) {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return crypto.createHmac('sha256', secret).update(`${orderId}:${productId}`).digest('hex').slice(0, 16);
}

// Constant-time check; any malformed input simply fails
function isValidReviewToken(orderId, productId, token) {
  if (typeof orderId !== 'string' || typeof productId !== 'string' || typeof token !== 'string') return false;
  if (!/^[0-9a-f]{16}$/i.test(token)) return false;
  const expected = Buffer.from(reviewToken(orderId, productId));
  const given = Buffer.from(token.toLowerCase());
  return given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

function reviewLink(orderId, productId) {
  const query = new URLSearchParams({ review: orderId, t: reviewToken(orderId, productId) });
  return `${SITE_URL}/product/${encodeURIComponent(productId)}?${query}#write-review`;
}

module.exports = { reviewToken, isValidReviewToken, reviewLink, SITE_URL };
