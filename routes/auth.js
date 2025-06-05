/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication and token management
 */

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - email
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or user already exists
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user and return access and refresh tokens
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Successful login returns tokens and user info
 *       400:
 *         description: Invalid credentials or validation error
 */

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token using refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Returns new access token
 *       401:
 *         description: Refresh token missing
 *       403:
 *         description: Invalid or expired refresh token
 */

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user and invalidate refresh token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Logged out successfully
 *       400:
 *         description: Refresh token required
 *       403:
 *         description: Invalid or expired refresh token
 */
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
