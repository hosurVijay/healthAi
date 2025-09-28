import mongoose from "mongoose";
import { asyncHandler } from "../Utills/asyncHandler.js";

const appointmentSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    appointmentDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: ["scheduled", "confirmed", "completed", "cancelled"],
      default: "scheduled",
    },
    relatedWound: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wound",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Appointment", appointmentSchema);
