import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Invalid email"],
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["doctor", "patient"],
      required: true,
    },
    phone: {
      type: String,
      trim: true,
    },

    // Doctor fields
    specialization: {
      type: String,
      required: false,
      required: function () {
        return this.role === "doctor";
      },
    },
    licenseNumber: {
      type: String,
      required: false,
      required: function () {
        return this.role === "doctor";
      },
    },

    // Patient fields
    assignedDoctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // links patient → doctor
      required: function () {
        return this.role === "patient";
      },
    },
    age: {
      type: Number,
      min: 1,
      max: 120,
    },

    // Common
    profileImage: {
      type: String, // Cloudinary URL
      default: "",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

export default mongoose.model("User", userSchema);
