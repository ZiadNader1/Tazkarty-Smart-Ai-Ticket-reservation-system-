import mongoose from "mongoose";

const showSchema = new mongoose.Schema({
  event_id: { type: mongoose.Schema.Types.ObjectId, ref: "Event" }, // Optional now
  title: { type: String }, // Optional direct title (e.g. for standalone shows)
  hall_id: { type: mongoose.Schema.Types.ObjectId, ref: "Hall", required: true },
  start_time: { type: Date, required: true },
  end_time: { type: Date, required: true },
  price: { type: Number, required: true },
  available_seats: { type: Number },
  total_seats: { type: Number },
  is_active: { type: Boolean, default: true },
  poster_url: { type: String } // New: Custom poster for the show
}, { timestamps: true });

export default mongoose.model("Show", showSchema);
