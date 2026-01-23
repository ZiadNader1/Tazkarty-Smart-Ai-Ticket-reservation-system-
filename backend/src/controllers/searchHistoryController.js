import SearchHistory from "../models/SearchHistory.js";

// Create search entry
export const addSearchEntry = async (req, res) => {
  try {
    const entry = await SearchHistory.create(req.body);
    res.status(201).json(entry);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all searches for a user
export const getUserSearchHistory = async (req, res) => {
  try {
    const history = await SearchHistory.find({ user_id: req.params.userId })
      .sort({ createdAt: -1 });

    res.status(200).json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete one search entry
export const deleteSearchEntry = async (req, res) => {
  try {
    await SearchHistory.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Search entry deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Clear all history for a user
export const clearUserHistory = async (req, res) => {
  try {
    await SearchHistory.deleteMany({ user_id: req.params.userId });
    res.status(200).json({ message: "User search history cleared" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
