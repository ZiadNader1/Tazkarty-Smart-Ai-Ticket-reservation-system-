
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Show from './src/models/Show.js';
import Hall from './src/models/Hall.js';
import Seat from './src/models/Seat.js';

dotenv.config();

async function forceGenerate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // 1. Get Show
        const show = await Show.findOne({ title: { $regex: 'Talents', $options: 'i' } });
        if (!show) { console.log('Show not found'); return; }
        console.log(`Target Show: ${show.title}`);

        // 2. Get Hall
        const hall = await Hall.findById(show.hall_id).lean();
        if (!hall) { console.log('Hall not found'); return; }
        console.log(`Using Hall: ${hall.name}`);

        // 3. Delete parameters
        await Seat.deleteMany({ show_id: show._id });
        console.log('Cleared existing seats.');

        // DROP INDEXES - The Nuclear Option to fix 11000 error
        try {
            await Seat.collection.dropIndexes();
            console.log('✅ Dropped all indexes on Seats collection.');
        } catch (e) {
            console.log('Index drop skipped/failed:', e.message);
        }

        // 4. Generate Schema with Deduplication
        const newSeats = [];
        const seenIds = new Set();
        let duplicates = 0;

        if (hall.seat_map_config && hall.seat_map_config.sections) {
            console.log(`Processing ${hall.seat_map_config.sections.length} sections...`);

            for (const section of hall.seat_map_config.sections) {
                if (!section.rows) continue;
                for (const row of section.rows) {
                    if (!row.seats) continue;
                    const rowLabel = row.label || String(row.index) || "Row";

                    for (const seat of row.seats) {
                        let configId = seat.id;

                        // Sanitize Duplicates
                        if (seenIds.has(configId)) {
                            duplicates++;
                            // Original ID + Random Suffix
                            configId = `${configId}_DUP_${Math.random().toString(36).substr(2, 6)}`;
                        }
                        seenIds.add(configId);

                        newSeats.push({
                            show_id: show._id,
                            seat_config_id: configId, // Deduped ID
                            row: row.index || 0,
                            column: 0,
                            row_label: rowLabel,
                            seat_label: seat.label || "Seat",
                            status: seat.status === 'disabled' ? 'booked' : 'available',
                            price: show.price
                        });
                    }
                }
            }
        }

        console.log(`Generated Memory Seats: ${newSeats.length} (Deduped ${duplicates} IDs)`);

        // 5. Insert
        if (newSeats.length > 0) {
            await Seat.insertMany(newSeats);
            console.log(`✅ SUCCESSFULLY INSERTED ${newSeats.length} SEATS into DB.`);
        } else {
            console.error('❌ Generation produced 0 seats. Check logic.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

forceGenerate();
