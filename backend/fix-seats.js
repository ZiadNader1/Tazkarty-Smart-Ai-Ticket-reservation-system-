
import mongoose from 'mongoose';
import 'dotenv/config';
import Show from './src/models/Show.js';
import Seat from './src/models/Seat.js';
import Hall from './src/models/Hall.js';

async function fixSeats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const shows = await Show.find().populate('hall_id');
        console.log(`Found ${shows.length} shows.`);

        for (const show of shows) {
            if (!show.hall_id) continue;

            const hall = show.hall_id;
            // Check if Hall has new config
            if (hall.seat_map_config && hall.seat_map_config.sections) {
                console.log(`Checking Show ${show._id} (Hall: ${hall.name})...`);

                // Check seats
                const seats = await Seat.find({ show_id: show._id });
                const legacySeats = seats.filter(s => !s.seat_config_id);

                if (legacySeats.length > 0 && legacySeats.length === seats.length) {
                    console.log(`⚠️ Show ${show._id} has ${legacySeats.length} legacy seats. PURGING to allow regeneration...`);
                    await Seat.deleteMany({ show_id: show._id });
                    console.log(`✅ Deleted seats for Show ${show._id}. Refresh page to regenerate.`);
                } else if (legacySeats.length > 0) {
                    console.log(`⚠️ Show ${show._id} has partial legacy seats (${legacySeats.length}). PURGING all...`);
                    await Seat.deleteMany({ show_id: show._id });
                } else {
                    console.log(`✅ Show ${show._id} seems OK (Seats have config IDs).`);
                }
            }
        }

        console.log('Done.');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

fixSeats();
