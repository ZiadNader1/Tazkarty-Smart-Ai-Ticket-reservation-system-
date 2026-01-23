import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  deleteCategory
} from "../controllers/EventCategoryController.js";

const router = express.Router();

// admin only
router.post("/", protect, admin, createCategory);
router.put("/:id", protect, admin, updateCategory);
router.delete("/:id", protect, admin, deleteCategory);

// public
router.get("/", getCategories);
router.get("/:id", getCategoryById);

export default router;
