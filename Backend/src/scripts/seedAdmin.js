/**
 * seedAdmin.js — Run once to create the initial admin account.
 * Usage:  node Backend/src/scripts/seedAdmin.js
 *
 * Never hardcode the admin email in application code or promote by email match.
 * This script reads credentials from .env:
 *   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME
 */

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", "..", "..", ".env") });

const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");
const User     = require("../Modules/User/user.model");

async function seed() {
  const { MONGO_URI, ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME } = process.env;

  if (!MONGO_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    console.error("Set MONGO_URI, ADMIN_EMAIL and ADMIN_PASSWORD in .env before seeding.");
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");

  const existing = await User.findOne({ email: ADMIN_EMAIL.toLowerCase() }).select("+password");
  if (existing) {
    console.log(`Admin already exists: ${existing.email} (role: ${existing.role})`);
    // Ensure role is admin in case it was downgraded
    if (existing.role !== "admin") {
      existing.role = "admin";
      await existing.save();
      console.log("Role updated to admin.");
    }
  } else {
    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 12);
    await User.create({
      name:     (ADMIN_NAME || "Admin").trim(),
      email:    ADMIN_EMAIL.toLowerCase().trim(),
      password: hashed,
      role:     "admin",
    });
    console.log(`Admin created: ${ADMIN_EMAIL}`);
  }

  await mongoose.disconnect();
  console.log("Done.");
}

seed().catch((err) => { console.error(err); process.exit(1); });
