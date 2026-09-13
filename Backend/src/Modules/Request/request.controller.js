const Request = require("./request.model");

// @route  POST /api/requests
// Handles the "Request a Custom AR/VR Model" form submission from Customer.html
const createRequest = async (req, res) => {
  try {
    const { fullName, workEmail, targetPlatform, specifications } = req.body;

    if (!fullName || !workEmail || !targetPlatform || !specifications) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const request = await Request.create({
      fullName,
      workEmail,
      targetPlatform,
      specifications,
      fileName: req.file ? req.file.originalname : "",
      filePath: req.file ? req.file.path : "",
    });

    res.status(201).json({
      success: true,
      message: "Request submitted successfully",
      request,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  GET /api/requests
// Used by Admin.html to populate the "Incoming Project Requests Queue" table
const getRequests = async (req, res) => {
  try {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json({ success: true, count: requests.length, requests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @route  PATCH /api/requests/:id/status
// Used by the Accept / Reject buttons in the admin queue table
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["Pending", "Accepted", "Rejected"].includes(status)) {
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const request = await Request.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );

    if (!request) {
      return res.status(404).json({ success: false, message: "Request not found" });
    }

    res.json({ success: true, message: "Status updated", request });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { createRequest, getRequests, updateRequestStatus };
