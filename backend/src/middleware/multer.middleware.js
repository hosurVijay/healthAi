import multer from "multer";
import path from "path";
import fs from "fs";
import { uploadOnCloudinary } from "../Utills/cloudinary.js";
import { ApiError } from "../Utills/ApiError.js";
import { asyncHandler } from "../Utills/asyncHandler.js";

// Multer storage (save to public/temp first)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/temp"); // your temp folder
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + extension);
  },
});

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
  if (!allowedTypes.includes(file.mimetype)) {
    const error = new ApiError(
      400,
      "Only JPEG, PNG, JPG, and WebP images are allowed!"
    );
    error.code = "INVALID_IMAGE_TYPE";
    return cb(error, false);
  }
  cb(null, true);
};

// Multer instance
const upload = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// Middleware: upload → Cloudinary → cleanup
const processUpload = asyncHandler(async (req, res, next) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  try {
    const result = await uploadOnCloudinary(req.file.path);

    if (!result) throw new ApiError(500, "Cloudinary upload failed");

    // attach Cloudinary info to request
    req.file.cloudinaryUrl = result.secure_url;
    req.file.public_id = result.public_id;

    next();
  } finally {
    // ✅ cleanup temp file in all cases
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
  }
});

export { upload, processUpload };
