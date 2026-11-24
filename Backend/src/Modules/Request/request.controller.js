const Request = require("./request.model");

const VALID_STATUSES = ["Pending", "Accepted", "InProgress", "Completed", "Delivered", "Rejected"];

// ── Submit a custom request ───────────────────────────────────────────────────
// @route  POST /api/requests   (authenticated customer)
const createRequest = async (req, res, next) => {
  try {
    const { fullName, workEmail, targetPlatform, specifications } = req.body;

    if (!fullName || !workEmail || !targetPlatform || !specifications) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "All fields are required" });
    }

    const request = await Request.create({
      user: req.user._id,
      fullName: fullName.trim(),
      workEmail: workEmail.trim().toLowerCase(),
      targetPlatform,
      specifications,
      fileName: req.file ? req.file.originalname : "",
      fileKey:  req.file ? req.file.path : "",
    });

    res.status(201).json({ success: true, message: "Request submitted successfully", request });
  } catch (err) {
    next(err);
  }
};

// ── Admin: get all requests (paginated, filterable) ───────────────────────────
// @route  GET /api/requests   (admin only)
const getRequests = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status && VALID_STATUSES.includes(req.query.status)) filter.status = req.query.status;

    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      Request.find(filter).populate("user", "name email").sort({ createdAt: -1 }).skip(skip).limit(limit),
      Request.countDocuments(filter),
    ]);

    res.json({ success: true, total, page, limit, requests });
  } catch (err) {
    next(err);
  }
};

// ── Customer: get own requests ────────────────────────────────────────────────
// @route  GET /api/requests/mine   (authenticated customer)
const getMyRequests = async (req, res, next) => {
  try {
    const requests = await Request.find({ user: req.user._id }).sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, requests });
  } catch (err) {
    next(err);
  }
};

// ── Admin: update request status ─────────────────────────────────────────────
// @route  PATCH /api/requests/:id/status   (admin only)
const updateRequestStatus = async (req, res, next) => {
  try {
    const { status, adminNote, quotedPrice } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: `Status must be one of: ${VALID_STATUSES.join(", ")}` });
    }

    const update = { status };
    if (adminNote   !== undefined) update.adminNote   = adminNote;
    if (quotedPrice !== undefined) update.quotedPrice = quotedPrice;

    const request = await Request.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true }).populate("user", "name email");
    if (!request) {
      return res.status(404).json({ success: false, code: "NOT_FOUND", message: "Request not found" });
    }

    res.json({ success: true, message: "Status updated", request });
  } catch (err) {
    next(err);
  }
};

module.exports = { createRequest, getRequests, getMyRequests, updateRequestStatus };
