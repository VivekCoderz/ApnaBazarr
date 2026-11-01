const router = require("express").Router();
const authController = require("../controllers/auth.js");

const auth = require("../middlewares/auth.js");
const { limiters } = require("../middlewares/security.js");

router.post("/signup", limiters.signup, authController.signup);
router.post("/login", limiters.login, authController.login);
router.post("/logout", authController.logout);
router.post("/admin/login", limiters.adminLogin, authController.adminLogin);
router.get("/me", authController.getme);
router.post("/cart", authController.updateCart);
router.post("/wishlist", authController.updateWishlist);
router.post("/recently-viewed", authController.updateRecentlyViewed);
router.post("/register-seller", auth, authController.registerSeller);
router.get("/admin/sellers", auth, authController.getSellersForAdmin);
router.put("/seller/profile", auth, authController.updateSellerProfile);
router.put("/admin/sellers/:sellerId/status", auth, authController.updateSellerStatus);

module.exports = router;