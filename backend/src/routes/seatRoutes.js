// src/routes/seatRoutes.js
import express from "express";
import { protectAdmin } from "../middleware/adminMiddleware.js";
import { 
  generateSeatsForShow, 
  getSeatsByShow 
} from "../controllers/seatController.js";

const router = express.Router();

// Generate seats for a show (Admin Only)
router.post("/generate", protectAdmin, generateSeatsForShow);

// Get all seats for a specific show
router.get("/show/:showId", getSeatsByShow);

export default router;
