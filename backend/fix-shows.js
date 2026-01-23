import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Event from './src/models/Event.js';
import Show from './src/models/Show.js';
import Hall from './src/models/Hall.js';
import Stadium from './src/models/Stadium.js';

dotenv.config();

const fixShows = async () => {
    try {
        const MONGO_URI = "mongodb+srv://ziad320230146_db_user:Ziadnader1234@cluster0.7iirq6q.mongodb.net/tazkarty?retryWrites=true&w=majority";
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        const localSportsEvents = await Event.find({ type: 'sports' });
        console.log(`Found ${localSportsEvents.length} sports events.`);

        for (const event of localSportsEvents) {
            if (!event.stadium_id) {
                console.log(`Skipping event "${event.title}" - No Stadium ID`);
                continue;
            }

            const existingShow = await Show.findOne({ event_id: event._id });
            if (existingShow) {
                console.log(`Event "${event.title}" already has a show. Skipping.`);
                continue;
            }

            console.log(`Event "${event.title}" has NO show. Attempting to fix...`);

            // Find a hall
            let hall = await Hall.findOne({ stadium_id: event.stadium_id });

            if (!hall) {
                console.log(`No halls found for stadium ${event.stadium_id}. Creating default 'General Admission' hall...`);
                // Check if stadium exists
                const stadium = await Stadium.findById(event.stadium_id);
                if (!stadium) {
                    console.error(`Stadium ${event.stadium_id} not found! Cannot create hall.`);
                    continue;
                }

                hall = await Hall.create({
                    venue_id: undefined, // It's a stadium hall
                    stadium_id: event.stadium_id,
                    name: "General Admission",
                    total_rows: 10,
                    total_columns: 10,
                    capacity: 100,
                    seat_categories: [{ name: "Standard", count: 100, description: "General Seat" }],
                    section_side: 'neutral',
                    gate: 'Main',
                    base_price: 50
                });
                console.log('Created default Hall:', hall._id);
            }

            // Create Show
            const endTime = new Date(event.release_date).getTime() + (event.duration_minutes * 60000);
            const newShow = await Show.create({
                event_id: event._id,
                hall_id: hall._id,
                start_time: event.release_date,
                end_time: new Date(endTime),
                price: 100,
                is_active: true
            });

            console.log(`SUCCESS: Created Show ${newShow._id} for event "${event.title}"`);
        }

        console.log('Done.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixShows();
