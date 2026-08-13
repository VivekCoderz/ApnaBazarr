const Order = require('../models/Order');

module.exports.createOrder = async (req, res) => {
  try {
    const { userEmail, items, shippingAddress, paymentMethod, totalAmount } = req.body;

    if (!items || items.length === 0 || !shippingAddress || !totalAmount) {
      return res.status(400).json({ success: false, message: 'Invalid order details provided.' });
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

    const newOrder = await Order.create({
      orderId,
      userEmail: userEmail || 'guest@apnabazarr.com',
      items,
      shippingAddress,
      paymentMethod: paymentMethod || 'UPI',
      paymentStatus: paymentMethod === 'COD' ? 'Pending COD' : 'Completed',
      orderStatus: 'Order Placed',
      totalAmount,
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
