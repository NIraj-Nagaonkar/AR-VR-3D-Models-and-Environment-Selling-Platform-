/**
 * Global error handler — must be registered last in server.js.
 * Returns { success, code, message } consistently.
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message || err);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      success: false,
      code: "VALIDATION_FAILED",
      message: messages.join(", "),
    });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    return res.status(409).json({
      success: false,
      code: "DUPLICATE_KEY",
      message: "A record with that value already exists",
    });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return res.status(401).json({
      success: false,
      code: "AUTH_REQUIRED",
      message: "Invalid or expired token",
    });
  }

  // Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      success: false,
      code: "FILE_TOO_LARGE",
      message: "File exceeds the 50 MB limit",
    });
  }

  res.status(err.status || 500).json({
    success: false,
    code: err.code || "SERVER_ERROR",
    message: err.message || "An unexpected error occurred",
  });
};

module.exports = errorHandler;
