import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { handleMulterError } from "../middleware/handleMulterError.middleware.js";
import {
  getDoctors,
  getPatients,
  updateProfile,
} from "../controllers/userController.js";
import { upload } from "../middleware/multer.middleware.js";

const router = express.Router();

router.get("/doctors", authenticate, getDoctors);
router.get("/patients", authenticate, authorize("doctor"), getPatients);
router.put(
  "/:userId",
  authenticate,
  upload.single("profileImage"),
  handleMulterError,
  updateProfile
);

export default router;
