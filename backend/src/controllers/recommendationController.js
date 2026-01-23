import Recommendation from "../models/Recommendation.js";
import Event from "../models/Event.js";
import SearchHistory from "../models/SearchHistory.js";
import Ticket from "../models/Ticket.js";
import Review from "../models/Review.js";
import mongoose from "mongoose";

/**
 * Helper: Collect user signals
 */
async function collectUserSignals(userId) {
  const searches = await SearchHistory.find({ user_id: userId }).limit(200).lean();
  const queries = searches.map(s => (s.query || "").toLowerCase());

  const tickets = await Ticket.find({ user_id: userId }).lean();
  const bookedEventIds = tickets.map(t => t.show_id || t.event_id).filter(Boolean);

  const reviews = await Review.find({ user_id: userId }).lean();
  const reviewedEventIds = reviews.map(r => r.event_id && r.event_id.toString()).filter(Boolean);

  const keywords = queries
    .map(q => q.split(/\s+/))
    .flat()
    .filter(Boolean);

  return {
    searches,
    queries,
    keywords,
    bookedEventIds,
    reviewedEventIds
  };
}

/**
 * Score event for user
 */
function scoreEventForUser(event, signals) {
  const title = (event.title || "").toLowerCase();
  const desc = (event.description || "").toLowerCase();
  const eventCategory = (event.category_id && event.category_id.toString()) || "";

  // CONTENT SCORE
  let contentScore = 0;
  const categoryMatch = signals.keywords.some(k => {
    if (!k) return false;
    return title.includes(k) || desc.includes(k);
  });

  if (categoryMatch) contentScore += 0.6;
  contentScore = Math.min(1, contentScore + 0.4);

  // SEARCH SCORE
  let searchMatches = 0;
  for (const k of signals.keywords) {
    if (!k) continue;
    if (title.includes(k) || desc.includes(k)) searchMatches++;
  }
  const searchScore = Math.min(1, searchMatches / Math.max(1, Math.min(10, signals.keywords.length)));

  // BEHAVIOR SCORE
  let behaviorScore = 0;
  const eventIdStr = String(event._id);
  if (signals.bookedEventIds.map(String).includes(eventIdStr)) behaviorScore = 1;
  else if (signals.reviewedEventIds.map(String).includes(eventIdStr)) behaviorScore = 0.9;

  const finalScore = (contentScore * 0.5) + (searchScore * 0.3) + (behaviorScore * 0.2);
  return {
    finalScore,
    subScores: { contentScore, searchScore, behaviorScore }
  };
}

/**
 * Generate recommendations
 */
export const generateRecommendations = async (req, res) => {
  try {
    const userId = req.params.userId;
    const limit = parseInt(req.query.limit || "10", 10);

    const signals = await collectUserSignals(userId);
    signals.keywords = Array.from(new Set((signals.keywords || []).map(k => k.toLowerCase()))).slice(0, 50);

    const candidates = await Event.find({ is_active: { $ne: false } })
      .select("title description category_id type")
      .lean()
      .limit(1000);

    const scored = candidates.map(ev => {
      const { finalScore, subScores } = scoreEventForUser(ev, signals);
      return {
        event: ev,
        score: finalScore,
        subScores
      };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, limit);

    // ✅ Fixed ObjectId usage
    const recDoc = {
      user_id: new mongoose.Types.ObjectId(userId),
      recommendations: top.map(t => ({
        item_id: t.event._id,
        item_type: "event",
        score: t.score,
        reason: `content:${t.subScores.contentScore.toFixed(2)} search:${t.subScores.searchScore.toFixed(2)} behavior:${t.subScores.behaviorScore.toFixed(2)}`
      }))
    };

    await Recommendation.findOneAndUpdate(
      { user_id: userId },
      recDoc,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    const eventIds = top.map(t => t.event._id);
    const events = await Event.find({ _id: { $in: eventIds } })
      .select("title category_id type")
      .lean();

    const response = top.map(t => {
      const ev = events.find(e => String(e._id) === String(t.event._id));
      return {
        event: ev,
        score: t.score,
        reason: `content:${t.subScores.contentScore.toFixed(2)} search:${t.subScores.searchScore.toFixed(2)} behavior:${t.subScores.behaviorScore.toFixed(2)}`
      };
    });

    res.json({ recommendations: response });
  } catch (error) {
    console.error("Recommendation error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get saved recommendations
 */
export const getUserRecommendations = async (req, res) => {
  try {
    const rec = await Recommendation.findOne({ user_id: req.params.userId }).lean();
    if (!rec) return res.status(404).json({ message: "No recommendations found" });

    const ids = rec.recommendations.map(r => r.item_id);
    const events = await Event.find({ _id: { $in: ids } })
      .select("title category_id type")
      .lean();

    const items = rec.recommendations.map(r => ({
      item: events.find(e => String(e._id) === String(r.item_id)),
      score: r.score,
      reason: r.reason
    }));

    res.json({ recommendations: items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Clear recommendations
 */
export const clearRecommendations = async (req, res) => {
  try {
    await Recommendation.deleteOne({ user_id: req.params.userId });
    res.json({ message: "Recommendations cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};