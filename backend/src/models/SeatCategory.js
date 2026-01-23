import mongoose from "mongoose";

const seatCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },        // VIP, Regular, ...
  price_multiplier: { type: Number, default: 1 }, // 1 = normal price, 1.5 = VIP
  description: String
}, { timestamps: true });

export default mongoose.model("SeatCategory", seatCategorySchema);
