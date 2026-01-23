import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
  lockSeats,
  unlockSeats,
  getAvailableSeats
} from "../controllers/seatLockController.js";

const router = express.Router();

router.post("/lock", protect, lockSeats);
router.post("/unlock", protect, unlockSeats);
router.get("/available/:showId", getAvailableSeats);

export default router;
