import mongoose from "mongoose";
import Venue from "./src/models/Venue.js";
import "dotenv/config";

const checkVenues = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        const venues = await Venue.find({});
        console.log(`🏟️ Found ${venues.length} venues in DB`);
        venues.forEach(v => {
            console.log(`- ${v.name} (Active: ${v.is_active})`);
        });

        process.exit(0);
    } catch (error) {
        console.error("❌ Error checking venues:", error.message);
        process.exit(1);
    }
};

checkVenues();
