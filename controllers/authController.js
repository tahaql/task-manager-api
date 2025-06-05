const User = require("../models/user");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

// Create JWT token
const createToken = (user) => {
  return jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
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
    if (existing) return res.status(400).json({ message: "User already exists" });

    const user = new User({ username, email, password });
    await user.save();

    const token = createToken(user);
    res.status(201).json({ user: { id: user._id, username, email }, token });
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
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    const token = createToken(user);
    res.status(200).json({ user: { id: user._id, username: user.username, email }, token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
};