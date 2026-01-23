
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './src/models/Event.js';

dotenv.config();

async function listEvents() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const events = await Event.find({}, 'title');
        console.log('--- EVENTS ---');
        events.forEach(e => console.log(e.title));
    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

listEvents();
