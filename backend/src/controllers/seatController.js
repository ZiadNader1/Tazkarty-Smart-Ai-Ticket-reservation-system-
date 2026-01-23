import Seat from "../models/Seat.js";
import Show from "../models/Show.js";
import { generateShowSeats } from "../utils/seatGenerator.js";

// Admin – generate seats for a show
export const generateSeatsForShow = async (req, res) => {
  try {
    const { showId } = req.body;

    if (!showId) {
      return res.status(400).json({ message: "showId is required" });
    }

    const show = await Show.findById(showId).populate("hall_id");
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    const hall = show.hall_id;
    if (!hall) {
      return res.status(400).json({ message: "Show has no hall assigned" });
    }

    // ✅ Fixed: use total_rows and total_columns
    const { total_rows, total_columns } = hall;
    if (!total_rows || !total_columns) {
      return res.status(400).json({ message: "Hall has no rows/columns defined" });
    }

    // Check if seats already exist
    const existingSeats = await Seat.find({ show_id: showId });
    if (existingSeats.length > 0) {
      return res.status(400).json({
        message: "Seats already generated for this show",
        total: existingSeats.length,
      });
    }

    // ✅ Generate seats
    const seatsCount = await generateShowSeats(showId, total_rows, total_columns);

    res.json({
      message: "Seats generated successfully",
      total: seatsCount,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// Get seats for a show
export const getSeatsByShow = async (req, res) => {
  try {
    const { showId } = req.params;

    if (!showId) {
      return res.status(400).json({ message: "showId is required" });
    }

    const seats = await Seat.find({ show_id: showId }).sort({
      row: 1,
      column: 1,
    });

    res.json(seats);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};