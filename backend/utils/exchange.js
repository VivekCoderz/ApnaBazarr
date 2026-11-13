// "Give old clothes, get ₹40 off" (take-back & exchange pilot, Panipat).
// 1. At checkout a Panipat customer ticks "I'll hand over old clothes / an old mat at delivery"
//    (order.exchange.optedIn).
// 2. When we deliver and actually collect them, the admin marks the order "collected" with
//    the weight (order.exchange.collected / kg). That earns one EXCHANGE40 credit.
// 3. The customer's NEXT order (same 10-digit phone) gets ₹40 off automatically. Each credit
//    is used once: order.exchange.redeemedBy holds the order that used it.
// The server decides all of this; the browser never sends a discount.

const Order = require('../models/Order');
const { last10, panipatVoucher } = require('./voucher');

const EXCHANGE_CODE = 'EXCHANGE40';
const EXCHANGE_CREDIT = 40;
const EXCHANGE_LABEL = 'Old-clothes exchange credit';
const MAX_KG = 25;
// Earn: at least 1 kg handed over. Use: on a next order with items worth ₹199 or more.
const EXCHANGE_MIN_KG = 1;
const EXCHANGE_MIN_ORDER = 199;

// Orders delivered to this phone (bare 10 digits, or spaced / +91 forms)
function phoneFilter(phone) {
  const digits = last10(phone);
  if (digits.length !== 10) return null;
  return {
    $or: [
      { 'shippingAddress.phone': digits },
      { 'shippingAddress.phone': new RegExp(`${digits.split('').join('\\D*')}\\D*$`) }
    ]
  };
}

const UNUSED_CREDIT = { 'exchange.collected': true, 'exchange.redeemedBy': { $in: ['', null] } };

// { code, amount, label, sourceOrderId } when this phone has an unused credit, otherwise null
async function exchangeCredit(phone) {
  const byPhone = phoneFilter(phone);
  if (!byPhone) return null;
  const source = await Order.findOne({ ...byPhone, ...UNUSED_CREDIT }).sort({ 'exchange.collectedAt': 1 }).select('orderId');
  if (!source) return null;
  return { code: EXCHANGE_CODE, amount: EXCHANGE_CREDIT, label: EXCHANGE_LABEL, sourceOrderId: source.orderId };
}

// Marks the credit on sourceOrderId as used by newOrderId. Atomic: true only for the one
// order that wins if two are placed at the same moment.
async function claimExchangeCredit(sourceOrderId, newOrderId) {
  if (!sourceOrderId || !newOrderId) return false;
  const res = await Order.updateOne(
    { orderId: sourceOrderId, ...UNUSED_CREDIT },
    { $set: { 'exchange.redeemedBy': newOrderId } }
  );
  return res.modifiedCount === 1;
}

// Gives the credit back (the order that claimed it failed to save)
async function releaseExchangeCredit(sourceOrderId, newOrderId) {
  if (!sourceOrderId || !newOrderId) return;
  await Order.updateOne({ orderId: sourceOrderId, 'exchange.redeemedBy': newOrderId }, { $set: { 'exchange.redeemedBy': '' } });
}

// Weight typed by the admin: 1–25 kg (one decimal), or null
function cleanKg(raw) {
  const kg = Math.round(Number(raw) * 10) / 10;
  return kg >= EXCHANGE_MIN_KG && kg <= MAX_KG ? kg : null;
}

// Public impact numbers for the /recycle page
async function exchangeImpact() {
  const [row] = await Order.aggregate([
    { $match: { 'exchange.collected': true } },
    { $group: { _id: null, collections: { $sum: 1 }, kg: { $sum: { $ifNull: ['$exchange.kg', 0] } } } }
  ]);
  return { collections: row ? row.collections : 0, kg: row ? Math.round(row.kg * 10) / 10 : 0 };
}

// The one automatic discount for an order: PANIPAT30 (first order) or else an unused
// exchange credit. They never stack (a credit needs an earlier order, so it is never a first order).
async function orderVoucher({ pincode, subtotal, phone, email } = {}) {
  const first = await panipatVoucher({ pincode, subtotal, phone, email });
  if (first) return first;
  if (!(Number(subtotal) >= EXCHANGE_MIN_ORDER)) return null;
  return exchangeCredit(phone);
}

module.exports = {
  orderVoucher,
  EXCHANGE_CODE,
  EXCHANGE_CREDIT,
  EXCHANGE_MIN_KG,
  EXCHANGE_MIN_ORDER,
  EXCHANGE_LABEL,
  exchangeCredit,
  claimExchangeCredit,
  releaseExchangeCredit,
  cleanKg,
  exchangeImpact
};
