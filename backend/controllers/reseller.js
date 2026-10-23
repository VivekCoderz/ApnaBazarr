const User = require('../models/User');
const Order = require('../models/Order');
const Setting = require('../models/Setting');

async function getCommissionPercent() {
  const setting = await Setting.findOne({ key: 'reseller_commission_percent' });
  return setting ? Number(setting.value) : 10;
}

function makeCode(name) {
  const base = (name || 'AB').replace(/[^a-zA-Z]/g, '').slice(0, 5).toUpperCase() || 'AB';
  return base + Math.floor(1000 + Math.random() * 9000);
}

// Works out the reseller commission for an order. Returns {} when the code is invalid
// or the buyer is the reseller themself, so the order is saved without a reseller.
module.exports.resolveResellerForOrder = async (resellerCode, buyerEmail, items) => {
  if (!resellerCode) return {};
  const reseller = await User.findOne({ 'resellerProfile.code': String(resellerCode).toUpperCase() });
  if (!reseller || reseller.email === buyerEmail) return {};

  const percent = await getCommissionPercent();
  const itemsTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  return {
    resellerCode: reseller.resellerProfile.code,
    resellerId: reseller._id,
    resellerCommission: Math.round((itemsTotal * percent) / 100),
    resellerPayoutStatus: 'pending'
  };
};

module.exports.join = async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(400).json({ success: false, message: 'Admin cannot join as reseller.' });
    }
    const { upiId, phone } = req.body;
    if (!upiId || !phone) {
      return res.status(400).json({ success: false, message: 'UPI ID aur phone number dono chahiye.' });
    }

    const user = await User.findById(req.user._id);
    if (!user.resellerProfile?.code) {
      let code = makeCode(user.name);
      while (await User.exists({ 'resellerProfile.code': code })) code = makeCode(user.name);
      user.resellerProfile = { code, joinedAt: new Date() };
    }
    user.resellerProfile.upiId = upiId;
    user.resellerProfile.phone = phone;
    await user.save();

    const safeUser = user.toObject();
    delete safeUser.password;
    res.json({ success: true, user: safeUser });
  } catch (error) {
    console.error('Reseller join error:', error);
    res.status(500).json({ success: false, message: 'Server error joining reseller program.' });
  }
};

module.exports.getMyDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('resellerProfile');
    if (!user?.resellerProfile?.code) {
      return res.status(404).json({ success: false, message: 'Not a reseller yet.' });
    }

    const orders = await Order.find({ resellerId: req.user._id }).sort({ createdAt: -1 });
    const live = orders.filter(o => o.orderStatus !== 'Cancelled');
    const earned = live.reduce((acc, o) => acc + o.resellerCommission, 0);
    const paid = live.filter(o => o.resellerPayoutStatus === 'paid').reduce((acc, o) => acc + o.resellerCommission, 0);

    res.json({
      success: true,
      profile: user.resellerProfile,
      commissionPercent: await getCommissionPercent(),
      stats: { orders: live.length, earned, paid, pending: earned - paid },
      // Only share what the reseller needs, not the customer's full address
      orders: orders.map(o => ({
        orderId: o.orderId,
        createdAt: o.createdAt,
        customerName: o.shippingAddress?.fullName,
        city: o.shippingAddress?.city,
        items: o.items.map(i => ({ name: i.name, quantity: i.quantity })),
        totalAmount: o.totalAmount,
        orderStatus: o.orderStatus,
        commission: o.resellerCommission,
        payoutStatus: o.resellerPayoutStatus
      }))
    });
  } catch (error) {
    console.error('Reseller dashboard error:', error);
    res.status(500).json({ success: false, message: 'Server error loading reseller dashboard.' });
  }
};

module.exports.adminListResellers = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const resellers = await User.find({ 'resellerProfile.code': { $exists: true } })
      .select('name email resellerProfile')
      .sort({ 'resellerProfile.joinedAt': -1 });
    const orders = await Order.find({ resellerId: { $exists: true } }).sort({ createdAt: -1 });

    const result = resellers.map(r => {
      const own = orders.filter(o => String(o.resellerId) === String(r._id) && o.orderStatus !== 'Cancelled');
      const earned = own.reduce((acc, o) => acc + o.resellerCommission, 0);
      const paid = own.filter(o => o.resellerPayoutStatus === 'paid').reduce((acc, o) => acc + o.resellerCommission, 0);
      return {
        id: r._id,
        name: r.name,
        email: r.email,
        ...r.resellerProfile.toObject(),
        orders: own.map(o => ({
          orderId: o.orderId,
          createdAt: o.createdAt,
          totalAmount: o.totalAmount,
          orderStatus: o.orderStatus,
          commission: o.resellerCommission,
          payoutStatus: o.resellerPayoutStatus
        })),
        stats: { orders: own.length, earned, paid, pending: earned - paid }
      };
    });

    res.json({ success: true, commissionPercent: await getCommissionPercent(), resellers: result });
  } catch (error) {
    console.error('Admin reseller list error:', error);
    res.status(500).json({ success: false, message: 'Server error loading resellers.' });
  }
};

module.exports.adminMarkPaid = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const order = await Order.findOneAndUpdate(
      { orderId: req.params.orderId, resellerId: { $exists: true } },
      { resellerPayoutStatus: 'paid' },
      { returnDocument: 'after' }
    );
    if (!order) {
      return res.status(404).json({ success: false, message: 'Reseller order not found.' });
    }
    res.json({ success: true });
  } catch (error) {
    console.error('Mark reseller paid error:', error);
    res.status(500).json({ success: false, message: 'Server error updating payout.' });
  }
};

module.exports.adminSetCommission = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden.' });
    }
    const percent = Number(req.body.percent);
    if (!(percent >= 0 && percent <= 50)) {
      return res.status(400).json({ success: false, message: 'Commission 0 se 50% ke beech hona chahiye.' });
    }
    await Setting.findOneAndUpdate(
      { key: 'reseller_commission_percent' },
      { value: String(percent) },
      { upsert: true }
    );
    res.json({ success: true, commissionPercent: percent });
  } catch (error) {
    console.error('Set reseller commission error:', error);
    res.status(500).json({ success: false, message: 'Server error updating commission.' });
  }
};
