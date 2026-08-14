const router = require('express').Router();
const orderController = require('../controllers/order');

router.post('/', orderController.createOrder);
router.post('/razorpay', orderController.createRazorpayOrder);
router.post('/verify', orderController.verifyRazorpayPayment);
router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrderById);
router.put('/:orderId/status', orderController.updateOrderStatus);

module.exports = router;
