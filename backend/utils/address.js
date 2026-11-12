// Saved delivery addresses on a user account: validation, de-duplication and the
// "remember the address used for this order" step. Shared by controllers/address.js
// and controllers/order.js.
const User = require('../models/User');

const ADDRESS_FIELDS = ['fullName', 'phone', 'pincode', 'flatNo', 'area', 'city', 'state'];
const ADDRESS_TYPES = ['Home', 'Work', 'Other'];
const MAX_ADDRESSES = 5;
const MAX_LEN = 100;

// 10-digit Indian mobile from "+91 98765 43210", "09876543210", "98765-43210" ...; '' if not one
function normalisePhone(raw) {
  let digits = String(raw || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) digits = digits.slice(2);
  else if (digits.length === 11 && digits.startsWith('0')) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : '';
}

// { address } with trimmed plain strings, or { error } with a shopper-friendly message
function validateAddress(raw) {
  if (!raw || typeof raw !== 'object') return { error: 'Please enter your delivery address.' };
  const out = {};
  for (const f of ADDRESS_FIELDS) {
    const v = typeof raw[f] === 'string' ? raw[f].replace(/\s+/g, ' ').trim() : '';
    if (!v) return { error: 'Please fill in the full address (name, phone, pincode, house no., area, city, state).' };
    if (v.length > MAX_LEN) return { error: 'Each address line can be at most 100 characters.' };
    out[f] = v;
  }
  out.phone = normalisePhone(out.phone);
  if (!out.phone) return { error: 'Please enter a valid 10-digit mobile number.' };
  if (!/^\d{6}$/.test(out.pincode)) return { error: 'Pincode must be 6 digits.' };
  out.addressType = ADDRESS_TYPES.includes(raw.addressType) ? raw.addressType : 'Home';
  return { address: out };
}

// Two addresses are the same when every field matches, ignoring case and extra spaces
const addressKey = (a) => ADDRESS_FIELDS
  .map(f => (f === 'phone' ? normalisePhone(a[f]) : String(a[f] || '').replace(/\s+/g, ' ').trim().toLowerCase()))
  .join('|');

// What the browser gets: no Mongo internals beyond the id
const publicAddress = (a) => ({
  _id: String(a._id),
  fullName: a.fullName,
  phone: a.phone,
  pincode: a.pincode,
  flatNo: a.flatNo,
  area: a.area,
  city: a.city,
  state: a.state,
  addressType: a.addressType || 'Home',
  isDefault: Boolean(a.isDefault)
});

// Exactly one default while the list is not empty (the first one if none / several are marked)
function withOneDefault(list) {
  const idx = list.findIndex(a => a.isDefault);
  const keep = idx === -1 ? 0 : idx;
  return list.map((a, i) => ({ ...a, isDefault: i === keep }));
}

// After a logged-in customer's order: add its address to the account unless it is already
// saved or the account is full. Best effort only: never throws, never fails the order.
async function rememberOrderAddress(userId, rawAddress) {
  try {
    if (!userId) return;
    const { address } = validateAddress(rawAddress);
    if (!address) return;
    const user = await User.findById(userId).select('addresses').lean();
    if (!user) return;
    const list = user.addresses || [];
    if (list.length >= MAX_ADDRESSES) return;
    const key = addressKey(address);
    if (list.some(a => addressKey(a) === key)) return;
    // The size guard in the filter keeps the max even if two orders land at once
    await User.updateOne(
      { _id: userId, [`addresses.${MAX_ADDRESSES - 1}`]: { $exists: false } },
      { $push: { addresses: { ...address, isDefault: list.length === 0 } } }
    );
  } catch (err) {
    console.error('Remember order address failed:', err.message);
  }
}

module.exports = {
  ADDRESS_FIELDS,
  MAX_ADDRESSES,
  normalisePhone,
  validateAddress,
  addressKey,
  publicAddress,
  withOneDefault,
  rememberOrderAddress
};
