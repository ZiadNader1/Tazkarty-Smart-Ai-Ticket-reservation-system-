import express from "express";

import {
  addSearchEntry,
  getUserSearchHistory,
  deleteSearchEntry,
  clearUserHistory
} from "../controllers/searchHistoryController.js";

const router = express.Router();

// Add entry
router.post("/", addSearchEntry);

// Get a user's history
router.get("/user/:userId", getUserSearchHistory);

// Delete specific entry
router.delete("/:id", deleteSearchEntry);

// Clear all user history
router.delete("/clear/:userId", clearUserHistory);

export default router;
