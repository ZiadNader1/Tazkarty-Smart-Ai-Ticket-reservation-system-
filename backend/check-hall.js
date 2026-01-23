
import mongoose from 'mongoose';
import 'dotenv/config';
import Hall from './src/models/Hall.js';

async function checkHall() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find by Name based on log
        const hall = await Hall.findOne({ name: 'Hall test new' });
        if (!hall) {
            console.log("Hall 'Hall test new' not found. Listing all halls...");
            const all = await Hall.find({}, 'name');
            console.log(all);
        } else {
            console.log(`Found Hall: ${hall.name} (${hall._id})`);
            console.log(`Has Config? ${!!hall.seat_map_config}`);
            console.log(`Has Sections? ${!!(hall.seat_map_config && hall.seat_map_config.sections)}`);

            if (hall.seat_map_config) {
                console.log("Config Keys:", Object.keys(hall.seat_map_config));
                if (hall.seat_map_config.sections) {
                    console.log("Section Count:", hall.seat_map_config.sections.length);
                    if (hall.seat_map_config.sections.length > 0) {
                        console.log("First Section:", JSON.stringify(hall.seat_map_config.sections[0], null, 2));
                    }
                }
            }
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkHall();
