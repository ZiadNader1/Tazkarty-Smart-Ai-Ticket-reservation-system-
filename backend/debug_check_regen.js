
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Show from './src/models/Show.js';
import Seat from './src/models/Seat.js';

dotenv.config();

async function checkRegeneration() {
    try {
        await mongoose.connect(process.env.MONGO_URI);

        const show = await Show.findOne({ title: { $regex: 'Talents', $options: 'i' } });

        if (!show) {
            console.log('Show not found.');
            return;
        }

        console.log(`Checking Show: ${show.title} (${show._id})`);

        const count = await Seat.countDocuments({ show_id: show._id });
        console.log(`Total Seats: ${count}`);

        if (count > 0) {
            // Check for the specific problematic ID
            const targetId = '9e746cb0-19c2-49d6-80c6-0053085e51c0';
            const seat = await Seat.findOne({
                show_id: show._id,
                seat_config_id: targetId
            });

            if (seat) {
                console.log(`✅ Target Seat FOUND:`);
                console.log(`   _id: ${seat._id}`);
                console.log(`   seat_config_id: ${seat.seat_config_id}`);
                console.log(`   status: ${seat.status}`);
            } else {
                console.log(`❌ Target Seat NOT FOUND with config_id: ${targetId}`);
                console.log('Sample IDs present in DB:');
                const samples = await Seat.find({ show_id: show._id }).limit(3);
                samples.forEach(s => console.log(`   ${s.seat_config_id}`));
            }
        } else {
            console.log('❌ No seats found. Regeneration did not happen.');
        }

    } catch (error) {
        console.error(error);
    } finally {
        await mongoose.disconnect();
    }
}

checkRegeneration();
