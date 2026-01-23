import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
  createShow,
  getShowById,
  getAllShows, // New
  getShowsByEvent,
  getShowsByVenue,
  updateShow,
  deleteShow
} from "../controllers/showController.js";

import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

// admin only
router.post("/", protect, admin, upload.single('poster'), createShow);
router.put("/:id", protect, admin, upload.single('poster'), updateShow);
router.delete("/:id", protect, admin, deleteShow);

// public
router.get("/", getAllShows); // New: Get All Shows
router.get("/:id", getShowById);
router.get("/event/:eventId", getShowsByEvent);
router.get("/venue/:venueId", getShowsByVenue);

export default router;
