import mongoose from "mongoose";

const venueSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Venue name is required'],
    trim: true,
    unique: true
  },
  location: {
    type: String,
    required: [true, 'Location is required'],
    trim: true
  },
  city: {
    type: String,
    required: [true, 'City is required'],
    trim: true
  },
  capacity: {
    type: Number,
    min: [1, 'Capacity must be at least 1']
  },
  image: {
    type: String,
    trim: true
  },
  layout_image: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  is_active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual للـ halls
venueSchema.virtual('halls', {
  ref: 'Hall',
  localField: '_id',
  foreignField: 'venue_id'
});

// Index للبحث
venueSchema.index({ name: 'text', location: 'text' });

export default mongoose.model("Venue", venueSchema);