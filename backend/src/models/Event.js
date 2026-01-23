import mongoose from "mongoose";

const eventSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Event title is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  category_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "EventCategory",
    required: [true, 'Category is required']
  },
  venue_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Venue"
    // Made optional to support Stadiums
  },
  stadium_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Stadium"
  },
  type: {
    type: String,
    enum: ["movie", "concert", "sports", "show", "entertainment", "trains"],
    required: [true, 'Event type is required']
  },
  duration_minutes: {
    type: Number,
    min: [1, 'Duration must be at least 1 minute']
  },
  poster_url: {
    type: String,
    trim: true
  },
  layout_image: { // Optional override for stadium layout
    type: String,
    trim: true
  },
  release_date: Date,
  is_active: {
    type: Boolean,
    default: true
  },

  // Sports/Football Specific Fields
  championship_type: {
    type: String,
    enum: ['League', 'Cup', 'Generic'],
    default: 'Generic' // e.g. "Egyptian Premier League" or "Egypt Cup"
  },
  home_team: { type: String, trim: true },
  away_team: { type: String, trim: true },

  gates_open_at: { type: Date }, // When do gates open?

  // Capacity Management for the Match
  total_capacity: { type: Number }, // Override stadium capacity for this match
  home_capacity: { type: Number }, // Allocated to Home fans
  away_capacity: { type: Number },  // Allocated to Away fans
  is_featured: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Index للبحث السريع
eventSchema.index({ title: 'text', description: 'text' });
eventSchema.index({ category_id: 1, is_active: 1 });
eventSchema.index({ is_featured: 1 });
eventSchema.index({ venue_id: 1 });

export default mongoose.model("Event", eventSchema);