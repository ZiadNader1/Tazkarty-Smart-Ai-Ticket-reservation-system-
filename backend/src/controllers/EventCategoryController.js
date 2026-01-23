import EventCategory from "../models/EventCategory.js";

// =====================
// CREATE CATEGORY
// =====================
export const createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    // check duplicate
    const exists = await EventCategory.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = await EventCategory.create({ name, description });

    res.status(201).json({
      message: "Category created successfully",
      category
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// =====================
// GET ALL CATEGORIES
// =====================
export const getCategories = async (req, res) => {
  try {
    const categories = await EventCategory.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// =====================
// GET CATEGORY BY ID
// =====================
export const getCategoryById = async (req, res) => {
  try {
    const category = await EventCategory.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }
    res.json(category);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// =====================
// UPDATE CATEGORY
// =====================
export const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    const category = await EventCategory.findById(req.params.id);
    if (!category) return res.status(404).json({ message: "Category not found" });

    if (name) category.name = name;
    if (description) category.description = description;

    await category.save();

    res.json({
      message: "Category updated",
      category
    });

  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};


// =====================
// DELETE CATEGORY
// =====================
export const deleteCategory = async (req, res) => {
  try {
    const category = await EventCategory.findByIdAndDelete(req.params.id);

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    res.json({ message: "Category deleted" });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
};
