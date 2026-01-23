
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Show from './src/models/Show.js';
import Seat from './src/models/Seat.js';

dotenv.config();

async function findShow() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        // Find Show by title since Event didn't have it
        const show = await Show.findOne({ title: { $regex: 'Talents', $options: 'i' } });

        if (!show) {
            console.log('Show "Talents..." not found directly either.');
            // List all shows to be sure
            const allShows = await Show.find({});
            console.log('--- ALL SHOWS ---');
            allShows.forEach(s => console.log(`ID: ${s._id}, Title: ${s.title}, EventID: ${s.event_id}`));
            return;
        }

        console.log(`FOUND SHOW: ${show.title} (${show._id})`);
        console.log(`Hall ID: ${show.hall_id}`);

        // Check Seats
        const seatCount = await Seat.countDocuments({ show_id: show._id });
        console.log(`Seat Count: ${seatCount}`);

        // If 0, check why lazy load might fail?
        // Log Hall details?
        if (seatCount === 0) {
            console.log('No seats found. This explains the 400 error.');
        } else {
            // List a few seat IDs to compare with user's UUIDs
            const seats = await Seat.find({ show_id: show._id }).limit(3);
            seats.forEach(s => console.log(`Seat: ${s._id} / ConfigID: ${s.seat_config_id}`));
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

findShow();
