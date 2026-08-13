# Task List — Feedback & Review System, Cookie Auth, & Policy Pages

## Backend
- [x] models/Feedback.js — MongoDB model
- [x] models/Review.js — MongoDB model
- [x] controllers/feedback.js — POST + GET handlers
- [x] controllers/review.js — POST + GET handlers
- [x] routes/feedback.js — route file
- [x] routes/review.js — route file
- [x] middlewares/cloudinaryUpload.js — add video support
- [x] routes/upload.js — add video upload endpoints
- [x] server.js — register new routes
- [x] routes/products.js — connect to real MongoDB Product database and seed initial items
- [x] controllers/auth.js — updated res.cookie settings with secure: true, sameSite: 'none' for production

## Frontend
- [x] FeedbackForm.jsx — real Cloudinary upload (photo + video) + DB save
- [x] ProductDetailPage.jsx — real Cloudinary upload (photo + video) + DB save + load from DB + fix Back link
- [x] AdminDashboardModal.jsx — fetch feedbacks + new Product Reviews tab + onToggleStock option
- [x] App.jsx — clean up static state, pass currentUser, implement cookie session restoration on mount/refresh
- [x] WishlistPage.jsx — created dedicated wishlist page with direct cart add/remove actions
- [x] ProtectedAdminRoute.jsx — secure route to block regular customers from accessing admin page
- [x] PolicyPage.jsx — created dynamic policy page for T&C, privacy, shipping, refunds, and contact us
- [x] Footer.jsx — updated footer Quick Links with real Active Policy links
