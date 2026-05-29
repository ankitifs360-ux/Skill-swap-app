import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    type: {
      type: String,
      enum: [
        "request_sent",
        "request_accepted",
        "request_rejected",
        "message",
        "session_created",
        "session_accepted",
        "session_rescheduled",
        "session_cancelled",
        "session_completed",
        "session_rejected",
      ],
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    messageCount: {
      type: Number,
      default: 1,
      min: 1,
    },
    latestMessagePreview: {
      type: String,
      default: "",
      trim: true,
    },
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    relatedRequest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      default: null,
    },
    relatedSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Session",
      default: null,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Notification", notificationSchema);