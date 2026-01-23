
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hall from './src/models/Hall.js';

dotenv.config();

async function checkHall() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const hallId = '695003762b2ee2e364dfb74e';
        const hall = await Hall.findById(hallId);

        if (!hall) {
            console.log('Hall not found');
            return;
        }

        console.log(`Hall: ${hall.name}`);
        console.log(`Has Config: ${!!hall.seat_map_config}`);

        if (hall.seat_map_config && hall.seat_map_config.sections) {
            console.log(`Sections: ${hall.seat_map_config.sections.length}`);
            let totalSeats = 0;
            hall.seat_map_config.sections.forEach((sec, idx) => {
                let secSeats = 0;
                if (sec.rows) {
                    sec.rows.forEach(r => secSeats += (r.seats ? r.seats.length : 0));
                }
                console.log(`  Section ${idx}: ${secSeats} seats`);
                totalSeats += secSeats;
            });
            console.log(`Total Configured Seats: ${totalSeats}`);
        } else {
            console.log('No Sections found in config.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkHall();
