// controllers/appointment.controller.js
import Appointment from "../Models/appointment.model.js";
import { ApiResponse } from "../Utills/ApiResponses.js";
import { ApiError } from "../Utills/ApiError.js";
import { asyncHandler } from "../Utills/asyncHandler.js";

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

  if (status && status !== "all") {
    query.status = status;
  }

  if (upcoming === "true") {
    query.status = { $in: ["scheduled", "confirmed"] };
  }
  if (startDate || endDate) {
    query.appointmentDate = {};
    if (startDate) query.appointmentDate.$gte = new Date(startDate);
    if (endDate) query.appointmentDate.$lte = new Date(endDate);
  }

  const appointments = await Appointment.find(query)
    .populate("doctor", "name specialization email phone")
    .populate("patient", "name email phone age")
    .populate("relatedWound", "woundType location currentStatus")
    .sort({ createdAt: 1 })
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

export const getTodaysAppointments = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "doctor") {
    throw new ApiError(403, "Only doctors can access active appointments");
  }

  const appointments = await Appointment.find({
    doctor: req.user._id,
    status: { $in: ["scheduled", "confirmed"] },
  })
    .populate("doctor", "name specialization email phone")
    .populate("patient", "name email phone age")
    .populate("relatedWound", "woundType location currentStatus")
    .sort({ createdAt: 1 });

  if (!appointments || appointments.length === 0) {
    throw new ApiError(404, "No active appointments found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { appointments },
        "Active appointments fetched successfully"
      )
    );
});

export const createAppointment = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "patient") {
    throw new ApiError(403, "Only patients can create appointments");
  }

  const { doctorId, appointmentDate, relatedWound } = req.body;

  if (!doctorId) {
    throw new ApiError(400, "Doctor ID is required");
  }

  const appointment = await Appointment.create({
    doctor: doctorId,
    patient: req.user._id,
    appointmentDate: appointmentDate || null,
    status: "scheduled",
  });

  return res
    .status(201)
    .json(
      new ApiResponse(201, appointment, "Appointment created successfully")
    );
});

export const updateAppointment = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "doctor") {
    throw new ApiError(403, "Only doctors can update appointments");
  }

  const { id } = req.params;
  const { status, appointmentDate } = req.body;

  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  if (appointment.doctor.toString() !== req.user._id.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to update this appointment"
    );
  }

  if (status) appointment.status = status;
  if (appointmentDate) appointment.appointmentDate = appointmentDate;

  await appointment.save();

  return res
    .status(200)
    .json(
      new ApiResponse(200, appointment, "Appointment updated successfully")
    );
});

export const deleteAppointment = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const appointment = await Appointment.findById(id);
  if (!appointment) throw new ApiError(404, "Appointment not found");

  // Check role/ownership
  if (
    req.user.role === "patient" &&
    appointment.patient.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to cancel this appointment"
    );
  }
  if (
    req.user.role === "doctor" &&
    appointment.doctor.toString() !== req.user._id.toString()
  ) {
    throw new ApiError(
      403,
      "You are not authorized to cancel this appointment"
    );
  }

  await appointment.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Appointment cancelled successfully"));
});
