const router = require('express').Router();
const orderController = require('../controllers/order');
const auth = require('../middlewares/auth');

router.post('/', orderController.createOrder);
router.post('/razorpay', orderController.createRazorpayOrder);
router.post('/verify', orderController.verifyRazorpayPayment);
router.post('/calculate-shipping', orderController.getShippingCalculation);
router.get('/', orderController.getOrders);
router.get('/seller/my-orders', auth, orderController.getSellerOrders);
router.post('/offline', auth, orderController.createOfflineOrder);
router.get('/:orderId', orderController.getOrderById);
router.put('/:orderId/status', orderController.updateOrderStatus);

module.exports = router;
