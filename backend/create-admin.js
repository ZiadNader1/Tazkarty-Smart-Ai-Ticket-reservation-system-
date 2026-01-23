import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "./src/models/User.js";
import "dotenv/config";

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const email = "admin@tazkarty.com";
        const password = "admin123";

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email });
        if (existingAdmin) {
            console.log("⚠️ Admin user already exists");
            process.exit();
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create admin user
        const admin = new User({
            name: "Admin User",
            email,
            password: hashedPassword,
            role: "admin",
            isEmailVerified: true, // Auto-verify admin
        });

        await admin.save();
        console.log("🎉 Admin user created successfully!");
        console.log(`📧 Email: ${email}`);
        console.log(`🔑 Password: ${password}`);

    } catch (error) {
        console.error("❌ Error creating admin:", error.message);
    } finally {
        mongoose.disconnect();
    }
};

createAdmin();
