import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";

import {
    createVenue,
    getVenues,
    getVenueById,
    updateVenue,
    deleteVenue
} from "../controllers/venueController.js";

const router = express.Router();

// CRUD
router.post("/", protect, admin, createVenue);
router.get("/", getVenues);
router.get("/:id", getVenueById);
router.put("/:id", protect, admin, updateVenue);
router.delete("/:id", protect, admin, deleteVenue);

export default router;
