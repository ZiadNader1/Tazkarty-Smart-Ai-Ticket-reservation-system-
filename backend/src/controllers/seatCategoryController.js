import SeatCategory from "../models/SeatCategory.js";

// Create
export const createSeatCategory = async (req, res) => {
  try {
    const category = await SeatCategory.create(req.body);
    res.status(201).json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all
export const getSeatCategories = async (req, res) => {
  try {
    const categories = await SeatCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get by ID
export const getSeatCategoryById = async (req, res) => {
  try {
    const category = await SeatCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Seat category not found" });

    res.json(category);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update
export const updateSeatCategory = async (req, res) => {
  try {
    const updated = await SeatCategory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete
export const deleteSeatCategory = async (req, res) => {
  try {
    await SeatCategory.findByIdAndDelete(req.params.id);
    res.json({ message: "Seat category deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
