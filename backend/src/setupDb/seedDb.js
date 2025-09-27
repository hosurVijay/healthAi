// src/seedDb/seedDb.js
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";

import connectDB from "../db/index.js";
import User from "../Models/user.model.js";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Create uploads directories
const createUploadDirectories = () => {
  const dirs = [
    "public/temp",
    "uploads",
    "uploads/wounds/original",
    "uploads/wounds/cropped",
    "uploads/profiles",
  ];
  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📂 Created directory: ${dir}`);
    }
  });
};

// Seed function
const seedDatabase = async () => {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected!");

    // Create required folders
    createUploadDirectories();

    // Check admin doctor
    let admin = await User.findOne({ email: "admin@woundhealing.com" });
    if (!admin) {
      admin = await User.create({
        name: "Dr. Admin",
        email: "admin@woundhealing.com",
        password: "admin123", // auto-hashed via pre-save hook
        role: "doctor",
        phone: "9999999999",
        specialization: "General Surgery",
        licenseNumber: "ADMIN001",
        isActive: true,
      });
      console.log("✅ Admin doctor created!");
    } else {
      console.log("ℹ️ Admin doctor already exists.");
    }

    // Check sample patient
    let patient = await User.findOne({ email: "patient@example.com" });
    if (!patient) {
      patient = await User.create({
        name: "John Doe",
        email: "patient@example.com",
        password: "patient123",
        role: "patient",
        phone: "8888888888",
        assignedDoctor: admin._id,
        age: 45,
        medicalHistory: "No significant medical history",
        isActive: true,
      });
      console.log("✅ Sample patient created!");
    } else {
      console.log("ℹ️ Sample patient already exists.");
    }

    console.log("\n🎉 Database seeding completed successfully!");
  } catch (error) {
    console.error("❌ Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from DB.");
    process.exit(0);
  }
};

// Run seeder
seedDatabase();
