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

// GET /settings — get settings (including secret code and commission percentage)
exports.getSettings = async (req, res) => {
  try {
    let setting = await Setting.findOne({ key: 'secret_cod_code' });
    if (!setting) {
      setting = await Setting.create({ key: 'secret_cod_code', value: 'APNACOD' });
    }

    let commissionSetting = await Setting.findOne({ key: 'commission_percentage' });
    if (!commissionSetting) {
      commissionSetting = await Setting.create({ key: 'commission_percentage', value: '10' });
    }

    res.json({ 
      success: true, 
      settings: { 
        secret_cod_code: setting.value,
        commission_percentage: commissionSetting.value
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// PUT /settings — update settings (including secret code and commission percentage)
exports.updateSettings = async (req, res) => {
  try {
    const { secret_cod_code, commission_percentage } = req.body;

    let secretVal = secret_cod_code;
    if (secretVal !== undefined) {
      const setting = await Setting.findOneAndUpdate(
        { key: 'secret_cod_code' },
        { value: secretVal.trim().toUpperCase() },
        { returnDocument: 'after', upsert: true }
      );
      secretVal = setting.value;
    } else {
      let setting = await Setting.findOne({ key: 'secret_cod_code' });
      if (!setting) {
        setting = await Setting.create({ key: 'secret_cod_code', value: 'APNACOD' });
      }
      secretVal = setting.value;
    }

    let commVal = commission_percentage;
    if (commVal !== undefined) {
      const commSetting = await Setting.findOneAndUpdate(
        { key: 'commission_percentage' },
        { value: String(commVal).trim() },
        { returnDocument: 'after', upsert: true }
      );
      commVal = commSetting.value;
    } else {
      let commSetting = await Setting.findOne({ key: 'commission_percentage' });
      if (!commSetting) {
        commSetting = await Setting.create({ key: 'commission_percentage', value: '10' });
      }
      commVal = commSetting.value;
    }

    res.json({ 
      success: true, 
      message: 'Settings updated successfully.', 
      settings: { 
        secret_cod_code: secretVal, 
        commission_percentage: commVal 
      } 
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
