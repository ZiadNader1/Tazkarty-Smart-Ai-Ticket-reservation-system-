
import mongoose from 'mongoose';
import 'dotenv/config';
import Show from './src/models/Show.js';
import Seat from './src/models/Seat.js';
import Hall from './src/models/Hall.js';

async function forceGenerate() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        // 1. Find the Show
        // Use the partial ID from user logs/URL: 694871c2ffc6d2899c8b2fe0
        // Or searching by Hall name if needed.
        // Let's search by the ID specifically to be safe.
        const showIdPartial = '694871c2ffc6d2899c8b2fe0';

        const show = await Show.findById(showIdPartial);
        if (!show) {
            console.error('Show not found by ID:', showIdPartial);
            // Fallback to Hall Name search just in case ID is wrong
            const hall = await Hall.findOne({ name: 'Hall test new' });
            if (hall) {
                const s2 = await Show.findOne({ hall_id: hall._id });
                if (s2) {
                    console.log(`Found show via Hall: ${s2._id}`);
                    await processShow(s2, hall);
                } else {
                    console.error('No show found for Hall test new');
                }
            }
            process.exit(1);
        }

        const hall = await Hall.findById(show.hall_id).lean(); // Use lean!
        if (!hall) throw new Error('Hall not found');

        console.log(`Target Show: ${show.title} (${show._id})`);
        console.log(`Target Hall: ${hall.name}`);

        await processShow(show, hall);

        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

async function processShow(show, hall) {
    // 2. Clear Existing Seats
    console.log('Deleting existing seats...');
    await Seat.deleteMany({ show_id: show._id });

    // 3. Generate New Seats from Config
    const newSeats = [];

    if (hall.seat_map_config && hall.seat_map_config.sections) {
        console.log('Generating seats from Config...');
        let globalRowCounter = 0;
        console.log(`Generating seats from Config. Section Count: ${hall.seat_map_config.sections.length}`);
        for (const section of hall.seat_map_config.sections) {
            if (!section.rows) {
                console.log(`Skipping section ${section.id} (No rows)`);
                continue;
            }
            console.log(`Processing Section ${section.id}: ${section.rows.length} rows`);

            for (const row of section.rows) {
                globalRowCounter++; // Ensure unique row ID per line
                if (!row.seats) continue;
                const rowLabel = row.label || String(row.index) || "Row";

                let colIndex = 0; // Reset per row, or keep global?
                // The unique index is likely show_id + row + column. 
                // If 'row' is the row INDEX (0, 1, 2), then 'column' must be unique per row.

                for (const seat of row.seats) {
                    colIndex++; // 1-based column index
                    // LOG EVERY 50th seat to debug ID matching
                    if (newSeats.length % 50 === 0) console.log(`Sample Generated ID: ${seat.id}`);

                    newSeats.push({
                        show_id: show._id,
                        seat_config_id: seat.id, // THE CRITICAL FIELD
                        row: globalRowCounter, // Unique Row
                        column: colIndex,    // Unique column number
                        row_label: rowLabel,
                        seat_label: seat.label || "Seat",
                        status: seat.status || 'available',
                        price: show.price
                    });
                }
            }
        }
    }

    if (newSeats.length > 0) {
        console.log(`Inserting ${newSeats.length} seats...`);
        await Seat.insertMany(newSeats);
        console.log('✅ Success! Database updated.');
    } else {
        console.error('❌ No seats generated! Check Hall Config structure.');
        console.log('Config:', JSON.stringify(hall.seat_map_config, null, 2));
    }
}

forceGenerate();
