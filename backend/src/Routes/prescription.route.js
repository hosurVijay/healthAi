import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  getPrescriptions,
  getActivePrescriptions,
  createPrescription,
  getPrescriptionById,
} from "../controller/prescription.controller.js";

const router = express.Router();

// Doctor + Patient: Fetch prescriptions
router.get("/", authenticate, getPrescriptions);

// Patient: Get active prescriptions
router.get(
  "/active",
  authenticate,
  authorize("patient"),
  getActivePrescriptions
);

// Doctor: Create prescription
router.post("/", authenticate, authorize("doctor"), createPrescription);

// Doctor + Patient: Get prescription details
router.get("/:prescriptionId", authenticate, getPrescriptionById);

export default router;
