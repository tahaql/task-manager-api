const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Create JWT tokens
const createAccessToken = (user) => {
  return jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
};

const createRefreshToken = (user) => {
  return jwt.sign({ id: user._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: "7d",
  });
};

// Register
exports.register = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  //console.log("REGISTER BODY:", req.body)
  try {
    const { username, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing)
      return res.status(400).json({ message: "User already exists" });

    const user = new User({ username, email, password });
    await user.save();

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();
    res.status(201).json({
      user: { id: user._id, username, email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    res.status(500).json({ message: "Register failed", error: err.message });
  }
};

// Login
exports.login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      user: { id: user._id, username: user.username, email },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token missing" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    const newAccessToken = createAccessToken(user);
    res.json({ accessToken: newAccessToken });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};

// logout
exports.logout = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(400).json({ message: "Refresh token required" });

  try {
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    user.refreshToken = null;
    await user.save();

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};
