// controllers/userController.js
import User from "../models/User.js";
import Wound from "../models/Wound.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { validationResult } from "express-validator";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

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

  // add wound stats
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
// Add assignPatient, unassignPatient, dashboardStats, searchUsers, getUserById
// (all similar pattern with asyncHandler, ApiError, ApiResponse)
// ======================================================
