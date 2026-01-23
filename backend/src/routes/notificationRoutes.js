import express from "express";

import {
  createNotification,
  getUserNotifications,
  markAsRead,
  deleteNotification
} from "../controllers/notificationController.js";

const router = express.Router();

// Create
router.post("/", createNotification);

// Get all for a user
router.get("/user/:userId", getUserNotifications);

// Mark as read
router.put("/read/:id", markAsRead);

// Delete
router.delete("/:id", deleteNotification);

export default router;
