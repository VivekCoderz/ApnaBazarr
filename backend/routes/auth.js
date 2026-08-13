const router = require("express").Router();
const authController = require("../controllers/auth.js");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
router.get("/me", authController.getme);
router.post("/cart", authController.updateCart);
router.post("/wishlist", authController.updateWishlist);

module.exports = router;