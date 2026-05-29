import bcrypt from "bcrypt";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import Request from "../models/request.model.js";
import User from "../models/user.model.js";

const createResetToken = () => crypto.randomBytes(32).toString("hex");
const hashResetToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const DEFAULT_PRIVACY = {
  showEmail: false,
  showOnlineStatus: true,
  showLearningGoals: true,
  publicProfile: true,
};

const getMergedPrivacy = (privacy = {}) => ({
  ...DEFAULT_PRIVACY,
  ...(privacy || {}),
});

const getAvailabilityLabel = (value = "available") => {
  if (value === "busy") return "Busy";
  if (value === "away") return "Away";
  return "Available";
};

// Generate a unique username from name
const generateUsername = (name) => {
  const base = name.trim().toLowerCase().replace(/\s+/g, "");
  return base + Math.floor(1000 + Math.random() * 9000);
};

const buildPrivateUserPayload = (userDoc) => {
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  return {
    ...user,
    username: user.username || "",
    privacy: getMergedPrivacy(user.privacy),
    availabilityStatus: user.availabilityStatus || "available",
    availabilityLabel: getAvailabilityLabel(user.availabilityStatus),
  };
};

const buildPublicUserPayload = (userDoc, options = {}) => {
  const user = userDoc.toObject ? userDoc.toObject() : userDoc;
  const privacy = getMergedPrivacy(user.privacy);
  const isOwner = Boolean(options.isOwner);
  const isConnection = Boolean(options.isConnection);
  const relationship = options.relationship || { status: "none", direction: null, requestId: null };
  const canViewPrivateProfile = isOwner || isConnection || privacy.publicProfile;
  const canViewEmail = isOwner || privacy.showEmail;
  const canViewLearningGoals = isOwner || privacy.showLearningGoals;
  const canViewOnlineStatus = isOwner || privacy.showOnlineStatus;

  return {
    _id: user._id,
    name: user.name,
    username: user.username || "",
    avatar: user.avatar || "",
    bio: user.bio || "",
    reputation: user.reputation ?? 0,
    badges: user.badges || [],
    onboardingComplete: user.onboardingComplete || false,
    availabilityStatus: user.availabilityStatus || "available",
    availabilityLabel: getAvailabilityLabel(user.availabilityStatus),
    skillsToTeach: canViewPrivateProfile ? user.skillsToTeach || [] : [],
    skillsToLearn: canViewPrivateProfile && canViewLearningGoals ? user.skillsToLearn || [] : [],
    email: canViewEmail ? user.email : "",
    lastSeen: canViewOnlineStatus ? user.lastSeen : null,
    createdAt: user.createdAt,
    relationship,
    privacy: {
      showEmail: privacy.showEmail,
      showOnlineStatus: privacy.showOnlineStatus,
      showLearningGoals: privacy.showLearningGoals,
      publicProfile: privacy.publicProfile,
      canViewEmail,
      canViewLearningGoals,
      canViewOnlineStatus,
      canViewProfile: canViewPrivateProfile,
      isConnection,
      isOwner,
    },
  };
};

const getConnectionUserIdSet = async (viewerId) => {
  if (!viewerId) return new Set();

  const requests = await Request.find({
    status: "accepted",
    $or: [{ sender: viewerId }, { receiver: viewerId }],
  }).select("sender receiver");

  const connectedUserIds = new Set();

  requests.forEach((request) => {
    const senderId = request.sender?.toString();
    const receiverId = request.receiver?.toString();

    if (senderId && senderId !== viewerId) connectedUserIds.add(senderId);
    if (receiverId && receiverId !== viewerId) connectedUserIds.add(receiverId);
  });

  return connectedUserIds;
};

const getRelationshipMap = async (viewerId, targetUserIds = []) => {
  if (!viewerId || !targetUserIds.length) return new Map();

  const uniqueTargetIds = [...new Set(targetUserIds.map((id) => String(id)))];

  const requests = await Request.find({
    $or: [
      { sender: viewerId, receiver: { $in: uniqueTargetIds } },
      { receiver: viewerId, sender: { $in: uniqueTargetIds } },
    ],
  })
    .select("sender receiver status skill createdAt updatedAt")
    .sort({ updatedAt: -1, createdAt: -1 });

  const relationshipMap = new Map();

  requests.forEach((request) => {
    const senderId = request.sender?.toString();
    const receiverId = request.receiver?.toString();
    const otherUserId = senderId === String(viewerId) ? receiverId : senderId;

    if (!otherUserId || relationshipMap.has(otherUserId)) return;

    relationshipMap.set(otherUserId, {
      status: request.status,
      direction: senderId === String(viewerId) ? "outgoing" : "incoming",
      requestId: request._id,
      skill: request.skill || "",
      updatedAt: request.updatedAt,
      createdAt: request.createdAt,
    });
  });

  return relationshipMap;
};

export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    // Auto-generate a unique username
    let username = generateUsername(name);
    let usernameExists = await User.findOne({ username });
    while (usernameExists) {
      username = generateUsername(name);
      usernameExists = await User.findOne({ username });
    }

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      username,
    });

    const { password: _password, ...userWithoutPassword } = user.toObject();

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        ...userWithoutPassword,
        privacy: getMergedPrivacy(userWithoutPassword.privacy),
        availabilityLabel: getAvailabilityLabel(userWithoutPassword.availabilityStatus),
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    user.lastSeen = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        username: user.username || "",
        email: user.email,
        bio: user.bio,
        availabilityStatus: user.availabilityStatus,
        availabilityLabel: getAvailabilityLabel(user.availabilityStatus),
        privacy: getMergedPrivacy(user.privacy),
        skillsToTeach: user.skillsToTeach,
        skillsToLearn: user.skillsToLearn,
        reputation: user.reputation,
        badges: user.badges || [],
        onboardingComplete: user.onboardingComplete || false,
        avatar: user.avatar,
        lastSeen: user.lastSeen,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email: email.trim().toLowerCase() });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const resetToken = createResetToken();
    user.resetPasswordToken = hashResetToken(resetToken);
    user.resetPasswordExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await user.save();

    return res.json({
      message: "Password reset request created successfully",
      resetToken,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ message: "token and password are required" });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters" });
    }

    const hashedToken = hashResetToken(token);

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpiresAt: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({ message: "Reset token is invalid or expired" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = null;
    user.resetPasswordExpiresAt = null;
    user.lastSeen = new Date();
    await user.save();

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password -resetPasswordToken -resetPasswordExpiresAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user: buildPrivateUserPayload(user) });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      username,
      bio,
      availabilityStatus,
      privacy,
      skillsToTeach,
      skillsToLearn,
      onboardingComplete,
    } = req.body;

    const updateData = {};

    if (typeof name === "string" && name.trim()) {
      updateData.name = name.trim();
    }

    if (typeof username === "string" && username.trim()) {
      const normalizedUsername = username.trim().toLowerCase().replace(/\s+/g, "");
      // Check uniqueness
      const existing = await User.findOne({ username: normalizedUsername, _id: { $ne: userId } });
      if (existing) {
        return res.status(400).json({ message: "Username is already taken" });
      }
      updateData.username = normalizedUsername;
    }

    if (typeof bio === "string") {
      updateData.bio = bio.trim().slice(0, 220);
    }

    if (["available", "busy", "away"].includes(availabilityStatus)) {
      updateData.availabilityStatus = availabilityStatus;
    }

    if (privacy && typeof privacy === "object") {
      updateData.privacy = {
        ...DEFAULT_PRIVACY,
        showEmail: Boolean(privacy.showEmail),
        showOnlineStatus:
          typeof privacy.showOnlineStatus === "boolean"
            ? privacy.showOnlineStatus
            : DEFAULT_PRIVACY.showOnlineStatus,
        showLearningGoals:
          typeof privacy.showLearningGoals === "boolean"
            ? privacy.showLearningGoals
            : DEFAULT_PRIVACY.showLearningGoals,
        publicProfile:
          typeof privacy.publicProfile === "boolean"
            ? privacy.publicProfile
            : DEFAULT_PRIVACY.publicProfile,
      };
    }

    if (Array.isArray(skillsToTeach)) {
      updateData.skillsToTeach = skillsToTeach
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (Array.isArray(skillsToLearn)) {
      updateData.skillsToLearn = skillsToLearn
        .map((item) => item.trim())
        .filter(Boolean);
    }

    if (typeof onboardingComplete === "boolean") {
      updateData.onboardingComplete = onboardingComplete;
    }

    const user = await User.findByIdAndUpdate(userId, updateData, {
      returnDocument: "after",
      runValidators: true,
    }).select("-password -resetPasswordToken -resetPasswordExpiresAt");

    return res.json({
      message: "Profile updated",
      user: buildPrivateUserPayload(user),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const searchUsers = async (req, res) => {
  try {
    const { skill = "" } = req.query;
    const searchValue = skill.trim();
    const viewerId = req.user.id;
    const connectedUserIds = await getConnectionUserIdSet(viewerId);

    const filter = searchValue
      ? {
          _id: { $ne: viewerId },
          $or: [
            { name: { $regex: searchValue, $options: "i" } },
            { username: { $regex: searchValue, $options: "i" } },
            { skillsToTeach: { $regex: searchValue, $options: "i" } },
            { skillsToLearn: { $regex: searchValue, $options: "i" } },
            { bio: { $regex: searchValue, $options: "i" } },
          ],
        }
      : { _id: { $ne: viewerId } };

    const users = await User.find(filter).select(
      "name username email avatar bio availabilityStatus privacy reputation badges onboardingComplete skillsToTeach skillsToLearn lastSeen createdAt"
    );

    const relationshipMap = await getRelationshipMap(
      viewerId,
      users.map((user) => user._id)
    );

    const visibleUsers = users
      .filter((user) => {
        const privacy = getMergedPrivacy(user.privacy);
        const isConnection = connectedUserIds.has(user._id.toString());
        return privacy.publicProfile || isConnection;
      })
      .map((user) =>
        buildPublicUserPayload(user, {
          isConnection: connectedUserIds.has(user._id.toString()),
          relationship:
            relationshipMap.get(user._id.toString()) || {
              status: "none",
              direction: null,
              requestId: null,
            },
        })
      );

    return res.json({
      message: "Users found",
      users: visibleUsers,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const getUserById = async (req, res) => {
  try {
    const viewerId = req.user.id;
    const targetUserId = req.params.id;

    const user = await User.findById(targetUserId).select(
      "name username email avatar bio availabilityStatus privacy reputation badges onboardingComplete skillsToTeach skillsToLearn lastSeen createdAt"
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (viewerId === targetUserId) {
      return res.json({ user: buildPrivateUserPayload(user) });
    }

    const connectedUserIds = await getConnectionUserIdSet(viewerId);
    const isConnection = connectedUserIds.has(targetUserId);
    const privacy = getMergedPrivacy(user.privacy);

    if (!privacy.publicProfile && !isConnection) {
      return res.status(403).json({
        message: "This user has made their profile private",
      });
    }

    return res.json({
      user: buildPublicUserPayload(user, { isConnection }),
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    // With Cloudinary storage, multer sets req.file.path to the full
    // https://res.cloudinary.com/... URL — no path manipulation needed.
    const avatarUrl = req.file.path;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { returnDocument: "after" }
    ).select("-password -resetPasswordToken -resetPasswordExpiresAt");

    return res.status(200).json({
      message: "Avatar uploaded successfully",
      user: buildPrivateUserPayload(user),
    });
  } catch (error) {
    console.error("Upload avatar error:", error.message);
    return res.status(500).json({ message: "Server error" });
  }
};

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Current password is incorrect" });
    }

    user.password = await bcrypt.hash(newPassword, 10);
    await user.save();

    return res.json({ message: "Password changed successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};