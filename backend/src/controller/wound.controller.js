import Wound from "../Models/wound.model.js";
import { ApiResponse } from "../Utills/ApiResponses.js";
import { ApiError } from "../Utills/ApiError.js";
import { asyncHandler } from "../Utills/asyncHandler.js";

// Create wound
export const createWound = asyncHandler(async (req, res) => {
  if (!req.file?.cloudinaryUrl) {
    throw new ApiError(400, "Wound reference image is required");
  }

  const { woundType, location, doctorId } = req.body;

  const wound = await Wound.create({
    patient: req.user._id,
    doctor: doctorId,
    referenceImage: req.file.cloudinaryUrl, // from Cloudinary
    woundType,
    location,
    history: [
      {
        imageUrl: req.file.cloudinaryUrl,
        analysisResult: {
          healingStatus: "stable",
          infectionRisk: "low",
        },
      },
    ],
  });

  return res
    .status(201)
    .json(new ApiResponse(201, wound, "Wound created successfully"));
});

// Add wound image
export const addWoundImage = asyncHandler(async (req, res) => {
  const { woundId } = req.params;
  const wound = await Wound.findById(woundId);
  if (!wound) throw new ApiError(404, "Wound not found");

  if (!req.file?.cloudinaryUrl) {
    throw new ApiError(400, "Image file required");
  }

  wound.history.push({
    imageUrl: req.file.cloudinaryUrl,
    analysisResult: {
      healingStatus: "stable",
      infectionRisk: "low",
    },
  });

  await wound.save();

  return res
    .status(200)
    .json(new ApiResponse(200, wound, "Wound image added successfully"));
});
