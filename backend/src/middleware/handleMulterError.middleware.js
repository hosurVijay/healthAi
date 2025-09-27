import multer from "multer";
import { ApiError } from "../Utills/ApiError.js";

// Multer error handler middleware
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case "LIMIT_FILE_SIZE":
        return next(
          new ApiError(400, "File too large. Maximum allowed size exceeded.")
        );
      case "LIMIT_FILE_COUNT":
        return next(
          new ApiError(400, "Too many files uploaded. Limit exceeded.")
        );
      case "LIMIT_UNEXPECTED_FILE":
        return next(new ApiError(400, "Unexpected field name in file upload."));
      default:
        return next(new ApiError(400, "File upload error: " + error.message));
    }
  }

  if (error.code === "INVALID_FILE_TYPE") {
    return next(new ApiError(400, "Only image files are allowed!"));
  }

  if (error.code === "INVALID_IMAGE_TYPE") {
    return next(
      new ApiError(400, "Only JPEG, PNG, and WebP images are allowed!")
    );
  }

  if (error.code === "FILE_TOO_LARGE") {
    return next(
      new ApiError(400, "File size too large. Maximum 10MB allowed.")
    );
  }

  next(error);
};

export { handleMulterError };
