const express = require("express");
const router = express.Router();
const { signup, login, getMe } = require("./user.controller");
const { authenticate } = require("../../middleware/authenticate");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, getMe); // protected

module.exports = router;
