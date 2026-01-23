import express from "express";
import {
    getDashboardStats,
    getRevenueStats,
    getBookingStats
} from "../controllers/analyticsController.js";
import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/dashboard", protect, admin, getDashboardStats);
router.get("/revenue", protect, admin, getRevenueStats);
router.get("/bookings", protect, admin, getBookingStats);

export default router;

