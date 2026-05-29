import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  getMyNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
} from "../controllers/notification.controller.js";

const router = express.Router();

router.get("/", verifyJWT, getMyNotifications);
router.get("/unread-count", verifyJWT, getUnreadNotificationCount);
router.put("/mark-all-read", verifyJWT, markAllNotificationsRead);

export default router;