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

app.use("/api/users", userRoutes);
app.use("/api/products", productRoutes);
app.use("/api/requests", requestRoutes);

// Serve uploaded blueprint/reference files
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// Test route
app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "API is running"
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});