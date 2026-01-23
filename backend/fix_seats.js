import mongoose from "mongoose";
import Seat from "./src/models/Seat.js";
import Show from "./src/models/Show.js";
import Hall from "./src/models/Hall.js";
import "dotenv/config";

const fixSeats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const targetShow = await Show.findOne({ title: { $regex: "كلثوم", $options: "i" } });

        if (!targetShow) {
            console.log("Show not found.");
            process.exit(0);
        }

        const count = await Seat.countDocuments({ show_id: targetShow._id });
        console.log(`Seats found for show ${targetShow.title}: ${count}`);

        if (count < 10) {
            console.log("⚠️ Incomplete seat generation detected. Cleaning up and regenerating...");

            // Delete incomplete/orphan seats for this show
            await Seat.deleteMany({ show_id: targetShow._id });
            console.log("Deleted old seats.");

            // Regenerate
            const hall = await Hall.findById(targetShow.hall_id).lean();
            let newSeats = [];
            if (hall.seat_map_config && hall.seat_map_config.sections) {
                for (const section of hall.seat_map_config.sections) {
                    if (!section.rows) continue;
                    section.rows.forEach((row, rowIndex) => {
                        if (!row.seats) return;
                        const rowLabel = row.label || String(rowIndex) || "Row";
                        row.seats.forEach((seat, seatIndex) => {
                            if (!seat) return;
                            newSeats.push({
                                show_id: targetShow._id,
                                seat_config_id: seat.id,
                                row: row.index ?? rowIndex,
                                column: seatIndex, // ✅ Fix: Use unique column index
                                row_label: rowLabel,
                                seat_label: seat.label || "Seat",
                                status: seat.status || 'available',
                                price: targetShow.price
                            });
                        });
                    });
                }
            }

            if (newSeats.length > 0) {
                await Seat.insertMany(newSeats);
                console.log(`✅ Successfully generated ${newSeats.length} seats.`);
            } else {
                console.log("No seats found in config to generate.");
            }
        } else {
            console.log("Seat count looks reasonable. No action taken.");
        }

        process.exit(0);

    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

fixSeats();
