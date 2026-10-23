const router = require('express').Router();
const { verifyCodCode, getSettings, updateSettings } = require('../controllers/setting');
const auth = require('../middlewares/auth');

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Forbidden. Admins only.' });
  }
  next();
};

// COD is open to everyone now; the secret-code check is kept so it can be re-enabled if fraud appears
router.post('/verify-cod', verifyCodCode);
router.get('/', getSettings);
router.put('/', auth, adminOnly, updateSettings);

module.exports = router;
