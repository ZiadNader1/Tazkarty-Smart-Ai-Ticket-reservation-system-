import mongoose from "mongoose";

const paymentSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  ticket_id: { type: mongoose.Schema.Types.ObjectId, ref: "Ticket", required: true },
  amount: { type: Number, required: true },
  method: { type: String, required: true },
  status: { type: String, enum: ["pending", "paid", "failed"], default: "pending" },
  transaction_id: String
}, { timestamps: true });

export default mongoose.model("Payment", paymentSchema);
