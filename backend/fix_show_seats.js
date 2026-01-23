
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Show from './src/models/Show.js';
import Seat from './src/models/Seat.js';

dotenv.config();

async function fixSeats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const show = await Show.findOne({ title: { $regex: 'Talents', $options: 'i' } });

        if (!show) {
            console.log('Show not found.');
            return;
        }

        console.log(`Fixing seats for Show: ${show.title}`);

        // Delete existing seats (likely corrupted or incomplete)
        const result = await Seat.deleteMany({ show_id: show._id });
        console.log(`Deleted ${result.deletedCount} seats.`);
        console.log('Now the next request to "getAvailableSeats" will regenerate them correctly.');

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

fixSeats();
