/**
 * Run this file with:  node seed.js
 * It will connect to your master DB and create a default master admin user if not present.
 */

require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const MasterUser = require("../models/MasterUser");

const seedMasterAdmin = async () => {
  try {
    // 1️⃣ Connect to Master (Central) Database
    const mongoUri = process.env.MONGO_MAIN_URI || "mongodb://mongodb:27017/master_realestate_saas";
    await mongoose.connect(mongoUri);
    console.log("✅ Connected to Master DB");

    // 2️⃣ Check if Master Admin already exists
    const email = process.env.MASTER_ADMIN_EMAIL || "admin@joverarealestate.ae";
    const existingAdmin = await MasterUser.findOne({ email });

    if (existingAdmin) {
      console.log("⚠️ Master admin already exists:");
      console.log(existingAdmin);
      process.exit(0);
    }

    // 3️⃣ Create new Master Admin user
    const name = process.env.MASTER_ADMIN_NAME || "Super Admin";
    const password = process.env.MASTER_ADMIN_PASSWORD || "Admin@123";
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await MasterUser.create({
      name,
      email,
      password: hashedPassword,
      role: "super_admin",
      isActive: true,
    });

    console.log("✅ Master Admin created successfully:");
    console.log({
      name: admin.name,
      email: admin.email,
      role: admin.role,
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
};

seedMasterAdmin();
