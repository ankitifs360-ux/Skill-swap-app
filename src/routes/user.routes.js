import express from "express";
import {
  registerUser,
  loginUser,
  getCurrentUser,
  updateProfile,
  searchUsers,
  getUserById,
  uploadAvatar,
} from "../controllers/user.controller.js";

import { upload } from "../middlewares/uploadMiddleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Public
router.post("/register", registerUser);
router.post("/login", loginUser);

// Protected
router.get("/profile", verifyJWT, getCurrentUser);
router.put("/profile", verifyJWT, updateProfile);

/* ✅ FIXED HERE */
router.put("/avatar", verifyJWT, upload.single("avatar"), uploadAvatar);

router.get("/search", verifyJWT, searchUsers);
router.get("/:id", verifyJWT, getUserById);

export default router;