import Seat from "../models/Seat.js";

// lock seats for 2 minutes
const LOCK_DURATION = 2 * 60 * 1000;

export const lockSeats = async (req, res) => {
  try {
    const { seatIds } = req.body; // array of seat IDs
    const userId = req.user._id;

    const now = new Date();
    const lockUntil = new Date(now.getTime() + LOCK_DURATION);

    const seats = await Seat.find({
      _id: { $in: seatIds },
      status: "available"
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({
        message: "Some seats are not available"
      });
    }

    await Seat.updateMany(
      { _id: { $in: seatIds } },
      {
        status: "locked",
        locked_by: userId,
        locked_until: lockUntil,
      }
    );

    res.json({
      message: "Seats locked successfully",
      lock_expires: lockUntil
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


export const unlockSeats = async (req, res) => {
  try {
    const { seatIds } = req.body;
    const userId = req.user._id;

    await Seat.updateMany(
      {
        _id: { $in: seatIds },
        locked_by: userId,
      },
      {
        status: "available",
        locked_by: null,
        locked_until: null,
      }
    );

    res.json({ message: "Seats unlocked" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// Return only seats available (exclude locked + booked)
export const getAvailableSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const now = new Date();

    // Auto unlock expired locks
    await Seat.updateMany(
      {
        show_id: showId,
        status: "locked",
        locked_until: { $lt: now },
      },
      {
        status: "available",
        locked_by: null,
        locked_until: null,
      }
    );

    const seats = await Seat.find({
      show_id: showId,
      status: { $ne: "booked" },
    }).sort({ row: 1, column: 1 });

    res.json(seats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
