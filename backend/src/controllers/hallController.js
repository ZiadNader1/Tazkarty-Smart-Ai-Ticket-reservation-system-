import Hall from "../models/Hall.js";
import Venue from "../models/Venue.js";

export const createHall = async (req, res) => {

  try {
    const { venue_id, stadium_id, name, total_rows = 20, total_columns = 20, capacity, seat_categories, description,
      section_side, gate, classification, base_price } = req.body;

    if (!venue_id && !stadium_id) {
      console.error("Create Hall Error: Missing venue_id or stadium_id");
      return res.status(400).json({ message: "Venue ID or Stadium ID is required" });
    }

    if (venue_id) {
      const venue = await Venue.findById(venue_id);
      if (!venue) {
        return res.status(404).json({ message: "Venue not found" });
      }
    }
    // TODO: Verify stadium if stadium_id provided. Assuming caller (admin) is valid.

    const hall = await Hall.create({
      venue_id,
      stadium_id,
      name,
      total_rows,
      total_columns,
      capacity: capacity || (total_rows * total_columns),
      seat_categories: seat_categories || [],
      description,
      section_side: section_side || 'neutral',
      gate,
      classification,
      base_price
    });

    // venue.halls is a virtual, no need to push. Relationship is on Hall side.


    res.json({ message: "Hall created successfully", hall });

  } catch (error) {
    console.error("Create Hall Exception:", error);
    res.status(500).json({ message: error.message });
  }
};

export const getHallsByVenue = async (req, res) => {
  try {
    const halls = await Hall.find({ venue_id: req.params.venueId });

    res.json(halls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const getHallsByStadium = async (req, res) => {
  try {
    const halls = await Hall.find({ stadium_id: req.params.stadiumId });
    res.json(halls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHallById = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    res.json(hall);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const updateHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    const updateData = {};

    if (req.body.name) updateData.name = req.body.name;
    if (req.body.total_rows) updateData.total_rows = req.body.total_rows;
    if (req.body.total_columns) updateData.total_columns = req.body.total_columns;
    if (req.body.capacity) updateData.capacity = req.body.capacity;
    if (req.body.seat_categories) updateData.seat_categories = req.body.seat_categories;
    if (req.body.description) updateData.description = req.body.description;

    // Stadium Fields
    if (req.body.section_side) updateData.section_side = req.body.section_side;
    if (req.body.gate) updateData.gate = req.body.gate;
    if (req.body.classification) updateData.classification = req.body.classification;
    if (req.body.base_price !== undefined) updateData.base_price = req.body.base_price;

    // Handle Seat Map Config specifically
    if (req.body.seat_map_config) {
      const config = req.body.seat_map_config;

      // Basic Validation
      if (typeof config !== 'object') {
        return res.status(400).json({ message: "Invalid seat_map_config format" });
      }

      // Ensure essential fields exist if it's a full update
      if (!config.sections || !Array.isArray(config.sections)) {
        return res.status(400).json({ message: "Invalid seat_map_config: 'sections' array is required" });
      }

      updateData.seat_map_config = config;
    }

    // Use $set to update only specified fields


    const updatedHall = await Hall.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true } // Return updated doc
    );



    res.json({ message: "Hall updated successfully", hall: updatedHall });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const deleteHall = async (req, res) => {
  try {
    const hall = await Hall.findById(req.params.id);

    if (!hall) {
      return res.status(404).json({ message: "Hall not found" });
    }

    await hall.deleteOne();

    res.json({ message: "Hall deleted successfully" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
