import express from "express";
import { getSmartMatch } from "../controllers/ai.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/match", verifyJWT, getSmartMatch);

export default router;
