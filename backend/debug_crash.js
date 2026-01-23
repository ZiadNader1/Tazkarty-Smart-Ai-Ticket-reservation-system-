import mongoose from "mongoose";
import Show from "./src/models/Show.js";
import Hall from "./src/models/Hall.js";
import Seat from "./src/models/Seat.js";
import "dotenv/config";

const simulateCrash = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const targetShow = await Show.findOne({ title: { $regex: "كلثوم", $options: "i" } });
        if (!targetShow) throw new Error("Show not found");

        const hall = await Hall.findById(targetShow.hall_id).lean();
        if (!hall) throw new Error("Hall not found");

        console.log("Simulating generation...");
        let newSeats = [];

        if (hall.seat_map_config && hall.seat_map_config.sections) {
            for (const section of hall.seat_map_config.sections) {
                if (!section.rows) continue;
                for (const row of section.rows) {
                    if (!row.seats) continue;
                    const rowLabel = row.label || String(row.index) || "Row";

                    for (const seat of row.seats) {
                        // potential crash point if seat is null/malformed?
                        if (!seat) {
                            console.log("Found null seat!");
                            continue;
                        }
                        newSeats.push({
                            show_id: targetShow._id, // Use real show ID
                            seat_config_id: seat.id,
                            row: row.index || 0,
                            column: 0,
                            row_label: rowLabel,
                            seat_label: seat.label || "Seat",
                            status: seat.status || 'available',
                            price: targetShow.price
                        });
                    }
                }
            }
        }

        console.log(`Generated ${newSeats.length} seats.`);

        // Test Validation (validateSync)
        for (const s of newSeats) {
            const doc = new Seat(s);
            const err = doc.validateSync();
            if (err) {
                console.error("Validation Error:", err.message);
                console.log("Invalid Seat:", s);
                process.exit(1);
            }
        }
        console.log("✅ Validation passed.");

        // Try Insert? Be careful not to duplicate if they exist now.
        // The controller only inserts if (seats.length === 0).
        // Check if seats exist now.
        const count = await Seat.countDocuments({ show_id: targetShow._id });
        console.log(`Existing seats for show: ${count}`);

        if (count === 0) {
            console.log("Inserting seats...");
            await Seat.insertMany(newSeats);
            console.log("✅ Insert succeeded.");
        } else {
            console.log("Skipping insert (seats already exist).");
        }

        process.exit(0);

    } catch (error) {
        console.error("💥 CRASH:", error);
        process.exit(1);
    }
};

simulateCrash();
