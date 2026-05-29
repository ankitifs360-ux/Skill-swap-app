import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: "",
      trim: true,
      lowercase: true,
    },
    bio: {
      type: String,
      default: "",
      trim: true,
      maxlength: 220,
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "busy", "away"],
      default: "available",
    },
    privacy: {
      showEmail: {
        type: Boolean,
        default: false,
      },
      showOnlineStatus: {
        type: Boolean,
        default: true,
      },
      showLearningGoals: {
        type: Boolean,
        default: true,
      },
      publicProfile: {
        type: Boolean,
        default: true,
      },
    },
    skillsToTeach: {
      type: [String],
      default: [],
    },
    skillsToLearn: {
      type: [String],
      default: [],
    },
    ratings: {
      type: [Number],
      default: [],
    },
    reputation: {
      type: Number,
      default: 0,
    },
    badges: {
      type: [String],
      default: [],
    },
    onboardingComplete: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: "",
    },
    lastSeen: {
      type: Date,
      default: null,
    },
    resetPasswordToken: {
      type: String,
      default: null,
    },
    resetPasswordExpiresAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);