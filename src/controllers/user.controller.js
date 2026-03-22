import User from "../models/user.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

/* ================= REGISTER ================= */
export const registerUser = async (req, res) => {
  try {
    console.log("BODY:", req.body);
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "name, email and password are required"
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword
    });

    const { password: _, ...userWithoutPassword } = user._doc;

    return res.status(201).json({
      message: "User registered successfully",
      user: userWithoutPassword
    });
  } catch (error) {
    return res.status(500).json({
      error: error.message
    });
  }
};

/* ================= LOGIN ================= */
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d"
    });

    return res.status(200).json({
      message: "Login successful",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        skillsToTeach: user.skillsToTeach,
        skillsToLearn: user.skillsToLearn,
        reputation: user.reputation,
        avatar: user.avatar   // ✅ added (important)
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ================= GET CURRENT USER ================= */
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ user });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ================= UPDATE PROFILE ================= */
export const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const { skillsToTeach, skillsToLearn } = req.body;

    const updateData = {};

    if (Array.isArray(skillsToTeach)) {
      updateData.skillsToTeach = skillsToTeach;
    }

    if (Array.isArray(skillsToLearn)) {
      updateData.skillsToLearn = skillsToLearn;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      {
        returnDocument: "after",
        runValidators: true,
        select: "-password"
      }
    );

    return res.json({
      message: "Profile updated",
      user
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ================= SEARCH USERS ================= */
export const searchUsers = async (req, res) => {
  try {
    const { skill = "" } = req.query;

    const users = await User.find({
      skillsToTeach: { $regex: skill, $options: "i" }
    }).select("-password");

    return res.json({
      message: "Users found",
      users
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

/* ================= GET USER BY ID ================= */
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("name email avatar reputation");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

/* ================= UPLOAD AVATAR ================= */
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const avatarUrl = `/${req.file.path.replace(/\\/g, "/")}`;

    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select("-password");

    res.status(200).json({
      message: "Avatar uploaded successfully",
      user,
    });
  } catch (error) {
    console.error("Upload avatar error:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};