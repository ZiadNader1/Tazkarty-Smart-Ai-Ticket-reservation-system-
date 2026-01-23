import mongoose from "mongoose";
import "dotenv/config";
import Show from "./src/models/Show.js";
import Seat from "./src/models/Seat.js";
import Hall from "./src/models/Hall.js";

const resetSeats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // 1. Find Show
        let show = await Show.findOne({ title: { $regex: 'Cairokee', $options: 'i' } });
        if (!show) show = await Show.findOne({ title: { $regex: 'كايروكي', $options: 'i' } });

        if (!show) {
            console.error("❌ Show not found!");
            process.exit(1);
        }
        console.log(`🎤 Show: ${show.title} (${show._id})`);

        // 2. Delete ALL existing seats for this show
        const deleteResult = await Seat.deleteMany({ show_id: show._id });
        console.log(`🗑️ Deleted ${deleteResult.deletedCount} existing (potentially corrupt) seats.`);

        // 3. Find Hall Config
        const hall = await Hall.findById(show.hall_id).lean();
        if (!hall || !hall.seat_map_config) {
            console.error("❌ Hall Config missing!");
            process.exit(1);
        }
        console.log(`🏟️ Using Hall: ${hall.name}`);

        // 4. Regenerate Seats from Config
        const newSeats = [];
        if (hall.seat_map_config.sections) {
            hall.seat_map_config.sections.forEach(section => {
                if (section.rows) {
                    section.rows.forEach((row, rowIndex) => {
                        // Use strict index if available, else generated map index?
                        // IMPORTANT: The frontend Canvas uses seat.id from config as its identifier.
                        // We MUST map that to seat_config_id.
                        const rIndex = (row.index !== undefined && row.index !== null) ? row.index : rowIndex;

                        if (row.seats) {
                            row.seats.forEach((seat, seatIndex) => {
                                newSeats.push({
                                    show_id: show._id,
                                    seat_config_id: seat.id,
                                    row: rIndex,         // FALLBACK APPLIED
                                    column: seatIndex,
                                    row_label: row.label || "Row",
                                    seat_label: seat.label || "Seat",
                                    status: 'available',
                                    price: show.price
                                });
                            });
                        }
                    });
                }
            });
        }

        if (newSeats.length > 0) {
            await Seat.insertMany(newSeats);
            console.log(`✨ Regenerated ${newSeats.length} clean seats.`);
        } else {
            console.warn("⚠️ No seats found in Hall Config!");
        }

        process.exit(0);

    } catch (error) {
        console.error("❌ Error:", error);
        process.exit(1);
    }
};

resetSeats();
