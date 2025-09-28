import mongoose from "mongoose";

const woundHistorySchema = new mongoose.Schema(
  {
    imageUrl: { type: String, required: true },
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
      woundSize: { type: Number },
      notes: { type: String, maxlength: 500 },
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

    referenceImage: { type: String, required: true },
    woundType: { type: String, trim: true },
    location: { type: String, trim: true },

    isActive: { type: Boolean, default: true },
    currentStatus: {
      type: String,
      enum: ["healing", "stable", "worsening", "critical", "infected"],
      default: "stable",
    },

    history: [woundHistorySchema],
  },
  { timestamps: true }
);

export default mongoose.model("Wound", woundSchema);
