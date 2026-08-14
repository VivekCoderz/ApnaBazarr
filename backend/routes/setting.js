const router = require('express').Router();
const { verifyCodCode, getSettings, updateSettings } = require('../controllers/setting');

router.post('/verify-cod', verifyCodCode);
router.get('/', getSettings);
router.put('/', updateSettings);

module.exports = router;
