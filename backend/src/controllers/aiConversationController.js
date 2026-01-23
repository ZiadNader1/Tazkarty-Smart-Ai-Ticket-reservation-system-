import AiConversation from "../models/AiConversation.js";
import { generateAIResponse } from "../services/aiService.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Create new AI chat session
 */
export const createSession = async (req, res) => {
  try {
    const { user_id } = req.body;

    const session_id = uuidv4();

    const conversation = await AiConversation.create({
      user_id,
      session_id,
      messages: []
    });

    res.status(201).json({
      message: "Chat session created",
      session_id: conversation.session_id,
      conversation
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Send message and get AI response
 */
export const addMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text, lang = "en" } = req.body;

    // Find conversation
    const conversation = await AiConversation.findOne({
      session_id: sessionId
    });

    if (!conversation) {
      return res.status(404).json({ message: "Session not found" });
    }

    // Add user message
    const userMessage = {
      sender: "user",
      text,
      time: new Date()
    };

    conversation.messages.push(userMessage);

    // Fetch concise event context for AI
    const upcomingShows = await import("../models/Show.js").then(m => m.default.find({
      is_active: true,
      start_time: { $gte: new Date() }
    }).populate("event_id").limit(10).select("title start_time price event_id")); // populate event details

    // Format context
    const eventContext = upcomingShows.map((s, idx) => {
      const evt = s.event_id || {};
      return `${idx + 1}. ${evt.title || s.title} (${evt.type || 'Event'}) - ${new Date(s.start_time).toLocaleString('en-EG')} - Price: ${s.price} EGP`;
    }).join("\n");

    // Add Train Context
    const trainDestinations = ["Alexandria", "Aswan", "Asyuit", "Luxor", "PortSaid"];
    const trainContext = `Train Services:
- Destinations from Cairo: ${trainDestinations.join(", ")}.
- Booking Process: Users can search for trains, view detailed carriage layouts, and select specific seats.
- Carriage Types: We offer different carriage classes (First Class, Second Class, VIP).
- Requirements: National ID is mandatory for all train bookings in Egypt.
- Tickets: Digital tickets with QR codes are issued upon successful payment.
- Guidance: Tell users to visit the 'Trains' section for live schedules and real-time availability.`;

    const systemContext = `Current Website Events:\n${eventContext}\n\n${trainContext}\n\n`;

    // Generate AI response
    const aiResponseText = await generateAIResponse(
      text,
      conversation.messages,
      systemContext,
      lang // Pass lang as fourth arg
    );

    // Add AI message
    const aiMessage = {
      sender: "ai",
      text: aiResponseText,
      time: new Date()
    };

    conversation.messages.push(aiMessage);
    await conversation.save();

    res.json({
      message: "Response generated",
      userMessage,
      aiMessage,
      conversation
    });

  } catch (error) {
    console.error("AI Message Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get conversation history
 */
export const getConversation = async (req, res) => {
  try {
    const conversation = await AiConversation.findOne({
      session_id: req.params.sessionId
    });

    if (!conversation) {
      return res.status(404).json({ message: "Session not found" });
    }

    res.json(conversation);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all user sessions
 */
export const getUserSessions = async (req, res) => {
  try {
    const sessions = await AiConversation.find({
      user_id: req.params.userId
    })
      .select("session_id createdAt updatedAt messages")
      .sort({ updatedAt: -1 });

    const sessionsWithPreview = sessions.map(session => ({
      session_id: session.session_id,
      createdAt: session.createdAt,
      updatedAt: session.updatedAt,
      messageCount: session.messages.length,
      lastMessage: session.messages[session.messages.length - 1] || null
    }));

    res.json(sessionsWithPreview);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Delete session
 */
export const deleteSession = async (req, res) => {
  try {
    await AiConversation.deleteOne({
      session_id: req.params.sessionId
    });

    res.json({ message: "Session deleted" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};