import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: { type: String, enum: ["user", "ai"], required: true },
  text: { type: String, required: true },
  time: { type: Date, default: Date.now }
});

const aiConversationSchema = new mongoose.Schema({
  user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  session_id: { type: String, required: true },
  messages: [messageSchema]
}, { timestamps: true });

export default mongoose.model("AiConversation", aiConversationSchema);
