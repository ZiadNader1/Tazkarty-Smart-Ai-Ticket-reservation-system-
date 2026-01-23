import mongoose from "mongoose";
import Show from "../models/Show.js";

/** Create Show */
export const createShow = async (req, res) => {
  try {

    const showData = { ...req.body };
    if (req.file) {
      showData.poster_url = `uploads/${req.file.filename}`;
    }

    const show = await Show.create(showData);
    res.status(201).json(show);
  } catch (err) {
    console.error("Create Show Error:", err);
    res.status(500).json({ message: err.message, detailed: err });
  }
};

/** Get show by ID */
export const getShowById = async (req, res) => {
  try {
    const show = await Show.findById(req.params.id)
      .populate({
        path: "event_id",
        populate: { path: "stadium_id" }
      })

      .populate({
        path: "hall_id",
        populate: { path: "venue_id" }
      });

    if (!show) return res.status(404).json({ message: "Show not found" });

    res.json(show);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get ALL shows (for Admin Global View & Public Listing) */
export const getAllShows = async (req, res) => {
  try {
    const { category, search, venue } = req.query;
    let query = { is_active: true };

    // 1. Text Search (Title or Event Title)
    // Note: Complex because title can be on Show OR Event.
    // For simplicity, we'll filter in memory or do two queries.
    // Let's rely on basic population filtering.

    // 2. Category Filter
    // If 'entertainment', we want everything NOT sports.
    // If specific ID, we want that.

    // We need to find matching Events first if we filter by category/search
    let eventQuery = {};
    let filterByEvent = false;

    if (category) {
      filterByEvent = true;
      if (category.toLowerCase() === 'entertainment') {
        const sportsCat = await mongoose.model('EventCategory').findOne({ name: 'Sports' });
        if (sportsCat) {
          eventQuery.category_id = { $ne: sportsCat._id };
          eventQuery.type = { $ne: 'sports' };
        }
      } else if (mongoose.Types.ObjectId.isValid(category)) {
        eventQuery.category_id = category;
      }
    }

    if (search) {
      filterByEvent = true;
      const searchRegex = new RegExp(search.trim(), 'i');
      eventQuery.$or = [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } }
      ];
    }

    if (venue) {
      query['hall_id'] = { $in: await mongoose.model('Hall').find({ venue_id: venue }).distinct('_id') };
    }

    let matchingEventIds = null;
    if (filterByEvent) {
      matchingEventIds = await mongoose.model('Event').find(eventQuery).distinct('_id');
    }

    // Construct Show Query
    if (matchingEventIds !== null) {
      // Include shows with matching events OR independent shows (if looking for entertainment)
      if (category && category.toLowerCase() === 'entertainment') {
        query.$or = [
          { event_id: { $in: matchingEventIds } },
          { event_id: null },
          { event_id: { $exists: false } } // Independent shows
        ];
      } else {
        query.event_id = { $in: matchingEventIds };
      }
    }

    // 4. Text Search (Title)
    if (search) {
      query.title = { $regex: search, $options: 'i' };
      // Note: To search independent shows by title, this works.
      // To search event-linked shows by event title, we rely on matchingEventIds above (if we added search there).
    }

    // 5. Sorting
    let sortOptions = { start_time: 1 }; // Default: Date (Soonest first)
    // The query param might come as 'sort=price_asc' etc.
    if (req.query.sort) {
      if (req.query.sort === 'price_asc') sortOptions = { price: 1 };
      else if (req.query.sort === 'price_desc') sortOptions = { price: -1 };
      else if (req.query.sort === 'date') sortOptions = { start_time: 1 }; // Newest/Soonest
    }

    const shows = await Show.find(query)
      .populate("event_id")
      .populate({
        path: "hall_id",
        populate: { path: "venue_id" } // Deep populate Venue for location display
      })
      .sort(sortOptions);

    res.json(shows);
  } catch (err) {
    console.error("Get All Shows Error:", err);
    res.status(500).json({ message: err.message });
  }
};

/** Get shows by event */
export const getShowsByEvent = async (req, res) => {
  try {
    const shows = await Show.find({ event_id: req.params.eventId })
      .populate("hall_id");

    res.json(shows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Get shows by venue */
export const getShowsByVenue = async (req, res) => {
  try {
    const shows = await Show.find()
      .populate({
        path: "hall_id",
        match: { venue_id: req.params.venueId }
      })
      .populate("event_id");

    const filtered = shows.filter(s => s.hall_id !== null);

    res.json(filtered);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Update show */
export const updateShow = async (req, res) => {
  try {
    const updateData = { ...req.body };
    if (req.file) {
      updateData.poster_url = `uploads/${req.file.filename}`;
    }

    const updated = await Show.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/** Delete show */
export const deleteShow = async (req, res) => {
  try {
    await Show.findByIdAndDelete(req.params.id);
    res.json({ message: "Show deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
