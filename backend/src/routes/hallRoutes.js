import express from "express";
import {
  createHall,
  getHallsByVenue,
  getHallsByStadium,
  getHallById,
  updateHall,
  deleteHall
} from "../controllers/hallController.js";

import { protect, admin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/", protect, admin, createHall);
router.get("/venue/:venueId", getHallsByVenue);
router.get("/stadium/:stadiumId", getHallsByStadium);
router.get("/:id", getHallById);
router.put("/:id", protect, admin, updateHall);
router.delete("/:id", protect, admin, deleteHall);

export default router;
