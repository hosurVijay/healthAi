import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  getAppointments,
  getTodaysAppointments,
} from "../controller/appointment.controller.js";

const router = express.Router();

router.get("/", authenticate, getAppointments);
router.get("/today", authenticate, authorize("doctor"), getTodaysAppointments);

export default router;
