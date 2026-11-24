const Product = require("./product.model");

// @route  GET /api/products   (public)
const getProducts = async (req, res, next) => {
  try {
    const filter = { status: "published" };
    if (req.query.category) filter.category = req.query.category;
    if (req.query.search)   filter.$text = { $search: req.query.search };

    const page  = Math.max(parseInt(req.query.page)  || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip  = (page - 1) * limit;

    const [products, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Product.countDocuments(filter),
    ]);

    res.json({ success: true, total, page, limit, products });
  } catch (err) { next(err); }
};

// @route  GET /api/products/:id   (public)
const getProductById = async (req, res, next) => {
  try {
    const product = await Product.findOne({ _id: req.params.id, status: "published" });
    if (!product) return res.status(404).json({ success: false, code: "NOT_FOUND", message: "Product not found" });
    res.json({ success: true, product });
  } catch (err) { next(err); }
};

// @route  POST /api/products   (admin only)
const createProduct = async (req, res, next) => {
  try {
    const { title, description, category, price, previewUrl, assetKey, thumbnailUrl, tags, polyCount, format, status } = req.body;
    if (!title || !category || price === undefined) {
      return res.status(400).json({ success: false, code: "VALIDATION_FAILED", message: "title, category and price are required" });
    }
    const product = await Product.create({
      title, description, category, price, previewUrl, assetKey, thumbnailUrl,
      tags:   Array.isArray(tags)   ? tags   : [],
      format: Array.isArray(format) ? format : [],
      polyCount, status: status || "draft",
      createdBy: req.user._id,  // from token, never from body
    });
    res.status(201).json({ success: true, message: "Product created", product });
  } catch (err) { next(err); }
};

// @route  PUT /api/products/:id   (admin only)
const updateProduct = async (req, res, next) => {
  try {
    delete req.body.createdBy; // prevent overwrite
    const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!product) return res.status(404).json({ success: false, code: "NOT_FOUND", message: "Product not found" });
    res.json({ success: true, message: "Product updated", product });
  } catch (err) { next(err); }
};

// @route  DELETE /api/products/:id   (admin only)
const deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ success: false, code: "NOT_FOUND", message: "Product not found" });
    res.json({ success: true, message: "Product deleted" });
  } catch (err) { next(err); }
};

module.exports = { getProducts, getProductById, createProduct, updateProduct, deleteProduct };
