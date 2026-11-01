const Feedback = require('../models/Feedback');
const { optionalUser } = require('../middlewares/auth');

// Only https Cloudinary URLs from our own upload endpoints are kept
function cleanMediaUrl(value) {
  if (typeof value !== 'string' || !value) return '';
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && url.hostname === 'res.cloudinary.com' ? url.href.slice(0, 500) : '';
  } catch {
    return '';
  }
}

// POST /feedbacks — save new feedback (lengths capped, media must be our Cloudinary URLs)
exports.createFeedback = async (req, res) => {
  try {
    const { name, email, rating, category, message, photoUrl, videoUrl } = req.body;
    if (!name || !message || typeof name !== 'string' || typeof message !== 'string') {
      return res.status(400).json({ success: false, message: 'Name and message are required.' });
    }
    const stars = Number(rating);
    const typedEmail = typeof email === 'string' && email.trim() ? email.trim().slice(0, 200) : 'anonymous@apnabazarr.com';
    const feedback = await Feedback.create({
      name: name.trim().slice(0, 100),
      email: typedEmail,
      rating: Number.isInteger(stars) && stars >= 1 && stars <= 5 ? stars : 5,
      category: typeof category === 'string' ? category.slice(0, 100) : undefined,
      message: message.slice(0, 5000),
      photoUrl: cleanMediaUrl(photoUrl),
      videoUrl: cleanMediaUrl(videoUrl)
    });
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    console.error('Create feedback error:', err);
    res.status(500).json({ success: false, message: 'Could not save your feedback. Please try again.' });
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
    console.error('Fetch feedbacks error:', err);
    res.status(500).json({ success: false, message: 'Could not load feedback.' });
  }
};
