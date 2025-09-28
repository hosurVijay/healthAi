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

router.get("/doctors", authenticate, getDoctors);

router.get("/patients", authenticate, authorize("doctor"), getPatients);

router.post("/assign", authenticate, authorize("doctor"), assignPatient);
router.post("/unassign", authenticate, authorize("doctor"), unassignPatient);

router.get("/dashboard", authenticate, authorize("doctor"), dashboardStats);

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
