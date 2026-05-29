import express from "express";
import {
  sendRequest,
  respondRequest,
  getMyRequests,
  getRequestCounts,
  rateUser,
} from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.post("/send", verifyJWT, sendRequest);
router.put("/respond", verifyJWT, respondRequest);
router.get("/my-requests", verifyJWT, getMyRequests);
router.get("/counts", verifyJWT, getRequestCounts);
router.post("/rate", verifyJWT, rateUser);

export default router;