const router = require("express").Router();
const authController = require("../controllers/auth.js");
const addressController = require("../controllers/address.js");

const auth = require("../middlewares/auth.js");
const { limiters } = require("../middlewares/security.js");

router.post("/signup", limiters.signup, authController.signup);
router.post("/login", limiters.login, authController.login);
router.post("/google", limiters.login, authController.googleLogin);
router.post("/logout", authController.logout);
router.post("/admin/login", limiters.adminLogin, authController.adminLogin);
router.get("/me", authController.getme);
router.post("/cart", authController.updateCart);
router.post("/wishlist", authController.updateWishlist);
router.post("/recently-viewed", authController.updateRecentlyViewed);
// Saved delivery addresses (logged-in customer's own account only)
router.get("/addresses", limiters.addresses, addressController.listAddresses);
router.post("/addresses", limiters.addresses, addressController.addAddress);
router.put("/addresses/:addressId", limiters.addresses, addressController.updateAddress);
router.delete("/addresses/:addressId", limiters.addresses, addressController.deleteAddress);
router.post("/register-seller", auth, authController.registerSeller);
router.get("/admin/sellers", auth, authController.getSellersForAdmin);
router.put("/seller/profile", auth, authController.updateSellerProfile);
router.put("/admin/sellers/:sellerId/status", auth, authController.updateSellerStatus);

module.exports = router;