import express from "express";
import {
  registerUser,
  loginUser,
  updateProfile,
  getProfile,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getAllUsers,
  updateUserById,
  deleteUser
} from "../controllers/userController.js";
import { protect, admin } from "../middleware/authMiddleware.js";
import { loginLimiter, forgotPasswordLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Public routes
router.post("/register", registerUser);
router.post("/login", loginLimiter, loginUser);
router.get("/verify-email/:token", verifyEmail);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.put("/reset-password/:token", resetPassword);

// Protected routes
router.get("/profile", protect, getProfile);
router.put("/update", protect, updateProfile);

// Admin Routes (Protected + Admin)
router.get("/", protect, admin, getAllUsers);
router.put("/:id", protect, admin, updateUserById);
router.delete("/:id", protect, admin, deleteUser);

export default router;