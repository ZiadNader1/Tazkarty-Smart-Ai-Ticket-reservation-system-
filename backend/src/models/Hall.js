import mongoose from "mongoose";

const hallSchema = new mongoose.Schema(
  {
    venue_id: {  // ✅ Changed from 'venue' to 'venue_id'
      type: mongoose.Schema.Types.ObjectId,
      ref: "Venue"
      // required: true // REMOVED REQUIRED to allow Stadiums
    },
    stadium_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Stadium"
    },
    name: {
      type: String,
      required: true,
    },
    total_rows: {  // ✅ Changed from 'rows' to 'total_rows'
      type: Number,
      required: true,
    },
    total_columns: {  // ✅ Changed from 'columns' to 'total_columns'
      type: Number,
      required: true,
    },
    capacity: {
      type: Number,
      required: true
    },
    seat_categories: [{
      name: String,
      count: Number,
      description: String
    }],
    seat_map_config: { type: Object }, // Store the visual seat map JSON here
    description: String,

    // Stadium Section Fields
    section_side: {
      type: String,
      enum: ['home', 'away', 'neutral', 'vip'],
      default: 'neutral'
    },
    gate: { type: String },
    classification: { type: String }, // e.g. "Cat 1", "VIP"
    base_price: { type: Number } // Default/Base price for this section
  },
  { timestamps: true }
);

export default mongoose.model("Hall", hallSchema);