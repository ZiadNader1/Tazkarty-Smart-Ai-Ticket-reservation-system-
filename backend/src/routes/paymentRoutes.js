import express from "express";
import {
  createPaymentSession,
  confirmPayment,
  handleStripeWebhook,
  getAllPayments,
  getUserPayments
} from "../controllers/paymentController.js";

import { protect } from "../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

// ===== USER ROUTES =====
// Create payment intent
router.post("/create-session", protect, createPaymentSession);

// Confirm payment after Stripe success
router.post("/confirm", protect, confirmPayment);

// Get user's payment history
router.get("/user/:userId", protect, getUserPayments);

// ===== ADMIN ROUTES =====
router.get("/", protectAdmin, getAllPayments);

// ===== STRIPE WEBHOOK =====
// ⚠️ IMPORTANT: This must be BEFORE express.json() middleware
// Update server.js to handle raw body for webhooks
router.post(
  "/webhook",
  express.raw({ type: 'application/json' }),
  handleStripeWebhook
);

export default router;