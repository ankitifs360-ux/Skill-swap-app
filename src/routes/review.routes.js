import express from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createReview } from "../controllers/review.controller.js";

const router = express.Router();

router.post("/", verifyJWT, createReview);

export default router;