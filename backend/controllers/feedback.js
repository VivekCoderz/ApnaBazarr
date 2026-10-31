const Feedback = require('../models/Feedback');
const { optionalUser } = require('../middlewares/auth');

// POST /feedbacks — save new feedback
exports.createFeedback = async (req, res) => {
  try {
    const { name, email, rating, category, message, photoUrl, videoUrl } = req.body;
    if (!name || !message || typeof name !== 'string' || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Name and message are required.' });
    }
    const feedback = await Feedback.create({ name, email, rating, category, message, photoUrl, videoUrl });
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /feedbacks — admin gets every feedback; a logged-in user (e.g. a seller's support
// tickets) gets only their own; anonymous callers get an empty list (names, emails and
// messages are private)
exports.getAllFeedbacks = async (req, res) => {
  try {
    const user = await optionalUser(req);
    if (!user) return res.json({ success: true, feedbacks: [] });
    const filter = user.role === 'admin' ? {} : { email: user.email };
    const feedbacks = await Feedback.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, feedbacks });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
