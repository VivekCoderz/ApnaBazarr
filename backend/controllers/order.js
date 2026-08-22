const Order = require('../models/Order');
const Razorpay = require('razorpay');
const crypto = require('crypto');

const razorpayKeyId = process.env.RAZORPAY_KEY_ID || 'rzp_live_TPLlrlsuMCFF5M';
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET || 'Sx34u8ER6rUxqYhJZmeGRJ3R';

const rzp = new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret
});
const Product = require('../models/Product');
const Setting = require('../models/Setting');

function calculateShipping(pickupPincode, deliveryPincode, weight, length, width, height) {
  return 0; // Free shipping
}

async function processOrderItems(items, deliveryPincode) {
  let commissionSetting = await Setting.findOne({ key: 'commission_percentage' });
  const commissionPercent = commissionSetting ? Number(commissionSetting.value) : 10;

  const formatted = [];
  for (const item of items) {
    const prodId = item.productId || item.id;
    const dbProduct = await Product.findById(prodId).populate('seller');
    if (!dbProduct) continue;

    const sellerId = dbProduct.seller ? dbProduct.seller._id : null;
    const pickupPincode = dbProduct.seller?.sellerProfile?.pickupPincode || '132103';

    // Calculate shipping per item line
    const itemShipping = calculateShipping(
      pickupPincode,
      deliveryPincode,
      dbProduct.weight || 500,
      dbProduct.length || 20,
      dbProduct.width || 10,
      dbProduct.height || 5
    ) * item.quantity;

    const commissionAmount = Math.round((dbProduct.price * item.quantity * commissionPercent) / 100);
    const sellerPayout = (dbProduct.price * item.quantity) - commissionAmount;

    formatted.push({
      productId: String(dbProduct._id),
      name: dbProduct.name,
      price: dbProduct.price,
      quantity: item.quantity,
      image: dbProduct.image,
      customText: item.customText || '',
      customImage: item.customImage || '',
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

module.exports.createOrder = async (req, res) => {
  try {
    const { userEmail, items, shippingAddress, paymentMethod, totalAmount } = req.body;

    if (!items || items.length === 0 || !shippingAddress || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Invalid order details provided.' });
    }

    if (totalAmount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum order amount of ₹100 is required.' });
    }

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `AB-2026-${randomNum}`;

    // Estimated delivery in 3 to 5 business days
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const estimatedDeliveryStr = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const formattedItems = await processOrderItems(items, shippingAddress.pincode);

    const totalItemCost = formattedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalShipping = formattedItems.reduce((acc, item) => acc + item.shippingCharges, 0);
    const calculatedTotal = totalItemCost + totalShipping;

    const newOrder = await Order.create({
      orderId,
      userEmail: userEmail || 'guest@apnabazarr.com',
      items: formattedItems,
      shippingAddress,
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: paymentMethod === 'COD' ? 'Pending COD' : 'Completed',
      orderStatus: 'Order Placed',
      totalAmount: calculatedTotal,
      estimatedDelivery: estimatedDeliveryStr
    });

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
    const { email } = req.query;
    const queryFilter = email ? { userEmail: email } : {};
    const orders = await Order.find(queryFilter).sort({ createdAt: -1 });

    res.json({ success: true, count: orders.length, orders });
  } catch (error) {
    console.error('Fetch orders error:', error);
    res.status(500).json({ success: false, message: 'Server error fetching orders.' });
  }
};

module.exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found.' });
    }
    res.json({ success: true, order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving order.' });
  }
};

module.exports.createRazorpayOrder = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'Invalid amount.' });
    }
    if (amount < 100) {
      return res.status(400).json({ success: false, message: 'Minimum order amount of ₹100 is required.' });
    }

    const options = {
      amount: Math.round(amount * 100), // amount in paisa
      currency: 'INR',
      receipt: `receipt_order_${Date.now()}`
    };

    const order = await rzp.orders.create(options);
    return res.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
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
      email
    } = req.body;

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

    // Payment verified successfully! Save the order to DB
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    const orderId = `AB-2026-${randomNum}`;

    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + 4);
    const estimatedDeliveryStr = deliveryDate.toLocaleDateString('en-IN', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });

    const formattedItems = await processOrderItems(items, shippingAddress.pincode);

    const totalItemCost = formattedItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const totalShipping = formattedItems.reduce((acc, item) => acc + item.shippingCharges, 0);
    const calculatedTotal = totalItemCost + totalShipping;

    const newOrder = await Order.create({
      orderId,
      userEmail: email || 'guest@apnabazarr.com',
      items: formattedItems,
      shippingAddress,
      paymentMethod: 'Online (Razorpay)',
      paymentStatus: 'Completed',
      orderStatus: 'Order Placed',
      totalAmount: calculatedTotal,
      estimatedDelivery: estimatedDeliveryStr,
      paymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id
    });

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

    if (!status) {
      return res.status(400).json({ success: false, message: 'Status is required.' });
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
    const { items, deliveryPincode } = req.body;
    if (!items || !deliveryPincode) {
      return res.status(400).json({ success: false, message: 'Items list and delivery pincode are required.' });
    }

    const formattedItems = await processOrderItems(items, deliveryPincode);
    const totalShipping = formattedItems.reduce((acc, item) => acc + item.shippingCharges, 0);

    return res.json({
      success: true,
      shippingCharges: totalShipping,
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

    if (!items || items.length === 0 || !shippingAddress) {
      return res.status(400).json({ success: false, message: 'Invalid offline order details provided.' });
    }

    const randomNum = Math.floor(10000 + Math.random() * 90000);
    const orderId = `AB-OFFLINE-${randomNum}`;

    const formattedItems = [];
    let calculatedTotal = 0;

    for (const item of items) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) continue;

      const sellerId = dbProduct.seller || req.user._id;
      const price = Number(item.price) || dbProduct.price;
      const qty = Number(item.quantity) || 1;

      formattedItems.push({
        productId: String(dbProduct._id),
        name: dbProduct.name,
        price: price,
        quantity: qty,
        image: dbProduct.image,
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

    const customerPackaging = Number(packagingCharge) || 0;
    const customerShipping = Number(shippingCharge) || 0;
    const finalTotalAmount = calculatedTotal + customerPackaging + customerShipping;

    const newOrder = await Order.create({
      orderId,
      userEmail: userEmail || 'offline@apnabazarr.com',
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
