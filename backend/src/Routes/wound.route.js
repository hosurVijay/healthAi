// routes/wound.route.js
import express from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { upload, processUpload } from "../middleware/multer.middleware.js";
import { createWound, addWoundImage } from "../controller/wound.controller.js";

const router = express.Router();

router.post(
  "/",
  authenticate,
  upload.single("woundImage"),
  processUpload,
  createWound
);

router.post(
  "/:woundId/images",
  authenticate,
  upload.single("woundImage"),
  processUpload,
  addWoundImage
);

export default router;
