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

router.get("/", authenticate, getAppointments);

router.get("/today", authenticate, authorize("doctor"), getTodaysAppointments);

router.post("/", authenticate, authorize("patient"), createAppointment);

router.patch("/:id", authenticate, authorize("doctor"), updateAppointment);

router.delete("/:id", authenticate, deleteAppointment);

export default router;
