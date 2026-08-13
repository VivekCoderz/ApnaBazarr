const Feedback = require('../models/Feedback');

// POST /feedbacks — save new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { name, email, rating, category, message, photoUrl, videoUrl } = req.body;
    if (!name || !message) {
      return res.status(400).json({ success: false, message: 'Name and message are required.' });
    }
    const feedback = await Feedback.create({ name, email, rating, category, message, photoUrl, videoUrl });
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /feedbacks — fetch all feedbacks (admin)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const feedbacks = await Feedback.find().sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
