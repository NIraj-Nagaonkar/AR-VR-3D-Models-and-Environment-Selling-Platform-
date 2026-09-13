const express = require("express");
const multer = require("multer");
const path = require("path");
const router = express.Router();
const { createRequest, getRequests, updateRequestStatus } = require("./request.controller");

// Store uploaded blueprint/reference files in Backend/uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "..", "uploads"));
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB, matches the frontend hint
});

router.post("/", upload.single("blueprintFile"), createRequest);
router.get("/", getRequests);
router.patch("/:id/status", updateRequestStatus);

module.exports = router;
