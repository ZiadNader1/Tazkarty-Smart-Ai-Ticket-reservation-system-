
import mongoose from 'mongoose';
import Venue from './src/models/Venue.js';
import 'dotenv/config';

console.log("Checking venues...");
console.log("MONGO_URI:", process.env.MONGO_URI);

async function check() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to DB");

        const venues = await Venue.find({});
        console.log(`Found ${venues.length} venues.`);
        venues.forEach(v => console.log(`- ${v.name} (${v.location}) [Active: ${v.is_active}]`));

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.disconnect();
    }
}

check();
