const Order = require('../models/Order');
const { notifyNewOrder } = require('../utils/notify');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

const rzp = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret
});
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const { resolveResellerForOrder } = require('./reseller');
const { orderShippingCharge: calcOrderShipping, hasFreeDeliveryTag, isPanipatPincode } = require('../utils/shipping');
const { codLimitError } = require('../utils/cod');
const { onlineDiscount } = require('../utils/payment');
const { optionalUser } = require('../middlewares/auth');
const { reviewLink } = require('../utils/reviewToken');
const { rememberOrderAddress } = require('../utils/address');
const { panipatVoucher, hasOrderedBefore, voucherNudgeFor, voucherRuleMet, last10, PANIPAT_VOUCHER_CODE, PANIPAT_VOUCHER_AMOUNT } = require('../utils/voucher');

const GUEST_EMAIL = 'guest@apnabazarr.com';

// Who the order belongs to. A logged-in customer's order is always filed under their
// own account email (whatever the form says). Anyone else is a guest: the email they
// typed is kept so we can contact them, but the order is flagged isGuest and is never
// listed in, or readable from, an account just because the email matches. Otherwise
// anyone could place orders under someone else's email and fill their order history.
async function orderOwner(req, typedEmail) {
  const viewer = await optionalUser(req);
  if (viewer && viewer.role !== 'admin' && viewer.email) {
    return { userEmail: viewer.email, isGuest: false };
  }
  const email = (typeof typedEmail === 'string' && typedEmail.trim()) ? typedEmail.trim().slice(0, 200) : GUEST_EMAIL;
  return { userEmail: email, isGuest: true };
}

// Account email of a logged-in customer (for the first-order check), otherwise ''
async function viewerEmail(req) {
  const viewer = await optionalUser(req);
  return viewer && viewer.role !== 'admin' && viewer.email ? viewer.email : '';
}

// Logged-in customer: keep this order's delivery address on the account for next time
// (skipped if already saved, the account has 5, or the shopper unticked "Save this address").
// Runs after the order is saved and never affects it.
function rememberAddressForViewer(req, shippingAddress) {
  if (req.body.saveAddress === false) return;
  optionalUser(req)
    .then(viewer => {
      if (viewer && viewer.role !== 'admin' && viewer._id) return rememberOrderAddress(viewer._id, shippingAddress);
      return null;
    })
    .catch(() => {});
}

const MAX_QTY_PER_LINE = 50;
const ADDRESS_FIELDS = ['fullName', 'phone', 'pincode', 'flatNo', 'area', 'city', 'state'];

// Whole-number quantity between 1 and MAX_QTY_PER_LINE, or null (negative, fractional
// or huge quantities would let a buyer lower the server-calculated total)
function cleanQuantity(raw) {
  const qty = Number(raw);
  return Number.isInteger(qty) && qty >= 1 && qty <= MAX_QTY_PER_LINE ? qty : null;
}

// Returns an error message when the delivery address is incomplete, otherwise null
function addressError(address) {
  if (!address || typeof address !== 'object') return 'Please enter your delivery address.';
  const missing = ADDRESS_FIELDS.filter(f => typeof address[f] !== 'string' || !address[f].trim());
  if (missing.length) return 'Please fill in your full delivery address (name, phone, pincode, house no., area, city, state).';
  if (!/^\d{6}$/.test(address.pincode.trim())) return 'Pincode must be 6 digits.';
  return null;
}

// Only the known address fields are stored, as plain strings
function cleanAddress(address) {
  const out = { addressType: typeof address.addressType === 'string' ? address.addressType : 'Home' };
  ADDRESS_FIELDS.forEach(f => { out[f] = String(address[f]).trim(); });
  return out;
}

// e.g. AB-2026-K7Q2M9: year + 6 random chars, checked against existing orders
// (4 random digits gave only 9,000 IDs; a clash failed the order after payment)
async function newOrderId(prefix = 'AB') {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  for (let attempt = 0; attempt < 5; attempt++) {
    let rand = '';
    for (let i = 0; i < 6; i++) rand += chars[crypto.randomInt(chars.length)];
    const id = `${prefix}-${new Date().getFullYear()}-${rand}`;
    if (!(await Order.exists({ orderId: id }))) return id;
  }
  return `${prefix}-${Date.now()}`;
}

// Names of cart items that cannot be bought right now (out of stock / "Coming soon").
// Checked before a COD order or a Razorpay payment is created; /verify is not blocked,
// so a customer who has already paid always gets their order saved.
async function unavailableItems(items) {
  const names = [];
  for (const rawItem of items) {
    const prodId = rawItem && (rawItem.productId || rawItem.id);
    if (!mongoose.isValidObjectId(prodId)) continue;
    const p = await Product.findById(prodId).select('name inStock stock isActive');
    if (p && p.isActive !== false && (p.inStock === false || p.stock <= 0)) names.push(p.name);
  }
  return names;
}

async function processOrderItems(items, deliveryPincode) {
  let commissionSetting = await Setting.findOne({ key: 'commission_percentage' });
  const commissionPercent = commissionSetting ? Number(commissionSetting.value) : 10;

  // 1. Look up the products and the order value
  let subtotal = 0;
  const dbProducts = [];

  for (const rawItem of items) {
    if (!rawItem || typeof rawItem !== 'object') continue;
    const prodId = rawItem.productId || rawItem.id;
    const quantity = cleanQuantity(rawItem.quantity);
    if (!quantity || !mongoose.isValidObjectId(prodId)) continue;
    const dbProduct = await Product.findById(prodId).populate('seller');
    // Hidden (isActive: false) products can no longer be ordered
    if (dbProduct && dbProduct.isActive !== false) {
      const item = { ...rawItem, quantity };
      dbProducts.push({ item, dbProduct });
      subtotal += dbProduct.price * quantity;
    }
  }

  // 2. Free shipping in Panipat, on ₹499+ or with a free-delivery combo, otherwise flat ₹49
  const orderShippingCharge = calcOrderShipping(subtotal, dbProducts.some(d => hasFreeDeliveryTag(d.dbProduct)), deliveryPincode);

  const formatted = [];
  for (let idx = 0; idx < dbProducts.length; idx++) {
    const { item, dbProduct } = dbProducts[idx];
    const sellerId = dbProduct.seller ? dbProduct.seller._id : null;

    // Distribute order shipping charge: assign all to the first item (cleanest for totals)
    const itemShipping = idx === 0 ? orderShippingCharge : 0;

    const commissionAmount = Math.round((dbProduct.price * item.quantity * commissionPercent) / 100);
    const sellerPayout = (dbProduct.price * item.quantity) - commissionAmount;

    formatted.push({
      productId: String(dbProduct._id),
      name: dbProduct.name,
      price: dbProduct.price,
      quantity: item.quantity,
      image: dbProduct.image,
      customText: String(item.customText || '').slice(0, 200),
      customImage: String(item.customImage || '').slice(0, 500),
      size: String(item.selectedSize || item.size || '').slice(0, 50),
      color: String(item.selectedColor || item.color || '').slice(0, 50),
      sellerId,
      commissionPercent,
      commissionAmount,
      shippingCharges: itemShipping,
      sellerPayout,
      payoutStatus: 'pending',
      itemStatus: 'Order Placed'
    });
  }
  return formatted;
}

// Low-price items tagged "cod-panipat-only" (Sherpa mat) lose money on courier COD when
// ordered alone, so a COD cart made ONLY of such items must be a Panipat pincode (1321xx).
// With any other item in the cart, or with online payment, they ship anywhere.
async function panipatOnlyCodError(formattedItems, pincode) {
  if (isPanipatPincode(pincode)) return null;
  for (const item of formattedItems) {
    const p = await Product.findById(item.productId).select('tags');
    const tags = (p?.tags || []).map(t => String(t).toLowerCase());
    if (!tags.includes('cod-panipat-only')) return null;
  }
  const names = formattedItems.map(i => i.name).join(', ');
  return `${names}: Cash on Delivery for this item alone is available only in Panipat. Add another bath mat to your cart, or pay online.`;
}

// Marketing source sent by the shop (utils/source.js): short, plain text only
const cleanSource = (v) => (typeof v === 'string' ? v.toLowerCase().replace(/[^a-z0-9_.\-/ ]/g, '').trim().slice(0, 100) : '') || 'direct';

module.exports.createOrder = async (req, res) => {
  try {
    const { userEmail, items, shippingAddress, paymentMethod, totalAmount, resellerCode } = req.body;
    const source = cleanSource(req.body.source);

    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Invalid order details provided.' });
    }
    const addrError = addressError(shippingAddress);
    if (addrError) {
      return res.status(400).json({ success: false, message: addrError });
    }

    // This endpoint only creates Cash on Delivery orders. Online payments are saved
    // by /orders/verify after the Razorpay signature check, never here.
    if (paymentMethod && paymentMethod !== 'COD') {
      return res.status(400).json({ success: false, message: 'Please use online payment (Razorpay) for this order.' });
    }

    // Estimated delivery in 3 to 5 business days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const estimatedDeliveryStr = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const soldOut = await unavailableItems(items);
    if (soldOut.length) {
      return res.status(400).json({ success: false, message: `Not available right now: ${soldOut.join(', ')}. Please remove it from your cart.` });
    }
    const formattedItems = await processOrderItems(items, shippingAddress.pincode);
    if (formattedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'The items in your cart are no longer available. Please check your cart.' });
    }
    const localOnly = await panipatOnlyCodError(formattedItems, shippingAddress.pincode);
    if (localOnly) return res.status(400).json({ success: false, message: localOnly });

    const totalItemCost = formattedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalShipping = formattedItems.reduce((acc, item) => acc + item.shippingCharges, 0);

    // Minimum order is checked on the server-calculated total, never the browser's
    if (totalItemCost + totalShipping < 100) {
      return res.status(400).json({ success: false, message: 'Minimum order amount of ₹100 is required.' });
    }

    // PANIPAT30: decided here from the address and order history, never sent by the browser
    const owner = await orderOwner(req, userEmail);
    const voucher = await panipatVoucher({
      pincode: shippingAddress.pincode,
      subtotal: totalItemCost,
      phone: shippingAddress.phone,
      email: owner.isGuest ? '' : owner.userEmail
    });
    const voucherDiscount = voucher ? voucher.amount : 0;
    const calculatedTotal = totalItemCost + totalShipping - voucherDiscount;

    // COD is open to everyone, up to a per-order limit (checked on what the customer pays)
    const codError = codLimitError(calculatedTotal);
    if (codError) {
      return res.status(400).json({ success: false, message: codError });
    }

    const resellerFields = await resolveResellerForOrder(resellerCode, owner.userEmail, formattedItems);

    const newOrder = await Order.create({
      orderId: await newOrderId(),
      ...owner,
      items: formattedItems,
      ...resellerFields,
      shippingAddress: cleanAddress(shippingAddress),
      source,
      paymentMethod: 'COD',
      paymentStatus: 'Pending COD',
      orderStatus: 'Order Placed',
      totalAmount: calculatedTotal, // items + shipping - voucher
      voucherCode: voucher ? voucher.code : '',
      voucherDiscount,
      estimatedDelivery: estimatedDeliveryStr
    });
    notifyNewOrder(newOrder);
    rememberAddressForViewer(req, shippingAddress);

    res.status(201).json({
      success: true,
      message: 'Order created successfully!',
      order: newOrder
    });
  } catch (error) {
    console.error('Order creation error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating order.' });
  }
};

module.exports.getOrders = async (req, res) => {
  try {
    // Customers only ever see their own orders; admin can see all or filter by email
    const { email } = req.query;
    let queryFilter;
    if (req.user.role === 'admin') {
      queryFilter = email ? { userEmail: email } : {};
    } else {
      // Guest orders typed with this email are not the account's orders (see orderOwner)
      queryFilter = { userEmail: req.user.email, isGuest: { $ne: true } };
    }
    const orders = await Order.find(queryFilter).sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders.' });
  }
};

// Requires auth (see routes/order.js). Only the admin or the buyer who placed the
// order may read it; anyone else gets the same 404 as a missing order.
module.exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    const isOwner = order && !order.isGuest && req.user?.email && order.userEmail === req.user.email;
    if (!order || (req.user?.role !== 'admin' && !isOwner)) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving order.' });
  }
};

module.exports.createRazorpayOrder = async (req, res) => {
  try {
    // Charge what the server calculates for the cart, never an amount sent by the browser
    // deliveryPincode only decides free delivery (Panipat); /verify recalculates with the
    // address pincode and rejects the payment if the two totals differ.
    // phone (delivery address) is only used for the PANIPAT30 first-order check; /verify
    // honours the voucher only for the same phone (see verifyRazorpayPayment).
    const { items } = req.body;
    const deliveryPincode = String(req.body.deliveryPincode || '').trim().slice(0, 6);
    const phone = last10(typeof req.body.phone === 'string' ? req.body.phone : '');
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Your cart is empty.' });
    }
    const soldOut = await unavailableItems(items);
    if (soldOut.length) {
      return res.status(400).json({ success: false, message: `Not available right now: ${soldOut.join(', ')}. Please remove it from your cart.` });
    }
    const formattedItems = await processOrderItems(items, deliveryPincode);
    if (formattedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'The items in your cart are not available right now.' });
    }
    const itemCost = formattedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const grossTotal = formattedItems.reduce((acc, item) => acc + item.price * item.quantity + item.shippingCharges, 0);
    if (grossTotal < 100) {
      return res.status(400).json({ success: false, message: 'Minimum order amount of ₹100 is required.' });
    }
    const voucher = phone.length === 10
      ? await panipatVoucher({ pincode: deliveryPincode, subtotal: itemCost, phone, email: await viewerEmail(req) })
      : null;
    const voucherDiscount = voucher ? voucher.amount : 0;
    const orderTotal = grossTotal - voucherDiscount;
    // Paying online saves a flat amount (utils/payment.js); /verify expects the same figure
    const discount = onlineDiscount(orderTotal);
    const amount = orderTotal - discount;

    const options = {
      amount: Math.round(amount * 100), // amount in paisa
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`,
      // Notes are set here by the server and read back by /verify (the browser can't change them)
      notes: {
        orderTotal: String(orderTotal),
        onlineDiscount: String(discount),
        voucherCode: voucher ? voucher.code : '',
        voucherDiscount: String(voucherDiscount),
        voucherPhone: voucher ? phone : ''
      }
    };

    const order = await rzp.orders.create(options);
    return res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      orderTotal,
      onlineDiscount: discount,
      voucher: voucher || null,
      key: razorpayKeyId
    });
  } catch (error) {
    console.error('Razorpay order creation error:', error);
    res.status(500).json({ success: false, message: 'Failed to create Razorpay order.' });
  }
};

module.exports.verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      items,
      shippingAddress,
      totalAmount,
      email,
      resellerCode
    } = req.body;
    const source = cleanSource(req.body.source);

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Missing payment signature details.' });
    }

    // Verify payment signature
    const hash = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex');

    if (hash !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Payment signature verification failed.' });
    }
    if (!Array.isArray(items) || items.length === 0 || addressError(shippingAddress)) {
      return res.status(400).json({ success: false, message: `Your payment was received but the order details were incomplete. Please WhatsApp us at +91 93068 10726 with payment ID ${razorpay_payment_id}.` });
    }

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const estimatedDeliveryStr = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    // The signature only proves the payment happened; make sure it paid for THIS cart
    // (at the discounted online price) and that the same payment isn't turned into a second order.
    const paidOrder = await rzp.orders.fetch(razorpay_order_id);
    // PANIPAT30 is NOT re-checked against order history here: createRazorpayOrder already
    // decided it and wrote it into the Razorpay order's notes (server-set, so the browser can't
    // add it). Re-checking would wrongly reject a paid customer whose other order (e.g. a COD
    // order in another tab) landed in between. It is honoured only if the notes grant it AND
    // this order is for the same phone, a Panipat pincode and items of ₹199+; otherwise the
    // total has no voucher and the amount check below rejects a mismatched payment.
    // An order created before vouchers existed has no voucher notes, so no voucher.
    const notes = paidOrder.notes || {};
    const notedVoucher = notes.voucherCode === PANIPAT_VOUCHER_CODE && Number(notes.voucherDiscount) === PANIPAT_VOUCHER_AMOUNT
      && last10(notes.voucherPhone).length === 10 && last10(notes.voucherPhone) === last10(shippingAddress.phone);
    // Same online-payment discount createRazorpayOrder took off the charge. A Razorpay order
    // created before the discount existed (no onlineDiscount note, full amount) is still
    // honoured at full price so a customer paying during the deploy isn't left without an order.
    // Either way the amount was set by this server, never by the browser.
    const priceCart = (formatted) => {
      const itemCost = formatted.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      const shippingTotal = formatted.reduce((acc, item) => acc + item.shippingCharges, 0);
      const voucherDiscount = notedVoucher && voucherRuleMet(shippingAddress.pincode, itemCost) ? PANIPAT_VOUCHER_AMOUNT : 0;
      const total = itemCost + shippingTotal - voucherDiscount;
      const legacyFullPrice = notes.onlineDiscount === undefined
        && paidOrder.amount === Math.round(total * 100);
      const disc = legacyFullPrice ? 0 : onlineDiscount(total);
      return { formatted, discount: disc, voucherDiscount, amountDue: total - disc };
    };
    let priced = priceCart(await processOrderItems(items, shippingAddress.pincode));
    // Panipat delivery is free, but a payment started from an older page (no pincode sent to
    // /orders/razorpay) was charged the ₹49 the server quoted then: record it as charged.
    if (paidOrder.amount !== Math.round(priced.amountDue * 100) && isPanipatPincode(shippingAddress.pincode)) {
      const withCharge = priceCart(await processOrderItems(items));
      if (paidOrder.amount === Math.round(withCharge.amountDue * 100)) priced = withCharge;
    }
    const { formatted: formattedItems, discount, voucherDiscount, amountDue } = priced;
    if (paidOrder.amount !== Math.round(amountDue * 100)) {
      return res.status(400).json({ success: false, message: 'The payment amount does not match the order total. Please contact us on WhatsApp at +91 93068 10726.' });
    }
    if (await Order.exists({ razorpayOrderId: razorpay_order_id })) {
      return res.status(409).json({ success: false, message: 'This payment has already been used for an order.' });
    }

    const owner = await orderOwner(req, email);
    const resellerFields = await resolveResellerForOrder(resellerCode, owner.userEmail, formattedItems);

    const newOrder = await Order.create({
      orderId: await newOrderId(),
      ...owner,
      items: formattedItems,
      ...resellerFields,
      shippingAddress: cleanAddress(shippingAddress),
      source,
      paymentMethod: 'Online (Razorpay)',
      paymentStatus: 'Completed',
      orderStatus: 'Order Placed',
      totalAmount: amountDue, // what the customer paid (items + shipping - voucher - onlineDiscount)
      onlineDiscount: discount,
      voucherCode: voucherDiscount > 0 ? PANIPAT_VOUCHER_CODE : '',
      voucherDiscount,
      estimatedDelivery: estimatedDeliveryStr,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    });
    notifyNewOrder(newOrder);
    rememberAddressForViewer(req, shippingAddress);

    return res.status(201).json({
      success: true,
      message: 'Payment verified and order created successfully!',
      order: newOrder
    });
  } catch (error) {
    console.error('Razorpay verification error:', error);
    res.status(500).json({ success: false, message: 'Server error verifying Razorpay payment.' });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    const ORDER_STATUSES = ['Order Placed', 'Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered'];
    if (!ORDER_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, message: 'Please choose a valid order status.' });
    }

    if (req.user.role !== 'admin') {
      const sellerProducts = await Product.find({ seller: req.user._id }).select('_id');
      const productIds = sellerProducts.map(p => String(p._id));
      const owns = await Order.exists({ orderId, 'items.productId': { $in: productIds } });
      if (!owns) {
        return res.status(403).json({ success: false, message: 'Not allowed to update this order.' });
      }
    }

    const order = await Order.findOneAndUpdate(
      { orderId },
      { orderStatus: status },
      { returnDocument: 'after' }
    );

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }

    res.json({ success: true, message: 'Order status updated successfully.', order });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ success: false, message: 'Server error updating order status.' });
  }
};

module.exports.getSellerOrders = async (req, res) => {
  try {
    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden. Only sellers and admins can access.' });
    }

    let productIds = [];
    if (req.user.role === 'admin') {
      // Admin sees everything
    } else {
      const sellerProducts = await Product.find({ seller: req.user._id });
      productIds = sellerProducts.map(p => String(p._id));
    }

    const queryFilter = req.user.role === 'admin' ? {} : { 'items.productId': { $in: productIds } };
    const orders = await Order.find(queryFilter).sort({ createdAt: -1 });

    const formattedOrders = orders.map(order => {
      const orderObj = order.toObject();
      if (req.user.role !== 'admin') {
        orderObj.items = orderObj.items.filter(item => productIds.includes(String(item.productId)));
        orderObj.totalAmount = orderObj.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        orderObj.sellerRevenue = orderObj.items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
        orderObj.sellerCommission = orderObj.items.reduce((acc, item) => acc + (item.commissionAmount || 0), 0);
        orderObj.sellerShipping = orderObj.items.reduce((acc, item) => acc + (item.shippingCharges || 0), 0);
        orderObj.sellerPayout = orderObj.items.reduce((acc, item) => acc + (item.sellerPayout || 0), 0);
      }
      return orderObj;
    });

    res.json({ success: true, count: formattedOrders.length, orders: formattedOrders });
  } catch (error) {
    console.error('Fetch seller orders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching seller orders.' });
  }
};

module.exports.getShippingCalculation = async (req, res) => {
  try {
    // deliveryPincode is optional: cart/product pages ask for a preview before an address exists
    const { items, deliveryPincode } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Items list is required.' });
    }

    const formattedItems = await processOrderItems(items, deliveryPincode);
    const totalShipping = formattedItems.reduce((acc, item) => acc + item.shippingCharges, 0);

    // PANIPAT30 preview (Panipat pincodes only). With a phone: whether the voucher applies
    // (yes/no only, nothing else about past orders). voucherNudge: rupees to add to reach
    // the ₹199 minimum; not shown to a phone that has already ordered.
    let voucher = null;
    let voucherNudge = 0;
    const pin = String(deliveryPincode || '').trim();
    const phone = last10(typeof req.body.phone === 'string' ? req.body.phone : '');
    if (isPanipatPincode(pin)) {
      const itemCost = formattedItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
      const email = phone.length === 10 ? await viewerEmail(req) : '';
      if (voucherRuleMet(pin, itemCost)) {
        if (phone.length === 10) voucher = await panipatVoucher({ pincode: pin, subtotal: itemCost, phone, email });
      } else {
        voucherNudge = voucherNudgeFor(pin, itemCost);
        if (voucherNudge && phone.length === 10 && await hasOrderedBefore({ phone, email })) voucherNudge = 0;
      }
    }

    return res.json({
      success: true,
      shippingCharges: totalShipping,
      voucher,
      voucherNudge,
      items: formattedItems.map(item => ({
        productId: item.productId,
        name: item.name,
        shippingCharges: item.shippingCharges
      }))
    });
  } catch (error) {
    console.error('Shipping calculation error:', error);
    res.status(500).json({ success: false, message: 'Server error calculating shipping.' });
  }
};

module.exports.createOfflineOrder = async (req, res) => {
  try {
    const { items, shippingAddress, packagingCost, shippingCost, packagingCharge, shippingCharge, paymentMethod, userEmail } = req.body;

    // Only sellers (for their own products) and the admin record offline sales
    if (req.user.role !== 'admin' && req.user.role !== 'seller') {
      return res.status(403).json({ success: false, message: 'Only sellers and the admin can record offline orders.' });
    }
    if (!Array.isArray(items) || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Invalid offline order details provided.' });
    }

    const orderId = await newOrderId('AB-OFFLINE');

    const formattedItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      if (!item || !mongoose.isValidObjectId(item.productId)) continue;
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) continue;
      if (req.user.role !== 'admin' && String(dbProduct.seller) !== String(req.user._id)) continue;

      const sellerId = dbProduct.seller || req.user._id;
      const price = Number(item.price) > 0 ? Number(item.price) : dbProduct.price;
      const qty = cleanQuantity(item.quantity) || 1;

      formattedItems.push({
        productId: String(dbProduct._id),
        name: dbProduct.name,
        price: price,
        quantity: qty,
        image: dbProduct.image,
        size: item.selectedSize || item.size || '',
        color: item.selectedColor || item.color || '',
        sellerId,
        commissionPercent: 0,
        commissionAmount: 0,
        shippingCharges: 0,
        sellerPayout: price * qty,
        payoutStatus: 'paid',
        itemStatus: 'Delivered'
      });
      calculatedTotal += price * qty;
    }

    if (formattedItems.length === 0) {
      return res.status(400).json({ success: false, message: 'None of the selected products could be found in your catalogue.' });
    }

    const customerPackaging = Number(packagingCharge) || 0;
    const customerShipping = Number(shippingCharge) || 0;
    const finalTotalAmount = calculatedTotal + customerPackaging + customerShipping;

    const newOrder = await Order.create({
      orderId,
      userEmail: (typeof userEmail === 'string' && userEmail.trim()) ? userEmail.trim().slice(0, 200) : 'offline@apnabazarr.com',
      // A seller typing a customer's email must not put orders into that customer's account
      isGuest: req.user.role !== 'admin',
      items: formattedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'Offline Cash',
      paymentStatus: 'Completed',
      orderStatus: 'Delivered',
      totalAmount: finalTotalAmount,
      isOffline: true,
      packagingCost: Number(packagingCost) || 0,
      shippingCost: Number(shippingCost) || 0,
      packagingCharge: customerPackaging,
      shippingCharge: customerShipping,
      estimatedDelivery: 'Completed'
    });

    res.status(201).json({
      success: true,
      message: 'Offline order created successfully!',
      order: newOrder
    });
  } catch (error) {
    console.error('Offline order creation error:', error);
    res.status(500).json({ success: false, message: 'Server error while creating offline order.' });
  }
};

// last10 (last 10 digits of a phone) comes from utils/voucher.js
const TRACK_NOT_FOUND = "We couldn't find an order with that ID and phone number.";

// GET /orders/track?orderId=X&phone=Y — public, rate-limited guest tracking.
// The order ID alone is not enough: the phone on the order must match too, and every
// failure gets the same 404 so the endpoint never reveals whether an order ID exists.
// Only status fields are returned: no email, full address, reseller or cost data.
module.exports.trackOrder = async (req, res) => {
  try {
    const orderId = typeof req.query.orderId === 'string' ? req.query.orderId.trim().toUpperCase().slice(0, 40) : '';
    const phone = last10(typeof req.query.phone === 'string' ? req.query.phone : '');
    if (!orderId || phone.length !== 10) {
      return res.status(404).json({ success: false, message: TRACK_NOT_FOUND });
    }
    // Order IDs are generated in upper case (newOrderId), so this is a case-insensitive match
    const order = await Order.findOne({ orderId }).lean();
    if (!order || last10(order.shippingAddress?.phone) !== phone) {
      return res.status(404).json({ success: false, message: TRACK_NOT_FOUND });
    }
    const fullName = String(order.shippingAddress?.fullName || '').trim();
    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        createdAt: order.createdAt,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        totalAmount: order.totalAmount,
        estimatedDelivery: order.estimatedDelivery || '',
        items: (order.items || []).map(i => ({
          name: i.name,
          quantity: i.quantity,
          price: i.price,
          image: i.image || '',
          color: i.color || '',
          size: i.size || ''
        })),
        shippingAddress: {
          firstName: fullName.split(/\s+/)[0] || '',
          city: order.shippingAddress?.city || ''
        }
      }
    });
  } catch (error) {
    console.error('Track order error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

// GET /orders/:orderId/review-links — admin only (see routes/order.js). One signed
// "write a review" link per distinct product in the order, for the WhatsApp ask.
module.exports.getReviewLinks = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: String(req.params.orderId) }).lean();
    if (!order) return res.status(404).json({ success: false, message: 'Order not found.' });
    const seen = new Set();
    const links = [];
    for (const item of order.items || []) {
      const productId = String(item.productId || '');
      if (!productId || seen.has(productId)) continue;
      seen.add(productId);
      links.push({ productId, name: item.name, url: reviewLink(order.orderId, productId) });
    }
    res.json({ success: true, orderId: order.orderId, orderStatus: order.orderStatus, links });
  } catch (error) {
    console.error('Review links error:', error);
    res.status(500).json({ success: false, message: 'Could not create review links.' });
  }
};
