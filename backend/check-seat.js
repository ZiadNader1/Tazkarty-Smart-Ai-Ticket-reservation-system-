
import mongoose from 'mongoose';
import 'dotenv/config';
import Seat from './src/models/Seat.js';

const SEAT_CONFIG_ID = '7c391c5c-2da7-41d3-932e-8509c5e7f97e'; // New failing ID

async function checkSeat() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        console.log(`Searching for seat_config_id: ${SEAT_CONFIG_ID}`);
        const seatByConfig = await Seat.findOne({ seat_config_id: SEAT_CONFIG_ID });

        if (seatByConfig) {
            console.log('✅ Found Seat by Config ID:');
            console.log(JSON.stringify(seatByConfig, null, 2));
        } else {
            console.log('❌ Seat NOT FOUND by Config ID.');

            // Check total seats
            const count = await Seat.countDocuments({});
            console.log(`Total Seats in DB: ${count}`);

            const sample = await Seat.findOne();
            console.log('Sample Seat:', sample);
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkSeat();
