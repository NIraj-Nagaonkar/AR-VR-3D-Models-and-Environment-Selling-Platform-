const express = require("express");
const multer  = require("multer");
const path    = require("path");
const router  = express.Router();
const { authenticate, requireRole } = require("../../middleware/authenticate");
const { createRequest, getRequests, getMyRequests, updateRequestStatus } = require("./request.controller");

// ── File upload — allow-list of safe extensions ───────────────────────────────
const ALLOWED_EXTENSIONS = new Set([".pdf", ".png", ".jpg", ".jpeg", ".glb", ".gltf", ".fbx", ".obj", ".zip"]);
const ALLOWED_MIMES = new Set([
  "application/pdf",
  "image/png", "image/jpeg",
  "model/gltf-binary", "model/gltf+json",
  "application/octet-stream",
  "application/zip", "application/x-zip-compressed",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, "..", "..", "..", "uploads")),
  filename: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const rand = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, rand + ext);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext  = path.extname(file.originalname).toLowerCase();
    const mime = file.mimetype.toLowerCase();
    if (ALLOWED_EXTENSIONS.has(ext) || ALLOWED_MIMES.has(mime)) return cb(null, true);
    cb(new Error(`File type not allowed. Permitted: ${[...ALLOWED_EXTENSIONS].join(", ")}`));
  },
});

router.post("/",            authenticate,                       upload.single("blueprintFile"), createRequest);
router.get("/",             authenticate, requireRole("admin"), getRequests);
router.get("/mine",         authenticate,                       getMyRequests);
router.patch("/:id/status", authenticate, requireRole("admin"), updateRequestStatus);

module.exports = router;
