import mongoose from "mongoose";
import Seat from "./src/models/Seat.js";
import "dotenv/config";

const checkSeat = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected");

        const targetId = "c963df2e-b8b5-49dd-af24-210ce2b0e781";
        
        // Exact match check
        const seat = await Seat.findOne({ seat_config_id: targetId });
        
        if (!seat) {
            console.log("❌ Seat NOT found by seat_config_id.");
            // Try by _id just in case
            if (mongoose.Types.ObjectId.isValid(targetId)) {
                 const seatById = await Seat.findById(targetId);
                 if (seatById) console.log("Found by ObjectId:", seatById);
            }
        } else {
            console.log("Found Seat:", JSON.stringify(seat, null, 2));
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkSeat();
