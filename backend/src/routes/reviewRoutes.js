import express from "express";
import {
  createReview,
  getReviewsByEvent,
  getReviewById,
  updateReview,
  deleteReview
} from "../controllers/reviewController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// user only can create/update/delete their review
router.post("/", protect, createReview);
router.put("/:id", protect, updateReview);
router.delete("/:id", protect, deleteReview);

// public
router.get("/event/:eventId", getReviewsByEvent);
router.get("/:id", getReviewById);

export default router;
