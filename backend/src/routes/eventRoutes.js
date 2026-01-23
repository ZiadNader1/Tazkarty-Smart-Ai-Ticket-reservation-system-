import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

import {
    createEvent,
    getEvents,
    getEventById,
    updateEvent,
    deleteEvent
} from "../controllers/eventController.js";

const router = express.Router();

// Admin CRUD for Events
const eventUploads = upload.fields([
    { name: 'poster', maxCount: 1 },
    { name: 'layout_image', maxCount: 1 }
]);

router.post("/", protect, admin, eventUploads, createEvent);
router.get("/", getEvents);
router.get("/:id", getEventById);
router.put("/:id", protect, admin, eventUploads, updateEvent);
router.delete("/:id", protect, admin, deleteEvent);

export default router;
