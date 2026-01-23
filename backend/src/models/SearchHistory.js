import mongoose from "mongoose";

const searchHistorySchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  query: String,
  filters: Object,
  results_count: Number
}, { timestamps: true });

export default mongoose.model("SearchHistory", searchHistorySchema);
