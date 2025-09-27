// routes/wound.route.js
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload, processUpload } from "../middleware/multer.middleware.js";
import { createWound, addWoundImage } from "../controller/wound.controller.js";

const router = express.Router();

// ✅ Anyone authenticated (doctor or patient) can create a wound with first image
router.post(
  "/",
  authenticate,
  upload.single("woundImage"),
  processUpload,
  createWound
);

// ✅ Anyone authenticated (doctor or patient) can add follow-up wound image
router.post(
  "/:woundId/images",
  authenticate,
  upload.single("woundImage"),
  processUpload,
  addWoundImage
);

export default router;
