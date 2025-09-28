import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    dosage: { type: String, required: true },
    frequency: { type: String, required: true },
    duration: { type: String },
    instructions: { type: String },
  },
  { _id: false }
);

const modificationSchema = new mongoose.Schema(
  {
    modifiedAt: { type: Date, default: Date.now },
    modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    changes: { type: String },
  },
  { _id: false }
);

const prescriptionSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    relatedWound: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wound",
      default: null,
    },

    medications: [medicationSchema],

    generalInstructions: { type: String },
    warningsAndPrecautions: { type: String },

    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },

    followUpRequired: { type: Boolean, default: false },
    followUpDate: { type: Date },

    sideEffectsToWatch: [{ type: String }],

    status: {
      type: String,
      enum: ["active", "completed", "cancelled", "expired"],
      default: "active",
    },

    modificationHistory: [modificationSchema],
  },
  { timestamps: true }
);

// Static method for active prescriptions (used in controller)
prescriptionSchema.statics.getActivePrescriptions = async function (patientId) {
  return this.find({
    patient: patientId,
    status: "active",
    startDate: { $lte: new Date() },
    $or: [{ endDate: { $exists: false } }, { endDate: { $gte: new Date() } }],
  }).populate("doctor", "name specialization email");
};

export default mongoose.model("Prescription", prescriptionSchema);
