import express from "express";
import {
  forgotPassword,
  getCurrentUser,
  getUserById,
  loginUser,
  registerUser,
  resetPassword,
  searchUsers,
  updateProfile,
  uploadAvatar,
  changePassword,
} from "../controllers/user.controller.js";
import { upload } from "../middlewares/uploadMiddleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/profile", verifyJWT, getCurrentUser);
router.put("/profile", verifyJWT, updateProfile);
router.put("/avatar", verifyJWT, upload.single("avatar"), uploadAvatar);
router.put("/change-password", verifyJWT, changePassword);
router.get("/search", verifyJWT, searchUsers);
router.get("/:id", verifyJWT, getUserById);

export default router;