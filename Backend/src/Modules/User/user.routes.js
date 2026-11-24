const express = require("express");
const router = express.Router();
const { signup, login, getMe, forgotPassword, resetPassword } = require("./user.controller");
const { authenticate } = require("../../middleware/authenticate");

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticate, getMe);              // protected
router.post("/forgot-password", forgotPassword);     // public
router.post("/reset-password/:token", resetPassword); // public

module.exports = router;
