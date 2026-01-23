import mongoose from "mongoose";
import Hall from "./src/models/Hall.js";
import "dotenv/config";

const dumpHall = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const hallId = "6948717affc6d2899c8b2fa3";
        const hall = await Hall.findById(hallId).lean();
        console.log(JSON.stringify(hall.seat_map_config, null, 2));
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

dumpHall();
