import mongoose from "mongoose";
import Show from "./src/models/Show.js";
import "dotenv/config";

const listShows = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected");

        const shows = await Show.find({}, "title _id");
        console.log("All Shows:", JSON.stringify(shows, null, 2));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

listShows();
