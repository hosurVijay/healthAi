import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // doctor or patient receiving the notification
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // who triggered it (patient or doctor)
    },
    type: {
      type: String,
      enum: [
        "wound_update", // new wound image uploaded
        "wound_growth", // AI detected worsening
        "prescription_added", // doctor prescribed medicine
        "follow_up", // reminder for check-up
        "general", // any other
      ],
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    relatedWound: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Wound", // link to wound if applicable
    },
    relatedPrescription: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Prescription", // link to prescription if applicable
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
