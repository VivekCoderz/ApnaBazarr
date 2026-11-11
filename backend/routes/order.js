const router = require('express').Router();
const orderController = require('../controllers/order');
const auth = require('../middlewares/auth');
const { limiters } = require('../middlewares/security');

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admins only.' });
  }
  next();
};

router.post('/', limiters.order, orderController.createOrder);
router.post('/razorpay', limiters.order, orderController.createRazorpayOrder);
router.post('/verify', orderController.verifyRazorpayPayment);
router.post('/calculate-shipping', orderController.getShippingCalculation);
router.get('/', auth, orderController.getOrders);
// Public guest tracking; must stay above '/:orderId'
router.get('/track', limiters.orderTrack, orderController.trackOrder);
router.get('/seller/my-orders', auth, orderController.getSellerOrders);
router.post('/offline', auth, orderController.createOfflineOrder);
router.get('/:orderId/review-links', auth, adminOnly, orderController.getReviewLinks);
router.get('/:orderId', auth, orderController.getOrderById);
router.put('/:orderId/status', auth, orderController.updateOrderStatus);

module.exports = router;
