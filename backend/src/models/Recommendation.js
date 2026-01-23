import mongoose from "mongoose";

const recItemSchema = new mongoose.Schema({
  item_id: { type: mongoose.Schema.Types.ObjectId, required: true },
  item_type: { type: String, default: "event" }, // event, concert, etc.
  score: { type: Number, required: true },
  reason: { type: String } // optional short explanation why recommended
});

const recommendationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  recommendations: [recItemSchema]
}, { timestamps: true });

export default mongoose.model("Recommendation", recommendationSchema);
