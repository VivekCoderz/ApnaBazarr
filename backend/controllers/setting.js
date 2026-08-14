const Setting = require('../models/Setting');

// POST /settings/verify-cod — verify if user entered correct secret code for COD
exports.verifyCodCode = async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'Code is required.' });
    }

    let setting = await Setting.findOne({ key: 'secret_cod_code' });
    if (!setting) {
      setting = await Setting.create({ key: 'secret_cod_code', value: 'APNACOD' });
    }

    const isValid = (code.trim().toUpperCase() === setting.value.trim().toUpperCase());
    res.json({ success: true, isValid });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /settings — get settings (including secret code)
exports.getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'secret_cod_code' });
    if (!setting) {
      setting = await Setting.create({ key: 'secret_cod_code', value: 'APNACOD' });
    }
    res.json({ success: true, settings: { secret_cod_code: setting.value } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /settings — update settings (including secret code)
exports.updateSettings = async (req, res) => {
  try {
    const { secret_cod_code } = req.body;
    if (!secret_cod_code) {
      return res.status(400).json({ success: false, message: 'secret_cod_code is required.' });
    }

    const setting = await Setting.findOneAndUpdate(
      { key: 'secret_cod_code' },
      { value: secret_cod_code.trim().toUpperCase() },
      { new: true, upsert: true }
    );

    res.json({ success: true, message: 'Settings updated successfully.', settings: { secret_cod_code: setting.value } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
