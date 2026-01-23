import express from "express";
import {
  createSession,
  addMessage,
  getConversation,
  getUserSessions,
  deleteSession
} from "../controllers/aiConversationController.js";

const router = express.Router();

// Create a new conversation session
router.post("/create", createSession);

// Add message
router.post("/:sessionId/message", addMessage);

// Get conversation
router.get("/:sessionId", getConversation);

// Get all sessions for a user
router.get("/user/:userId", getUserSessions);

// Delete session
router.delete("/:sessionId", deleteSession);

export default router;
