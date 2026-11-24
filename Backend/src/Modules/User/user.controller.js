const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("./user.model");

const generateToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "8h" }  // 8-hour session; sufficient for a working day
  );

// ── Signup ────────────────────────────────────────────────────────────────────
// @route  POST /api/users/signup
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "All fields are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Password must be at least 6 characters" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res.status(409).json({ success: false, code: "DUPLICATE_KEY", message: "Email already registered. Please log in." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    // Role is always "customer" at signup.
    // Admin accounts are seeded via scripts/seedAdmin.js — not by email matching.
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role: "customer",
    });

    const token = generateToken(user);
    res.status(201).json({
      success: true,
      message: "Account created successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ── Login ─────────────────────────────────────────────────────────────────────
// @route  POST /api/users/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Email and password are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    // Explicitly select password since it has select:false on the model
    const user = await User.findOne({ email: normalizedEmail }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, code: "AUTH_REQUIRED", message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, code: "AUTH_REQUIRED", message: "Invalid email or password" });
    }

    const token = generateToken(user);
    res.json({
      success: true,
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// ── Get current user ──────────────────────────────────────────────────────────
// @route  GET /api/users/me   (protected by authenticate middleware)
const getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};

module.exports = { signup, login, getMe };
