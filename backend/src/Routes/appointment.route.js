import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  getAppointments,
  getTodaysAppointments,
  createAppointment,
  updateAppointment,
  deleteAppointment,
} from "../controller/appointment.controller.js";

const router = express.Router();

// Get all (doctor) or own (patient) appointments
router.get("/", authenticate, getAppointments);

// Get today's appointments (doctor only)
router.get("/today", authenticate, authorize("doctor"), getTodaysAppointments);

// Patient books a new appointment
router.post("/", authenticate, authorize("patient"), createAppointment);

// Doctor updates an appointment (confirm/reschedule/cancel)
router.patch("/:id", authenticate, authorize("doctor"), updateAppointment);

// Cancel/delete appointment (patient cancels own, doctor cancels own)
router.delete("/:id", authenticate, deleteAppointment);

export default router;
