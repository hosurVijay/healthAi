import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";
import mongoose from "mongoose";
import fs from "fs";

import connectDB from "../db/index.js";
import User from "../Models/user.model.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

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

const seedDatabase = async () => {
  try {
    console.log("🚀 Connecting to MongoDB...");
    await connectDB();
    console.log("✅ MongoDB connected!");

    createUploadDirectories();

    let admin = await User.findOne({ email: "admin@woundhealing.com" });
    if (!admin) {
      admin = await User.create({
        name: "Dr. Admin",
        email: "admin@woundhealing.com",
        password: "admin123",
        role: "doctor",
        phone: "9999999999",
        specialization: "General Surgery",
        licenseNumber: "ADMIN001",
        isActive: true,
      });
      console.log("Admin doctor created!");
    } else {
      console.log("Admin doctor already exists.");
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
      console.log("Sample patient created!");
    } else {
      console.log(" Sample patient already exists.");
    }

    console.log("Database seeding completed successfully!");
  } catch (error) {
    console.error(" Seeding failed:", error.message);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from DB.");
    process.exit(0);
  }
};

// Run seeder
seedDatabase();
