// Online payment (UPI/card via Razorpay) discount. The frontend shows the same number
// (frontend/src/config/store.js ONLINE_PAYMENT_DISCOUNT), but only this file decides it:
// createRazorpayOrder charges total - discount and verifyRazorpayPayment checks the
// paid amount against the same figure. COD orders never get it.

const ONLINE_PAYMENT_DISCOUNT = 25;

// Discount for an online order whose total (items + shipping) is `orderTotal`.
// Only when the total is above the discount, so the charge never drops to ₹0 or below
// (in practice the ₹100 minimum order is checked first).
function onlineDiscount(orderTotal) {
  return Number(orderTotal) > ONLINE_PAYMENT_DISCOUNT ? ONLINE_PAYMENT_DISCOUNT : 0;
}

module.exports = { ONLINE_PAYMENT_DISCOUNT, onlineDiscount };
