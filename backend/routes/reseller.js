const router = require('express').Router();
const resellerController = require('../controllers/reseller');
const auth = require('../middlewares/auth');

router.post('/join', auth, resellerController.join);
router.get('/me', auth, resellerController.getMyDashboard);
router.get('/admin/all', auth, resellerController.adminListResellers);
router.put('/admin/orders/:orderId/paid', auth, resellerController.adminMarkPaid);
router.put('/admin/commission', auth, resellerController.adminSetCommission);

module.exports = router;
