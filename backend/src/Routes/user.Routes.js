import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { handleMulterError } from "../middleware/handleMulterError.middleware.js";
import {
  getDoctors,
  getPatients,
  updateProfile,
  assignPatient,
  unassignPatient,
  dashboardStats,
  searchUsers,
  getUserById,
} from "../controller/user.controller.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

// Doctor listing
router.get("/doctors", authenticate, getDoctors);

// Patients assigned to a doctor
router.get("/patients", authenticate, authorize("doctor"), getPatients);

// Assign / Unassign patients (Doctor only)
router.post("/assign", authenticate, authorize("doctor"), assignPatient);
router.post("/unassign", authenticate, authorize("doctor"), unassignPatient);

// Dashboard stats (Doctor only)
router.get("/dashboard", authenticate, authorize("doctor"), dashboardStats);

// Search users (Doctor = own patients, Admin = all)
router.get("/search", authenticate, searchUsers);

// Get user by ID
router.get("/:id", authenticate, getUserById);

// Update profile (own profile only)
router.put(
  "/:userId",
  authenticate,
  upload.single("profileImage"),
  handleMulterError,
  updateProfile
);

export default router;
