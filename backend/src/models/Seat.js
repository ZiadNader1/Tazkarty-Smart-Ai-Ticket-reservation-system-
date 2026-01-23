import mongoose from "mongoose";

const seatSchema = new mongoose.Schema(
  {
    show_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Show",
      ref: "Show",
      required: true,
    },

    seat_config_id: { type: String, default: null }, // Maps to frontend seat map config ID

    row: {
      type: Number,
      required: true,
    },
    row_label: { type: String, required: true }, // e.g. "A"

    column: {
      type: Number,
      required: true,
    },
    seat_label: { type: String, required: true }, // e.g. "1" or "A5"

    status: {
      type: String,
      enum: ["available", "locked", "booked", "gap", "blocked", "maintenance", "disabled"],  // ✅ Added all statuses
      default: "available",
    },

    // ✅ Added for seat locking feature
    locked_by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },

    locked_until: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

const Seat = mongoose.model("Seat", seatSchema);
export default Seat;