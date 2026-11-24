const express = require("express");
const router  = express.Router();
const { getProducts, getProductById, createProduct, updateProduct, deleteProduct } = require("./product.controller");
const { authenticate, requireRole } = require("../../middleware/authenticate");

router.get("/",    getProducts);       // public
router.get("/:id", getProductById);    // public

router.post("/",      authenticate, requireRole("admin"), createProduct);
router.put("/:id",    authenticate, requireRole("admin"), updateProduct);
router.delete("/:id", authenticate, requireRole("admin"), deleteProduct);

module.exports = router;
