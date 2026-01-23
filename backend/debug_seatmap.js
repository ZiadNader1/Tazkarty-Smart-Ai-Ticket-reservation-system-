import mongoose from "mongoose";
import Show from "./src/models/Show.js";
import Hall from "./src/models/Hall.js";
import Seat from "./src/models/Seat.js";
import "dotenv/config";

const debugSeatMap = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected");

        // Find the show "Umm Kulthum"
        const show = await Show.findOne({ title: { $regex: "Umm", $options: "i" } }); // English guess
        // Or try Arabic if English fails, but usually internal titles are English or I check all.
        // Let's list all shows first if unclear, but I'll try a broad regex.

        let targetShow = show;
        if (!targetShow) {
            // Try Arabic unique part if I could type it easily, but assume regex matches "Kulthum" or similar if latinsied.
            // Actually, from previous file list, I saw "Omar Khairat", maybe it's that one? 
            // Wait, user screenshot says "حفلة ام كلثوم". 
            // I will search by that string.
            targetShow = await Show.findOne({ title: /كلثوم/ });
        }

        if (!targetShow) {
            console.log("Show not found.");
            // List all to be sure
            const all = await Show.find({}, "title");
            console.log("Available shows:", all.map(s => s.title));
            process.exit(0);
        }

        console.log(`Found Show: ${targetShow.title} (ID: ${targetShow._id})`);
        console.log(`Hall ID: ${targetShow.hall_id}`);

        if (!targetShow.hall_id) {
            console.log("❌ Show has NO Hall ID!");
            process.exit(0);
        }

        const hall = await Hall.findById(targetShow.hall_id).lean();
        if (!hall) {
            console.log("❌ Hall not found!");
            process.exit(0);
        }

        console.log("Hall found:", hall.name);
        console.log("Seat Map Config exists?", !!hall.seat_map_config);

        if (hall.seat_map_config) {
            console.log("Sections:", hall.seat_map_config.sections ? "Found" : "Missing");
            // Simulate the loop that might crash
            try {
                for (const section of hall.seat_map_config.sections) {
                    console.log(`Processing section: ${section.name}`);
                }
            } catch (err) {
                console.error("💥 CRASH processing sections:", err.message);
            }
        } else {
            console.log("No seat_map_config, would use fallback.");
        }

        process.exit(0);

    } catch (error) {
        console.error("Global Error:", error);
        process.exit(1);
    }
};

debugSeatMap();
