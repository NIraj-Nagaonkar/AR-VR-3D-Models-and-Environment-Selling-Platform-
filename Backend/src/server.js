const path    = require("path");
const express = require("express");
const dotenv  = require("dotenv");
const cors    = require("cors");
const helmet  = require("helmet");
const rateLimit = require("express-rate-limit");
const connectDB    = require("./config/db");
const errorHandler = require("./middleware/errorHandler");

// ── Environment ───────────────────────────────────────────────────────────────
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Fail fast if secrets are missing — never fall back to insecure defaults
if (!process.env.JWT_SECRET) {
  console.error("FATAL: JWT_SECRET is not set in .env. Refusing to start.");
  process.exit(1);
}
if (!process.env.MONGO_URI) {
  console.error("FATAL: MONGO_URI is not set in .env. Refusing to start.");
  process.exit(1);
}

// ── Database ──────────────────────────────────────────────────────────────────
connectDB();

const app = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }, // allow front-end to load images
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   [
        "'self'",
        "'unsafe-inline'",                // allow inline onclick handlers in HTML pages
        "https://cdnjs.cloudflare.com",   // Three.js CDN
        "https://cdn.jsdelivr.net",       // OrbitControls & Three.js addons
        "https://fonts.googleapis.com",
      ],
      styleSrc:    [
        "'self'",
        "'unsafe-inline'",          // allow inline styles
        "https://cdnjs.cloudflare.com",   // FontAwesome
        "https://fonts.googleapis.com",
      ],
      fontSrc:     [
        "'self'",
        "https://cdnjs.cloudflare.com",
        "https://fonts.gstatic.com",
      ],
      imgSrc:      ["'self'", "data:", "blob:", "https:"],
      connectSrc:  ["'self'"],
      mediaSrc:    [
        "'self'",
        "blob:",
        "https://storage.cdn-luma.com",
        "https://cdn.lumalabs.ai",
        "https://assets.lumalabs.ai",
        "https://*.lumalabs.ai",
        "https:"
      ],
      objectSrc:   ["'none'"],
      frameSrc:    ["'none'"],
      workerSrc:   ["'self'", "blob:"],
      scriptSrcAttr: ["'unsafe-inline'"], // allow onclick="..." event attributes
    },
  },
}));

// ── CORS — restrict to known origins ─────────────────────────────────────────
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || "http://localhost:5000").split(",").map(s => s.trim());
app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no origin (mobile apps, curl, Postman)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ── Body parsing ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));

// ── Global rate limiter ───────────────────────────────────────────────────────
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "RATE_LIMIT", message: "Too many requests, please try again later." },
});
app.use(globalLimiter);

// Stricter limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, code: "RATE_LIMIT", message: "Too many login attempts. Please wait 15 minutes." },
});

// ── Routes ────────────────────────────────────────────────────────────────────
const userRoutes    = require("./Modules/User/user.routes");
const productRoutes = require("./Modules/Product/product.routes");
const requestRoutes = require("./Modules/Request/request.routes");
const chatRoutes    = require("./Modules/Chat/chat.routes");
const lumaRoutes    = require("./Modules/Luma/luma.routes");
const agentRoutes   = require("./Modules/Agent/agent.routes");

app.use("/api/users",    authLimiter, userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/chat",     chatRoutes);
app.use("/api/luma",     lumaRoutes);
app.use("/api/agent",    agentRoutes);

// ── Static files ──────────────────────────────────────────────────────────────
const frontendDir = path.join(__dirname, "..", "..", "Front-end");
const assetsDir   = path.join(__dirname, "..", "..", "Assets");

app.use(express.static(frontendDir));
app.use("/Front-end", express.static(frontendDir));
app.use("/Assets",    express.static(assetsDir));

// NOTE: /uploads is intentionally NOT served statically.
// Blueprint files are private — serve via signed URLs in Phase 3.

// ── Page routes ───────────────────────────────────────────────────────────────
app.get("/",          (req, res) => res.redirect("/Login/login.html"));
app.get("/login",     (req, res) => res.redirect("/Login/login.html"));
app.get("/signup",    (req, res) => res.redirect("/Login/sign-up.html"));
app.get("/admin",     (req, res) => res.redirect("/Admin/Admin.html"));
app.get("/workspace", (req, res) => res.redirect("/Admin/Workspace.html"));
app.get("/customer",  (req, res) => res.redirect("/Customer/Customer.html"));

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Ather3D API is running", timestamp: new Date().toISOString() });
});

// ── 404 for unhandled API requests ──────────────────────────────────────────
app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, code: "NOT_FOUND", message: `API route ${req.method} ${req.originalUrl} not found` });
});

// ── Global error handler (must be last) ──────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
