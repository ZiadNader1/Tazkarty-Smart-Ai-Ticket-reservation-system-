import mongoose from "mongoose";
import Seat from "./src/models/Seat.js";
import "dotenv/config";

const checkIndexes = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const indexes = await Seat.collection.getIndexes();
        console.log("Indexes:", JSON.stringify(indexes, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkIndexes();
