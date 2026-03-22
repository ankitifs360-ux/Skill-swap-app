import express from "express";
import { sendRequest } from "../controllers/request.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { respondRequest } from "../controllers/request.controller.js";
import {getMyRequests} from "../controllers/request.controller.js";
import { rateUser } from "../controllers/request.controller.js";
const router = express.Router();

router.post("/send", verifyJWT, sendRequest);
router.put("/respond", verifyJWT, respondRequest);
router.get("/my-requests", verifyJWT, getMyRequests);

router.post("/rate", verifyJWT, rateUser);

export default router;