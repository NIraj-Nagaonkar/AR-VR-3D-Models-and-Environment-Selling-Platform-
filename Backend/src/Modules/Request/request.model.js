const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
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
      type: String, // original uploaded file name shown to admin
      default: "",
    },
    filePath: {
      type: String, // where the file is stored on the server (Backend/uploads/...)
      default: "",
    },
    status: {
      type: String,
      enum: ["Pending", "Accepted", "Rejected"],
      default: "Pending",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Request", requestSchema);
