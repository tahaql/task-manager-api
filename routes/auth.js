const express = require("express");
const { body } = require("express-validator");
const {
  register,
  login,
  refreshToken,
  logout,
} = require("../controllers/authController");
const router = express.Router();

router.post(
  "/register",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password must be at least 6 characters").isLength({
      min: 6,
    }),
    body("username", "Username is required").notEmpty(),
  ],
  register
);

router.post(
  "/login",
  [
    body("email", "Enter a valid email").isEmail(),
    body("password", "Password is required").notEmpty(),
  ],
  login
);

router.post("/refresh", refreshToken);
router.post("/logout", logout);// logout
module.exports = router;
