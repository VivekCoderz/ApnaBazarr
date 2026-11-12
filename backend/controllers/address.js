// Saved delivery addresses for the logged-in customer (/auth/addresses).
// Every handler reads and writes only the account in the session token.
const mongoose = require('mongoose');
const User = require('../models/User');
const { sessionUserId } = require('./auth');
const {
  MAX_ADDRESSES,
  validateAddress,
  addressKey,
  publicAddress,
  withOneDefault
} = require('../utils/address');

const NOT_AUTH = { success: false, message: 'Please log in to manage saved addresses.' };

const send = (res, list, message, status = 200) =>
  res.status(status).json({ success: true, message, addresses: (list || []).map(publicAddress) });

// The account's current addresses as plain objects, or null when the user is gone
async function loadAddresses(userId) {
  const user = await User.findById(userId).select('addresses').lean();
  return user ? (user.addresses || []) : null;
}

// Whole-list write: the list was checked in code (max, duplicates, one default)
async function saveAddresses(userId, list) {
  const user = await User.findByIdAndUpdate(
    userId,
    { $set: { addresses: list } },
    { new: true, runValidators: true }
  ).select('addresses').lean();
  return user ? (user.addresses || []) : [];
}

const withAuth = (handler, label) => async (req, res) => {
  try {
    const userId = sessionUserId(req);
    if (!userId || !mongoose.isValidObjectId(userId)) return res.status(401).json(NOT_AUTH);
    const list = await loadAddresses(userId);
    if (!list) return res.status(401).json(NOT_AUTH);
    return await handler(req, res, userId, list);
  } catch (error) {
    console.error(`${label} error:`, error);
    return res.status(500).json({ success: false, message: 'Server error. Please try again.' });
  }
};

const findIndex = (list, id) => list.findIndex(a => String(a._id) === id);

module.exports.listAddresses = withAuth(async (req, res, userId, list) => send(res, list), 'List addresses');

module.exports.addAddress = withAuth(async (req, res, userId, list) => {
  const { address, error } = validateAddress(req.body);
  if (error) return res.status(400).json({ success: false, message: error });
  const makeDefault = req.body.isDefault === true;

  const existing = list.findIndex(a => addressKey(a) === addressKey(address));
  if (existing !== -1) {
    if (!makeDefault || list[existing].isDefault) return send(res, list, 'This address is already saved.');
    const updated = await saveAddresses(userId, list.map((a, i) => ({ ...a, isDefault: i === existing })));
    return send(res, updated, 'Default address updated.');
  }
  if (list.length >= MAX_ADDRESSES) {
    return res.status(400).json({ success: false, message: `You can save up to ${MAX_ADDRESSES} addresses. Please remove one first.` });
  }

  let next = [...list, { ...address, isDefault: makeDefault }];
  if (makeDefault) next = next.map((a, i) => ({ ...a, isDefault: i === next.length - 1 }));
  const updated = await saveAddresses(userId, withOneDefault(next));
  return send(res, updated, 'Address saved.', 201);
}, 'Add address');

module.exports.updateAddress = withAuth(async (req, res, userId, list) => {
  const { addressId } = req.params;
  if (!mongoose.isValidObjectId(addressId)) return res.status(400).json({ success: false, message: 'Invalid address.' });
  const idx = findIndex(list, addressId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Address not found.' });

  let next = [...list];
  // Edit: any address field sent means the merged address must be valid as a whole
  const body = req.body || {};
  const editing = ['fullName', 'phone', 'pincode', 'flatNo', 'area', 'city', 'state', 'addressType']
    .some(f => body[f] !== undefined);
  if (editing) {
    const { address, error } = validateAddress({ ...list[idx], ...body });
    if (error) return res.status(400).json({ success: false, message: error });
    const key = addressKey(address);
    if (list.some((a, i) => i !== idx && addressKey(a) === key)) {
      return res.status(400).json({ success: false, message: 'This address is already saved.' });
    }
    next[idx] = { ...list[idx], ...address };
  }
  if (body.isDefault === true) next = next.map((a, i) => ({ ...a, isDefault: i === idx }));

  const updated = await saveAddresses(userId, withOneDefault(next));
  return send(res, updated, 'Address updated.');
}, 'Update address');

module.exports.deleteAddress = withAuth(async (req, res, userId, list) => {
  const { addressId } = req.params;
  if (!mongoose.isValidObjectId(addressId)) return res.status(400).json({ success: false, message: 'Invalid address.' });
  const idx = findIndex(list, addressId);
  if (idx === -1) return res.status(404).json({ success: false, message: 'Address not found.' });

  const next = list.filter((_, i) => i !== idx);
  const updated = await saveAddresses(userId, next.length ? withOneDefault(next) : []);
  return send(res, updated, 'Address removed.');
}, 'Delete address');
