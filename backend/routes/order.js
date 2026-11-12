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
// Quotes with a phone run the PANIPAT30 first-order check, so those are rate-limited
const limitVoucherCheck = (req, res, next) => (req.body && req.body.phone ? limiters.voucherCheck(req, res, next) : next());
router.post('/calculate-shipping', limitVoucherCheck, orderController.getShippingCalculation);
router.get('/', auth, orderController.getOrders);
// Public guest tracking; must stay above '/:orderId'
router.get('/track', limiters.orderTrack, orderController.trackOrder);
router.get('/seller/my-orders', auth, orderController.getSellerOrders);
router.post('/offline', auth, orderController.createOfflineOrder);
router.get('/:orderId/review-links', auth, adminOnly, orderController.getReviewLinks);
router.get('/:orderId', auth, orderController.getOrderById);
router.put('/:orderId/status', auth, orderController.updateOrderStatus);

module.exports = router;
