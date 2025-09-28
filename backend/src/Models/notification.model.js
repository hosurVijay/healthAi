import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: [
        "wound_update",
        "wound_growth",
        "prescription_added",
        "follow_up",
        "general",
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedWound: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wound",
    },
    relatedPrescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription",
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Mark notification as read
notificationSchema.methods.markAsRead = function () {
  this.isRead = true;
  return this.save();
};

// Static to fetch unread notifications
notificationSchema.statics.getUnreadForUser = function (userId) {
  return this.find({ user: userId, isRead: false })
    .sort({ createdAt: -1 })
    .populate("sender", "name role")
    .populate("relatedWound", "woundType location")
    .populate("relatedPrescription", "status medications");
};

export default mongoose.model("Notification", notificationSchema);
