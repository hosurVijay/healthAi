import Appointment from "../models/Appointment.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";

// @desc    Get appointments (doctor sees all, patient sees own)
// @route   GET /api/appointments
// @access  Private
export const getAppointments = asyncHandler(async (req, res, next) => {
  const {
    page = 1,
    limit = 20,
    status,
    startDate,
    endDate,
    upcoming = false,
  } = req.query;
  const skip = (page - 1) * limit;

  let query = {};

  // Role-based filtering
  if (req.user.role === "doctor") {
    query.doctor = req.user._id;
  } else if (req.user.role === "patient") {
    query.patient = req.user._id;
  }

  // Status filter
  if (status && status !== "all") {
    query.status = status;
  }

  // Upcoming filter
  if (upcoming === "true") {
    query.appointmentDate = { $gte: new Date() };
    query.status = { $in: ["scheduled", "confirmed"] };
  }

  // Date range filter
  if (startDate || endDate) {
    query.appointmentDate = {};
    if (startDate) query.appointmentDate.$gte = new Date(startDate);
    if (endDate) query.appointmentDate.$lte = new Date(endDate);
  }

  const appointments = await Appointment.find(query)
    .populate("doctor", "name specialization email phone")
    .populate("patient", "name email phone age")
    .populate("relatedWound", "woundType location currentStatus")
    .sort({ appointmentDate: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Appointment.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        appointments,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      "Appointments fetched successfully"
    )
  );
});

// @desc    Get today's appointments (doctor only)
// @route   GET /api/appointments/today
// @access  Private (Doctor only)
export const getTodaysAppointments = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "doctor") {
    throw new ApiError(403, "Only doctors can access today's appointments");
  }

  const appointments = await Appointment.getTodaysAppointments(req.user._id);

  if (!appointments) {
    throw new ApiError(404, "No appointments found for today");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { appointments },
        "Today's appointments fetched successfully"
      )
    );
});

const exports = {
  getAppointments,
  getTodaysAppointments,
};
