const mongoose = require("mongoose");

const woundHistorySchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true }, // stored in Cloudinary
    uploadedAt: { type: Date, default: Date.now },
    analysisResult: {
      healingStatus: {
        type: String,
        enum: ["healing", "worsening", "infected", "stable"],
        default: "stable",
      },
      infectionRisk: {
        type: String,
        enum: ["low", "medium", "high", "critical"],
        default: "low",
      },
      woundSize: { type: Number }, // in mm² or cm²
      notes: { type: String, maxlength: 500 }, // AI or doctor notes
    },
  },
  { _id: false }
);

const woundSchema = new mongoose.Schema(
  {
    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    referenceImage: { type: String, required: true }, // first image uploaded
    woundType: { type: String, trim: true }, // e.g., burn, cut, ulcer
    location: { type: String, trim: true }, // e.g., left leg, right arm

    history: [woundHistorySchema], // follow-up images + AI analysis
  },
  { timestamps: true }
);

module.exports = mongoose.model("Wound", woundSchema);
