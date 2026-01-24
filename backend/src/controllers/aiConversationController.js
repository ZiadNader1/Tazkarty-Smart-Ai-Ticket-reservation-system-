import AiConversation from "../models/AiConversation.js";
import { generateAIResponse } from "../services/aiService.js";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from 'url';
import Show from "../models/Show.js";
import Event from "../models/Event.js";
import Venue from "../models/Venue.js";
import Stadium from "../models/Stadium.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


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

    // Fetch comprehensive event context for AI
    // 1. Get upcoming shows
    let upcomingShows = await Show.find({
      start_time: { $gte: new Date() }
    })
      .populate({
        path: 'event_id',
        populate: [
          { path: 'venue_id', select: 'name address' },
          { path: 'stadium_id', select: 'name city' }
        ]
      })
      .limit(10)
      .lean();

    // 2. Also get general upcoming events (especially sports) that might not have a "Show" yet
    const upcomingEvents = await Event.find({
      release_date: { $gte: new Date() }
    })
      .populate('stadium_id', 'name city')
      .populate('venue_id', 'name address')
      .limit(10)
      .lean();

    // Combine and format
    let eventEntries = [];

    // Format Shows
    upcomingShows.forEach((s, idx) => {
      const evt = s.event_id || {};
      let title = evt.title || s.title || 'Event';
      if (evt.type === 'sports' && evt.home_team && evt.away_team) {
        title = `MATCH: ${evt.home_team} vs ${evt.away_team} (${evt.championship_type || 'Tournament'})`;
      }
      const venue = evt.stadium_id?.name || evt.venue_id?.name || s.hall_id?.name || "Official Venue";
      const time = new Date(s.start_time).toLocaleString('en-EG', { dateStyle: 'medium', timeStyle: 'short' });
      eventEntries.push(`${title} - Venue: ${venue} - Time: ${time} - Price: ${s.price} EGP`);
    });

    // Format Events (avoid duplicates if already in shows)
    upcomingEvents.forEach(evt => {
      const alreadyAdded = upcomingShows.some(s => s.event_id?._id?.toString() === evt._id.toString());
      if (!alreadyAdded) {
        let title = evt.title || 'Upcoming Event';
        if (evt.type === 'sports' && evt.home_team && evt.away_team) {
          title = `MATCH: ${evt.home_team} vs ${evt.away_team} (${evt.championship_type || 'Upcoming'})`;
        }
        const venue = evt.stadium_id?.name || evt.venue_id?.name || "TBA";
        const time = new Date(evt.release_date).toLocaleString('en-EG', { dateStyle: 'medium', timeStyle: 'short' });
        eventEntries.push(`${title} - Venue: ${venue} - Date: ${time} (Check site for showtimes)`);
      }
    });

    const eventContext = eventEntries.length > 0
      ? eventEntries.map((entry, i) => `${i + 1}. ${entry}`).join("\n")
      : "No upcoming events or matches found in the database. Tell users to check again soon!";

    // Add Train Context (Dynamic & Bilingual)
    const trainDestinations = [
      { id: "Alexandria", keywords: ["alexandria", "alex", "اسكندرية", "الإسكندرية", "إسكندرية"] },
      { id: "Aswan", keywords: ["aswan", "أسوان", "اسوان"] },
      { id: "Asyuit", keywords: ["asyuit", "أسيوط", "اسيوط"] },
      { id: "Luxor", keywords: ["luxor", "الأقصر", "الاقصر"] },
      { id: "PortSaid", keywords: ["portsaid", "بورسعيد", "بور سعيد"] }
    ];

    const trainKeywords = ["train", "قطار", "قطارات", "القطار"];
    let trainContext = `Available Destinations from Cairo: Alexandria, Aswan, Asyuit, Luxor, PortSaid.`;

    // Proactively fetch train schedules if user asks about trains or a destination
    const lowerText = text.toLowerCase();

    // Check current message for destination
    let matchedDest = trainDestinations.find(d =>
      d.keywords.some(k => lowerText.includes(k.toLowerCase()))
    );

    // If not found in current message, look back at last 2-3 messages in history
    if (!matchedDest && conversation.messages.length > 0) {
      for (const msg of conversation.messages.slice(-3).reverse()) {
        const historyLower = msg.text.toLowerCase();
        matchedDest = trainDestinations.find(d =>
          d.keywords.some(k => historyLower.includes(k.toLowerCase()))
        );
        if (matchedDest) break;
      }
    }

    const isAskingAboutTrains = trainKeywords.some(k => lowerText.includes(k)) || matchedDest;

    if (isAskingAboutTrains) {
      try {
        const targetDest = matchedDest ? matchedDest.id : "Alexandria"; // Default to Alex if just 'train'
        const trainFileName = `cairo_to_${targetDest.toLowerCase()}.json`;
        const trainPath = path.join(__dirname, '../../uploads', trainFileName);
        const trainData = JSON.parse(await fs.readFile(trainPath, 'utf8'));

        // Give AI a slice of schedules (up to 20 trains for better coverage)
        const scheduleSlice = trainData.slice(0, 20).map(t =>
          `Train #${t.train_number} (${t.train_type}): Departs ${t.departure_time}, Arrives ${t.arrival_time}`
        ).join("\n");

        trainContext = `REAL-TIME SCHEDULES FOR CAIRO TO ${targetDest.toUpperCase()}:\n${scheduleSlice}\n(Note: If the user didn't specify a destination, I showed Alexandria as an example. Tell them to specify their destination!)`;
      } catch (err) {
        console.warn("Could not load train schedules for AI context:", err.message);
      }
    }

    const systemContext = `
    ### NADA'S OPERATIONAL PROTOCOL ###
    1. IDENTITY: You are "Nada", a proud member of the Tazkarty Team.
    2. LOYALTY: NEVER ever say "book from other websites" or "go to the station". Everything is available HERE on Tazkarty.
    3. GUIDANCE: If a user asks how to book, say: "You can book directly by clicking on 'Trains' or 'Events' in the menu above!"
    4. DATA SUPREMACY: Use ONLY the Provided Data. If a train is in the list, it is current and bookable on Tazkarty.
    5. SALES FOCUS: If they like a train or event, say: "That's a great choice! Should I help you pick your seat on Tazkarty now?"
    
    ### PROVIDED DATA ###
    - EVENTS & MATCHES:
    ${eventContext}
    
    - TRAIN SCHEDULES:
    ${trainContext}
    `;


    // Generate AI response
    const aiResponseText = await generateAIResponse(
      text,
      conversation.messages,
      systemContext,
      lang
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