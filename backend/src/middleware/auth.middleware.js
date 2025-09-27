import jwt from "jsonwebtoken";
import User from "../Models/user.model.js";
import { ApiError } from "../Utills/ApiError.js";
import { asyncHandler } from "../Utills/asyncHandler.js";

// Verify JWT token
const authenticate = asyncHandler(async (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    throw new ApiError(401, "Access denied. No token provided.");
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new ApiError(401, "Access denied. Invalid token format.");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key");
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      throw new ApiError(401, "Token expired.");
    }
    throw new ApiError(401, "Invalid token.");
  }

  const user = await User.findById(decoded.userId).select("-password");
  if (!user) {
    throw new ApiError(401, "Token is valid but user not found.");
  }

  if (!user.isActive) {
    throw new ApiError(401, "Account is deactivated.");
  }

  req.user = user;
  next();
});

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new ApiError(401, "Authentication required.");
    }

    if (!roles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Required role: ${roles.join(" or ")}`
      );
    }

    next();
  };
};

// Doctor access check for patient data
const authorizePatientAccess = asyncHandler(async (req, res, next) => {
  if (!req.user) {
    throw new ApiError(401, "Authentication required.");
  }

  const patientId =
    req.params.patientId || req.body.patient || req.query.patientId;

  if (!patientId) {
    throw new ApiError(400, "Patient ID is required.");
  }

  if (req.user.role === "patient") {
    if (req.user._id.toString() !== patientId.toString()) {
      throw new ApiError(403, "Patients can only access their own data.");
    }
  } else if (req.user.role === "doctor") {
    const patient = await User.findById(patientId);
    if (!patient) {
      throw new ApiError(404, "Patient not found.");
    }
    if (patient.assignedDoctor?.toString() !== req.user._id.toString()) {
      throw new ApiError(
        403,
        "Access denied. Patient not assigned to this doctor."
      );
    }
  }

  next();
});

// Simple rate limiting
const rateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();

  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (requests.has(key)) {
      const userRequests = requests
        .get(key)
        .filter((time) => time > windowStart);
      requests.set(key, userRequests);
    } else {
      requests.set(key, []);
    }

    const userRequests = requests.get(key);

    if (userRequests.length >= maxRequests) {
      throw new ApiError(429, "Too many requests. Please try again later.");
    }

    userRequests.push(now);
    next();
  };
};

export { authenticate, authorize, authorizePatientAccess, rateLimit };
