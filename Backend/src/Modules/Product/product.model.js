const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: [true, "Title is required"], trim: true },
    description: { type: String, default: "" },
    category: { type: String, enum: ["AR", "VR", "3D Model", "Environment"], required: true },
    price: { type: Number, required: [true, "Price is required"], min: 0 },
    // previewUrl — public watermarked preview (safe to expose)
    previewUrl: { type: String, default: "" },
    // assetKey — private object-storage key for the paid file (never sent publicly)
    assetKey: { type: String, default: "", select: false },
    thumbnailUrl: { type: String, default: "" },
    tags:     { type: [String], default: [] },
    polyCount: { type: Number, min: 0 },
    format:   { type: [String], default: [] }, // e.g. ["GLB","FBX"]
    status: { type: String, enum: ["draft", "published"], default: "draft" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

productSchema.index({ status: 1, category: 1, price: 1 });
productSchema.index({ title: "text", description: "text", tags: "text" });

module.exports = mongoose.model("Product", productSchema);
