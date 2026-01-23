import express from "express";
import {
  generateRecommendations,
  getUserRecommendations,
  clearRecommendations
} from "../controllers/recommendationController.js";

import { protect } from "../middleware/authMiddleware.js"; // optional

const router = express.Router();

// generate (on-demand) and save the results
router.post("/generate/:userId", protect, generateRecommendations);

// get cached recommendations
router.get("/user/:userId", protect, getUserRecommendations);

// clear
router.delete("/user/:userId", protect, clearRecommendations);

export default router;
