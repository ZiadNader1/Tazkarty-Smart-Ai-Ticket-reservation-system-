import mongoose from "mongoose";

const ticketSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  show_id: { type: mongoose.Schema.Types.ObjectId, ref: "Show", required: true },

  // مهم جداً: أكتر من كرسي
  seats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Seat", required: true }],

  // سعر التذكرة الواحدة (اختياري)
  price_per_seat: Number,

  // إجمالي السعر (مهم لو عندك 2-3 مقاعد)
  total_price: Number,

  status: {
    type: String,
    enum: ["booked", "cancelled", "pending", "refunded"],
    default: "booked"
  },

  booking_time: { type: Date, default: Date.now },

  // Linking payments
  payment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Payment" },
  promo_code: { type: mongoose.Schema.Types.ObjectId, ref: "PromoCode" },

  isPaid: { type: Boolean, default: false },

  qr_code_url: String
});

export default mongoose.model("Ticket", ticketSchema);
