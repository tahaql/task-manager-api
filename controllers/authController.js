const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");
const {
  createAccessToken,
  createRefreshToken,
} = require("../utils/createTokens");
const Session = require("../models/session");

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
      return res.status(400).json({ message: "Email already exists" });

    const user = new User({ username, email, password });
    await user.save();

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });

    await Session.create({
      user: user._id,
      refreshToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(201).json({
      user: { id: user._id, username, email },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
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
    if (!user) return res.status(401).json({ message: "Invalid credentials" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch)
      return res.status(401).json({ message: "Invalid credentials" });

    const accessToken = createAccessToken({ id: user._id });
    const refreshToken = createRefreshToken({ id: user._id });

    await Session.create({
      user: user._id,
      refreshToken,
      ip: req.ip,
      userAgent: req.headers["user-agent"],
    });

    res.status(200).json({
      accessToken,
      refreshToken,
      user: { id: user._id, username: user.username, email },
    });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};

// Refresh Token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken)
    return res.status(401).json({ message: "Refresh token missing" });

  console.log("Received Refresh Token:", refreshToken);

  try {
    const session = await Session.findOne({ refreshToken });
    console.log("Found session:", session);
    if (!session || !session.isValid) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }
    console.log(
      "JWT_REFRESH_SECRET at verify:",
      process.env.JWT_REFRESH_SECRET
    );
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(403).json({ message: "User not found" });
    }
    const newAccessToken = createAccessToken({ id: user._id }); // Create new access token
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
    const session = await Session.findOne({ refreshToken });
    if (!session || !session.isValid) {
      return res
        .status(403)
        .json({ message: "Invalid or expired refresh token" });
    }

    await Session.findOneAndUpdate({ refreshToken }, { isValid: false });

    res.status(200).json({ message: "Logged out successfully" });
  } catch (err) {
    console.error("REGISTER ERROR:", err);
    res.status(403).json({ message: "Invalid or expired refresh token" });
  }
};
