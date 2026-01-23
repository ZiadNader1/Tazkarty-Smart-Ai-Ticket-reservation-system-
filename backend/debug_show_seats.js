
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Show from './src/models/Show.js';
import Event from './src/models/Event.js';
import Seat from './src/models/Seat.js';

dotenv.config();

async function debugShowSeats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // 1. Find the Event
        const event = await Event.findOne({ title: { $regex: 'Talents', $options: 'i' } });

        if (!event) {
            console.log('Event "Talents Development Center Concert" not found.');
            return;
        }
        console.log(`Found Event: ${event.title} (${event._id})`);

        // 2. Find the Show
        const show = await Show.findOne({ event_id: event._id });
        if (!show) {
            console.log('Show not found for this event.');
            return;
        }
        console.log(`Found Show: ${show.title || 'Untitled'} (${show._id}) - Start: ${show.start_time}`);

        // 3. List Seats
        const seats = await Seat.find({ show_id: show._id }).limit(5);
        console.log(`Total Seats found for show: ${await Seat.countDocuments({ show_id: show._id })}`);

        console.log('--- SAMPLE SEATS ---');
        seats.forEach(s => {
            console.log(`_id: ${s._id}`);
            console.log(`seat_config_id: ${s.seat_config_id}`);
            console.log(`status: ${s.status}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

debugShowSeats();
