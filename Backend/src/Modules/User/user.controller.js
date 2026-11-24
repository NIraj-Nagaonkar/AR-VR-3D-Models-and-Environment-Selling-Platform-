const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
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

// ── Forgot Password ───────────────────────────────────────────────────────────
// @route  POST /api/users/forgot-password
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Email is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always respond generically — don't leak whether the email is registered
    if (!user) {
      return res.json({ success: true, message: "If that email is registered you will receive a reset link." });
    }

    // Generate a raw token and store its SHA-256 hash (never store plain token)
    const rawToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.passwordResetToken   = hashedToken;
    user.passwordResetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save({ validateBeforeSave: false });

    // Build reset URL using fixed APP_URL setting instead of request's Host header
    const baseUrl  = (process.env.APP_URL || "http://localhost:5000").replace(/\/+$/, "");
    const resetUrl  = `${baseUrl}/Login/reset-password.html?token=${rawToken}`;

    // Log to server console only in development (no email service configured)
    if (process.env.NODE_ENV === "development") {
      console.log("\n========== PASSWORD RESET LINK (DEV) ==========");
      console.log(`User : ${user.email}`);
      console.log(`Link : ${resetUrl}`);
      console.log("===============================================\n");
    }

    const responsePayload = { success: true, message: "If that email is registered you will receive a reset link." };

    // ONLY return devResetUrl when NODE_ENV is explicitly 'development'
    if (process.env.NODE_ENV === "development") {
      responsePayload.devResetUrl = resetUrl;
    }

    res.json(responsePayload);
  } catch (err) {
    next(err);
  }
};

// ── Reset Password ────────────────────────────────────────────────────────────
// @route  POST /api/users/reset-password/:token
const resetPassword = async (req, res, next) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Token and new password are required" });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Password must be at least 6 characters" });
    }

    // Hash the incoming raw token and look it up
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      passwordResetToken:   hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select("+passwordResetToken +passwordResetExpires");

    if (!user) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "Reset link is invalid or has expired." });
    }

    user.password             = await bcrypt.hash(password, 12);
    user.passwordResetToken   = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.json({ success: true, message: "Password reset successful. You can now log in." });
  } catch (err) {
    next(err);
  }
};

module.exports = { signup, login, getMe, forgotPassword, resetPassword };
