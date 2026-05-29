import express from "express";
import {
  getChat,
  getChatList,
  getUnreadChatCount,
  markConversationRead,
} from "../controllers/chat.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/list", verifyJWT, getChatList);
router.get("/unread-count", verifyJWT, getUnreadChatCount);
router.put("/read/:userId", verifyJWT, markConversationRead);
router.get("/:userId", verifyJWT, getChat);

export default router;