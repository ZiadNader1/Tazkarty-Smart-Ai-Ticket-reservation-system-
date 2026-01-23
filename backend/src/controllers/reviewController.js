import Review from "../models/Review.js";

// Create review
export const createReview = async (req, res) => {
  try {
    const { user_id, event_id, rating, comment } = req.body;

    const review = await Review.create({
      user_id,
      event_id,
      rating,
      comment
    });

    res.status(201).json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all reviews for an event
export const getReviewsByEvent = async (req, res) => {
  try {
    const reviews = await Review.find({ event_id: req.params.eventId })
      .populate("user_id", "name email");

    res.json(reviews);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single review
export const getReviewById = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id)
      .populate("user_id", "name email");

    if (!review) return res.status(404).json({ message: "Review not found" });

    res.json(review);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update review
export const updateReview = async (req, res) => {
  try {
    const updated = await Review.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete review
export const deleteReview = async (req, res) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    res.json({ message: "Review deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
