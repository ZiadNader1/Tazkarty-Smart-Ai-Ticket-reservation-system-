import express from "express";
import {
  createPromoCode,
  getPromoCodes,
  getPromoCodeById,
  updatePromoCode,
  deletePromoCode,
  applyPromoCode
} from "../controllers/promoCodeController.js";

import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

// Admin CRUD
router.post("/", protect, admin, createPromoCode);
router.get("/", protect, admin, getPromoCodes);
router.get("/:id", protect, admin, getPromoCodeById);
router.put("/:id", protect, admin, updatePromoCode);
router.delete("/:id", protect, admin, deletePromoCode);

// Public apply
router.post("/apply", applyPromoCode);

export default router;
