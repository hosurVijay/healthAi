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
      type: Date, // optional by default
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

// Get active appointments (ignore date completely)
// export const getTodaysAppointments = asyncHandler(async (req, res, next) => {
//   if (req.user.role !== "doctor") {
//     throw new ApiError(403, "Only doctors can access today's appointments");
//   }

//   const appointments = await Appointment.find({
//     doctor: req.user._id,
//     status: { $in: ["scheduled", "confirmed"] },
//   })
//     .populate("doctor", "name specialization email phone")
//     .populate("patient", "name email phone age")
//     .populate("relatedWound", "woundType location currentStatus")
//     .sort({ createdAt: 1 });

//   if (!appointments || appointments.length === 0) {
//     throw new ApiError(404, "No active appointments found");
//   }

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(
//         200,
//         { appointments },
//         "Appointments fetched successfully"
//       )
//     );
// });

export default mongoose.model("Appointment", appointmentSchema);
