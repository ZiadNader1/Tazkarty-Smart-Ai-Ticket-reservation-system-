import mongoose from "mongoose";

const adminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, enum: ["super_admin", "manager", "editor"], default: "manager" }
}, { timestamps: true });

export default mongoose.model("Admin", adminSchema);
