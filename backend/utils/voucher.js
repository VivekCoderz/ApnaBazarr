// "PANIPAT30": automatic ₹30 off a customer's FIRST order delivered in Panipat (1321xx),
// on items worth ₹199 or more (before delivery and before the online-payment discount).
// No code to type: the server decides it here and the shop only displays it.
// First order = no earlier order (any status) with the same 10-digit phone, and, for a
// logged-in customer, none filed under their account email.

const Order = require('../models/Order');
const { isPanipatPincode } = require('./shipping');

const PANIPAT_VOUCHER_CODE = 'PANIPAT30';
const PANIPAT_VOUCHER_AMOUNT = 30;
const PANIPAT_VOUCHER_MIN_SUBTOTAL = 199;
const PANIPAT_VOUCHER_LABEL = 'First order in Panipat';

const last10 = (value) => String(value || '').replace(/\D/g, '').slice(-10);

// Pincode + items subtotal rule only (no customer lookup)
const voucherRuleMet = (pincode, subtotal) =>
  isPanipatPincode(pincode) && Number(subtotal) >= PANIPAT_VOUCHER_MIN_SUBTOTAL;

// Rupees still to add to reach the voucher in Panipat, or 0
const voucherNudgeFor = (pincode, subtotal) =>
  isPanipatPincode(pincode) && Number(subtotal) > 0 && Number(subtotal) < PANIPAT_VOUCHER_MIN_SUBTOTAL
    ? PANIPAT_VOUCHER_MIN_SUBTOTAL - Number(subtotal)
    : 0;

// Has this phone (any formatting, e.g. "+91 98765 43210") or account ordered before?
async function hasOrderedBefore({ phone, email }) {
  const digits = last10(phone);
  const or = [];
  if (digits.length === 10) {
    // Stored phones are normally the bare 10 digits; also match spaced/+91 forms
    or.push({ 'shippingAddress.phone': digits });
    or.push({ 'shippingAddress.phone': new RegExp(`${digits.split('').join('\\D*')}\\D*$`) });
  }
  if (typeof email === 'string' && email.trim()) {
    or.push({ userEmail: email.trim(), isGuest: { $ne: true } });
  }
  if (!or.length) return false;
  return Boolean(await Order.exists({ $or: or }));
}

// { code, amount } when the voucher applies, otherwise null.
// phone must be a 10-digit mobile; email only for a logged-in (non-guest) customer.
async function panipatVoucher({ pincode, subtotal, phone, email } = {}) {
  if (!voucherRuleMet(pincode, subtotal)) return null;
  if (last10(phone).length !== 10) return null;
  if (await hasOrderedBefore({ phone, email })) return null;
  return { code: PANIPAT_VOUCHER_CODE, amount: PANIPAT_VOUCHER_AMOUNT, label: PANIPAT_VOUCHER_LABEL };
}

module.exports = {
  PANIPAT_VOUCHER_CODE,
  PANIPAT_VOUCHER_AMOUNT,
  PANIPAT_VOUCHER_MIN_SUBTOTAL,
  PANIPAT_VOUCHER_LABEL,
  voucherRuleMet,
  voucherNudgeFor,
  hasOrderedBefore,
  panipatVoucher,
  last10
};
