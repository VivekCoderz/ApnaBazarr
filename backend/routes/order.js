const router = require('express').Router();
const orderController = require('../controllers/order');

router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:orderId', orderController.getOrderById);

module.exports = router;
