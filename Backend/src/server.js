const path = require("path");
const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db");

// Load environment variables (always from Backend/.env, regardless of cwd)
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// Connect to MongoDB
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const userRoutes = require("./Modules/User/user.routes");
const productRoutes = require("./Modules/Product/product.routes");
const requestRoutes = require("./Modules/Request/request.routes");
const chatRoutes = require("./Modules/Chat/chat.routes");
const lumaRoutes = require("./Modules/Luma/luma.routes");

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/requests", requestRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/luma", lumaRoutes);

// Serve uploaded blueprint/reference files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Serve Front-end static assets
const frontendDir = path.join(__dirname, "..", "..", "Front-end");
const assetsDir = path.join(__dirname, "..", "..", "Assets");

app.use(express.static(frontendDir));
app.use("/Front-end", express.static(frontendDir));
app.use("/Assets", express.static(assetsDir));

// Clean URL shortcuts & Root redirect
app.get("/", (req, res) => {
  res.redirect("/Login/login.html");
});

app.get("/login", (req, res) => res.redirect("/Login/login.html"));
app.get("/signup", (req, res) => res.redirect("/Login/sign-up.html"));
app.get("/admin", (req, res) => res.redirect("/Admin/Admin.html"));
app.get("/workspace", (req, res) => res.redirect("/Admin/Workspace.html"));
app.get("/customer", (req, res) => res.redirect("/Customer/Customer.html"));

// API Health Check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Ather3D API is running",
    timestamp: new Date().toISOString()
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});