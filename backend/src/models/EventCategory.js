import mongoose from "mongoose";

const eventCategorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  icon: String,
  description: String
});

export default mongoose.model("EventCategory", eventCategorySchema);
