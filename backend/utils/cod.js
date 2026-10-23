// Cash on Delivery rules. COD is open to every buyer (no secret code), but large
// COD orders are risky (fake orders / RTO), so they are capped per order.

const COD_MAX_AMOUNT = 3000;

const COD_LIMIT_MESSAGE =
  'Cash on Delivery sirf ₹3,000 tak ke order par hai. Is order ke liye online payment (UPI/Card) karein, ya WhatsApp karein: +91 93068 10726.';

// Returns an error message when this COD order is not allowed, otherwise null
function codLimitError(orderTotal) {
  if (Number(orderTotal) > COD_MAX_AMOUNT) return COD_LIMIT_MESSAGE;
  return null;
}

module.exports = { COD_MAX_AMOUNT, COD_LIMIT_MESSAGE, codLimitError };
