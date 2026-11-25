const jwt = require("jsonwebtoken");
const User = require("../Modules/User/user.model");

/**
 * authenticate — verifies the Bearer token and loads req.user.
 * Fails startup if JWT_SECRET is missing (enforced in server.js).
 */
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  let token = null;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query && req.query.token) {
    token = req.query.token;
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Authentication token required",
    });
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        success: false,
        code: "AUTH_REQUIRED",
        message: "User no longer exists",
      });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Invalid or expired token",
    });
  }
};

/**
 * requireRole(...roles) — must come after authenticate.
 * Usage: router.patch("/:id/status", authenticate, requireRole("admin"), handler)
 */
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      code: "FORBIDDEN",
      message: "You do not have permission to perform this action",
    });
  }
  next();
};

module.exports = { authenticate, requireRole };
