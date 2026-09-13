const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    category: {
      type: String,
      enum: ["AR", "VR", "3D Model", "Environment"],
      required: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: 0,
    },
    fileUrl: {
      type: String, // link to the actual .glb/.obj/.fbx file (store in cloud storage, not DB)
      required: [true, "3D model file URL is required"],
    },
    thumbnailUrl: {
      type: String,
      default: "",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
