import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";

import {
  createSeatCategory,
  getSeatCategories,
  getSeatCategoryById,
  updateSeatCategory,
  deleteSeatCategory
} from "../controllers/seatCategoryController.js";

const router = express.Router();

// admin only
router.post("/", protect, admin, createSeatCategory);
router.put("/:id", protect, admin, updateSeatCategory);
router.delete("/:id", protect, admin, deleteSeatCategory);

// public
router.get("/", getSeatCategories);
router.get("/:id", getSeatCategoryById);

export default router;
