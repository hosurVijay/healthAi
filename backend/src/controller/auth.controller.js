import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../Models/user.model.js";
import { ApiError } from "../Utills/ApiError.js";
import { ApiResponse } from "../Utills/ApiResponses.js";
import { asyncHandler } from "../Utills/asyncHandler.js";

// Generate JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || "your-secret-key", {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d", // e.g. 1 day
  });
};

export const registerUser = asyncHandler(async (req, res) => {
  const {
    name,
    email,
    password,
    role,
    phone,
    age,
    assignedDoctor,
    specialization,
    licenseNumber,
  } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ApiError(400, "User already exists");
  }

  // const hashedPassword = await bcrypt.hash(password, 10);

  const userData = {
    name,
    email,
    password,
    role,
    isActive: true,
    phone,
    age,
    assignedDoctor,
  };

  // 👇 only add doctor-specific fields if role is doctor
  if (role === "doctor") {
    if (!specialization || !licenseNumber) {
      throw new ApiError(
        400,
        "Specialization and License Number are required for doctors"
      );
    }
    userData.specialization = specialization;
    userData.licenseNumber = licenseNumber;
  }

  const user = await User.create(userData);

  const token = generateToken(user._id);

  return res.status(201).json(
    new ApiResponse(
      201,
      {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "User registered successfully"
    )
  );
});

// @desc Login user
// @route POST /api/auth/login
// @access Public
export const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });
  if (!user) throw new ApiError(401, "Invalid credentials");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ApiError(401, "Invalid credentials");

  if (!user.isActive) {
    throw new ApiError(403, "Account is deactivated");
  }

  const token = generateToken(user._id);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        token,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      "Login successful"
    )
  );
});
export const logoutUser = asyncHandler(async (req, res) => {
  // If you're not using refresh tokens/blacklist, logout is handled on client side
  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Logged out successfully"));
});
