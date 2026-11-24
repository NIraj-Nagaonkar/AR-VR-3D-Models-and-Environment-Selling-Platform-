const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    // Link to the authenticated customer who submitted this request
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    fullName: {
      type: String,
      required: [true, "Full name / company name is required"],
      trim: true,
    },
    workEmail: {
      type: String,
      required: [true, "Work email is required"],
      lowercase: true,
      trim: true,
    },
    targetPlatform: {
      type: String,
      required: [true, "Target platform is required"],
    },
    specifications: {
      type: String,
      required: [true, "Model specifications are required"],
    },
    fileName: {
      type: String,
      default: "",
    },
    // fileKey replaces filePath — will point to object-storage key in Phase 3
    fileKey: {
      type: String,
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "InProgress", "Completed", "Delivered", "Rejected"],
      default: "Pending",
    },
    adminNote: {
      type: String,
      default: "",
    },
    quotedPrice: {
      type: Number,
      min: 0,
    },
  },
  { timestamps: true }
);

requestSchema.index({ user: 1, createdAt: -1 });
requestSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Request", requestSchema);
