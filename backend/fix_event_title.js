import mongoose from "mongoose";
import Show from "./src/models/Show.js";
import "dotenv/config";

const forceFix = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected");

        const targetId = "69488fae61bb82b4ac41ea55";
        await Show.findByIdAndUpdate(targetId, { title: "Al Ahly vs Zamalek" });

        console.log("✅ Force updated show title.");
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

forceFix();
