import Prescription from "../Models/prescription.model.js";
import User from "../Models/user.model.js";
import Wound from "../Models/wound.model.js";
import Notification from "../Models/notification.model.js";
import { ApiResponse } from "../Utills/ApiResponses.js";
import { ApiError } from "../Utills/ApiError.js";
import { asyncHandler } from "../Utills/asyncHandler.js";

// @desc    Get prescriptions (doctor sees own patients, patient sees own)
const getPrescriptions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, patientId, active = false } = req.query;
  const skip = (page - 1) * limit;
  let query = {};

  if (req.user.role === "doctor") {
    query.doctor = req.user._id;
    if (patientId) {
      const patient = await User.findOne({
        _id: patientId,
        assignedDoctor: req.user._id,
      });
      if (!patient) {
        throw new ApiError(403, "Patient not assigned to this doctor");
      }
      query.patient = patientId;
    }
  } else if (req.user.role === "patient") {
    query.patient = req.user._id;
  }

  if (status && status !== "all") query.status = status;

  if (active === "true") {
    query.status = "active";
    query.startDate = { $lte: new Date() };
    query.$or = [
      { endDate: { $exists: false } },
      { endDate: { $gte: new Date() } },
    ];
  }

  const prescriptions = await Prescription.find(query)
    .populate("doctor", "name specialization email")
    .populate("patient", "name email age")
    .populate("relatedWound", "woundType location currentStatus")
    .populate("modificationHistory.modifiedBy", "name role")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  const total = await Prescription.countDocuments(query);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        prescriptions,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
      "Prescriptions fetched successfully"
    )
  );
});

// @desc    Get active prescriptions (patient only)
const getActivePrescriptions = asyncHandler(async (req, res) => {
  const prescriptions = await Prescription.getActivePrescriptions(req.user._id);

  return res
    .status(200)
    .json(
      new ApiResponse(200, { prescriptions }, "Active prescriptions fetched")
    );
});

// @desc    Create new prescription (doctor only)
const createPrescription = asyncHandler(async (req, res) => {
  if (req.user.role !== "doctor") {
    throw new ApiError(403, "Only doctors can create prescriptions");
  }

  const {
    patientId,
    medications,
    generalInstructions,
    startDate,
    endDate,
    followUpRequired = false,
    followUpDate,
    sideEffectsToWatch = [],
    warningsAndPrecautions,
    relatedWoundId,
  } = req.body;

  const patient = await User.findById(patientId);
  if (!patient || patient.role !== "patient") {
    throw new ApiError(404, "Patient not found");
  }

  if (patient.assignedDoctor.toString() !== req.user._id.toString()) {
    throw new ApiError(403, "Patient not assigned to this doctor");
  }

  if (relatedWoundId) {
    const wound = await Wound.findById(relatedWoundId);
    if (
      !wound ||
      wound.doctor.toString() !== req.user._id.toString() ||
      wound.patient.toString() !== patientId
    ) {
      throw new ApiError(404, "Related wound not found or access denied");
    }
  }

  const prescriptionStartDate = startDate ? new Date(startDate) : new Date();
  const prescriptionEndDate = endDate ? new Date(endDate) : null;

  if (prescriptionEndDate && prescriptionEndDate <= prescriptionStartDate) {
    throw new ApiError(400, "End date must be after start date");
  }

  const prescription = await Prescription.create({
    doctor: req.user._id,
    patient: patientId,
    relatedWound: relatedWoundId,
    medications,
    generalInstructions,
    startDate: prescriptionStartDate,
    endDate: prescriptionEndDate,
    followUpRequired,
    followUpDate: followUpDate ? new Date(followUpDate) : null,
    sideEffectsToWatch,
    warningsAndPrecautions,
  });

  const populatedPrescription = await Prescription.findById(prescription._id)
    .populate("doctor", "name specialization email")
    .populate("patient", "name email age")
    .populate("relatedWound", "woundType location");

  const medicationNames = medications.map((m) => m.name).join(", ");
  await Notification.create({
    recipient: patientId,
    sender: req.user._id,
    type: "prescription_created",
    title: "New Prescription",
    message: `Dr. ${req.user.name} prescribed: ${medicationNames}`,
    priority: "medium",
    metadata: {
      prescriptionId: prescription._id,
      medicationCount: medications.length,
    },
  });

  return res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { prescription: populatedPrescription },
        "Prescription created successfully"
      )
    );
});

// @desc    Get prescription details
const getPrescriptionById = asyncHandler(async (req, res) => {
  const { prescriptionId } = req.params;

  const prescription = await Prescription.findById(prescriptionId)
    .populate("doctor", "name specialization email phone")
    .populate("patient", "name email phone age medicalHistory")
    .populate("relatedWound", "woundType location currentStatus")
    .populate("modificationHistory.modifiedBy", "name role");

  if (!prescription) throw new ApiError(404, "Prescription not found");

  const isDoctor =
    req.user.role === "doctor" &&
    prescription.doctor._id.toString() === req.user._id.toString();
  const isPatient =
    req.user.role === "patient" &&
    prescription.patient._id.toString() === req.user._id.toString();

  if (!isDoctor && !isPatient) throw new ApiError(403, "Access denied");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { prescription },
        "Prescription fetched successfully"
      )
    );
});

export {
  getPrescriptions,
  getActivePrescriptions,
  createPrescription,
  getPrescriptionById,
};
