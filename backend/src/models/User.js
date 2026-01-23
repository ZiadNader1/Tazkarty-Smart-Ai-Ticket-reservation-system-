import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  phone: { type: String },
  national_id: { type: String, sparse: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // Email Verification
  isEmailVerified: { type: Boolean, default: false },
  emailVerificationToken: String,
  emailVerificationExpire: Date,

  // Password Reset
  resetPasswordToken: String,
  resetPasswordExpire: Date,
}, { timestamps: true });

export default mongoose.model("User", userSchema);
