import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  createBooking,
  confirmBooking,
  cancelBooking,
  getMyBookings,
  getAvailableSeats,
  getBookingById,
  getRecentBookings,
  deleteBooking
} from "../controllers/bookingController.js";

const router = express.Router();

// Step 1: Create booking (lock seats)
router.post("/", protect, createBooking);

// Step 2: Confirm payment
router.post("/confirm", protect, confirmBooking);

// Cancel booking
router.post("/cancel", protect, cancelBooking);

// Get my bookings
router.get("/mine", protect, getMyBookings);

// Get recent bookings (Admin)
router.get("/recent", protect, getRecentBookings);

// Delete booking
router.delete("/:id", protect, deleteBooking);

// Get single booking by ID
router.get("/:id", protect, getBookingById);

// Check available seats (public)
router.get("/available/:showId", getAvailableSeats);

export default router;