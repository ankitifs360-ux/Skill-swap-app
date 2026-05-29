import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import {
  cancelSession,
  completeSession,
  createSession,
  getMySessions,
  getSessionById,
  rescheduleSession,
  respondToSession,
} from "../controllers/session.controller.js";

const router = express.Router();

router.post("/", verifyJWT, createSession);
router.get("/my", verifyJWT, getMySessions);
router.get("/:sessionId", verifyJWT, getSessionById);
router.put("/:sessionId/respond", verifyJWT, respondToSession);
router.put("/:sessionId/reschedule", verifyJWT, rescheduleSession);
router.put("/:sessionId/cancel", verifyJWT, cancelSession);
router.put("/:sessionId/complete", verifyJWT, completeSession);

export default router;