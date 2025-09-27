// controllers/userController.js
import User from "../Models/user.model.js";
import Wound from "../Models/wound.model.js";
import Appointment from "../Models/appointment.model.js";
import Prescription from "../Models/prescription.model.js";
import { ApiError } from "../Utills/ApiError.js";
import { ApiResponse } from "../Utills/ApiResponses.js";
import { validationResult } from "express-validator";
import { asyncHandler } from "../Utills/asyncHandler.js";
import { uploadOnCloudinary } from "../Utills/cloudinary.js";

// ======================================================
// @desc    Get all active doctors
// @route   GET /api/users/doctors
// @access  Private
// ======================================================
export const getDoctors = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, specialization } = req.query;
  const skip = (page - 1) * limit;

  let query = { role: "doctor", isActive: true };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { specialization: { $regex: search, $options: "i" } },
    ];
  }

  if (specialization) {
    query.specialization = { $regex: specialization, $options: "i" };
  }

  const doctors = await User.find(query)
    .select("-password")
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      doctors,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  );
});

// ======================================================
// @desc    Get patients assigned to doctor
// @route   GET /api/users/patients
// @access  Private (Doctor only)
// ======================================================
export const getPatients = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const skip = (page - 1) * limit;

  let query = {
    role: "patient",
    assignedDoctor: req.user._id,
    isActive: true,
  };

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  const patients = await User.find(query)
    .select("-password")
    .sort({ name: 1 })
    .skip(skip)
    .limit(parseInt(limit));

  const patientsWithWoundCount = await Promise.all(
    patients.map(async (patient) => {
      const activeWounds = await Wound.countDocuments({
        patient: patient._id,
        isActive: true,
      });

      const criticalWounds = await Wound.countDocuments({
        patient: patient._id,
        isActive: true,
        currentStatus: { $in: ["critical", "infected"] },
      });

      return { ...patient.toObject(), activeWounds, criticalWounds };
    })
  );

  const total = await User.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(200, {
      patients: patientsWithWoundCount,
      pagination: {
        current: parseInt(page),
        pages: Math.ceil(total / limit),
        total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  );
});

// ======================================================
// @desc    Update user profile
// @route   PUT /api/users/:userId
// @access  Private
// ======================================================
export const updateProfile = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, "Validation failed", errors.array());
  }

  const { userId } = req.params;

  if (req.user._id.toString() !== userId) {
    throw new ApiError(403, "Access denied. Can only update own profile.");
  }

  const { name, phone, specialization, medicalHistory } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (phone) updateData.phone = phone;

  if (req.file?.path) {
    const cloudinaryResult = await uploadOnCloudinary(req.file.path);
    if (!cloudinaryResult?.url) {
      throw new ApiError(500, "Failed to upload profile image");
    }
    updateData.profileImage = cloudinaryResult.url;
  }

  if (req.user.role === "doctor" && specialization) {
    updateData.specialization = specialization;
  }

  if (req.user.role === "patient" && medicalHistory !== undefined) {
    updateData.medicalHistory = medicalHistory;
  }

  const user = await User.findByIdAndUpdate(userId, updateData, {
    new: true,
    runValidators: true,
  })
    .select("-password")
    .populate("assignedDoctor", "name specialization email phone");

  if (!user) throw new ApiError(404, "User not found");

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "Profile updated successfully"));
});

// ======================================================
// @desc    Assign patient to doctor
// @route   POST /api/users/assign
// @access  Private (Doctor only)
// ======================================================
export const assignPatient = asyncHandler(async (req, res) => {
  if (req.user.role !== "doctor") {
    throw new ApiError(403, "Only doctors can assign patients");
  }

  const { patientId } = req.body;
  const patient = await User.findById(patientId);

  if (!patient || patient.role !== "patient") {
    throw new ApiError(404, "Patient not found");
  }

  patient.assignedDoctor = req.user._id;
  await patient.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { patient }, "Patient assigned successfully"));
});

// ======================================================
// @desc    Unassign patient from doctor
// @route   POST /api/users/unassign
// @access  Private (Doctor only)
// ======================================================
export const unassignPatient = asyncHandler(async (req, res) => {
  if (req.user.role !== "doctor") {
    throw new ApiError(403, "Only doctors can unassign patients");
  }

  const { patientId } = req.body;
  const patient = await User.findById(patientId);

  if (!patient || patient.role !== "patient") {
    throw new ApiError(404, "Patient not found");
  }

  if (patient.assignedDoctor?.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "This patient is not assigned to you");
  }

  patient.assignedDoctor = null;
  await patient.save();

  return res
    .status(200)
    .json(new ApiResponse(200, { patient }, "Patient unassigned successfully"));
});

// ======================================================
// @desc    Dashboard stats for doctor
// @route   GET /api/users/dashboard
// @access  Private (Doctor only)
// ======================================================
export const dashboardStats = asyncHandler(async (req, res) => {
  if (req.user.role !== "doctor") {
    throw new ApiError(403, "Only doctors can view dashboard stats");
  }

  const patientCount = await User.countDocuments({
    role: "patient",
    assignedDoctor: req.user._id,
  });

  const activeWounds = await Wound.countDocuments({
    doctor: req.user._id,
    isActive: true,
  });

  const criticalWounds = await Wound.countDocuments({
    doctor: req.user._id,
    isActive: true,
    currentStatus: { $in: ["critical", "infected"] },
  });

  const upcomingAppointments = await Appointment.countDocuments({
    doctor: req.user._id,
    appointmentDate: { $gte: new Date() },
    status: { $in: ["scheduled", "confirmed"] },
  });

  const activePrescriptions = await Prescription.countDocuments({
    doctor: req.user._id,
    status: "active",
  });

  return res.status(200).json(
    new ApiResponse(200, {
      patientCount,
      activeWounds,
      criticalWounds,
      upcomingAppointments,
      activePrescriptions,
    })
  );
});

// ======================================================
// @desc    Search users (doctor sees own patients, admin sees all)
// @route   GET /api/users/search
// @access  Private
// ======================================================
export const searchUsers = asyncHandler(async (req, res) => {
  const { role, search } = req.query;
  let query = { isActive: true };

  if (role) query.role = role;
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }

  if (req.user.role === "doctor") {
    query.assignedDoctor = req.user._id;
  }

  const users = await User.find(query).select("-password").limit(50);

  return res
    .status(200)
    .json(new ApiResponse(200, { users }, "Users fetched successfully"));
});

// ======================================================
// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private
// ======================================================
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id)
    .select("-password")
    .populate("assignedDoctor", "name specialization email phone");

  if (!user) throw new ApiError(404, "User not found");

  if (req.user.role === "doctor" && user.role === "patient") {
    if (user.assignedDoctor?._id.toString() !== req.user._id.toString()) {
      throw new ApiError(403, "Access denied");
    }
  }

  if (req.user.role === "patient" && req.user._id.toString() !== id) {
    throw new ApiError(403, "Access denied");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, { user }, "User fetched successfully"));
});
