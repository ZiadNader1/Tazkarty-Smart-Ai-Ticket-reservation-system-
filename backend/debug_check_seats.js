
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Seat from './src/models/Seat.js';
import Ticket from './src/models/Ticket.js';
import User from './src/models/User.js';

dotenv.config();

const seatIds = [
    '9e746cb0-19c2-49d6-80c6-0053085e51c0',
    '3fe0cda3-4580-44ed-9c64-fe7497380b94',
    'def77975-6c22-4ea1-93ea-7bf71ee2491f'
];

async function checkSeats() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        // UUIDs are seat_config_id, not _id
        const seats = await Seat.find({ seat_config_id: { $in: seatIds } });

        console.log('--- SEAT STATUS ---');
        console.log(`Found ${seats.length} seats matching config IDs.`);

        for (const seat of seats) {
            console.log(`Seat ID: ${seat._id}`);
            console.log(`  Config ID: ${seat.seat_config_id}`);
            console.log(`  Label: ${seat.seat_label} (Row: ${seat.row_label})`);
            console.log(`  Status: ${seat.status}`);
            console.log(`  Locked By: ${seat.locked_by}`);
            console.log(`  Locked Until: ${seat.locked_until}`);
            console.log(`  Show ID: ${seat.show_id}`);

            // If booked/locked, try to find the ticket
            if (seat.status !== 'available') {
                // Ticket stores MongoDB _id, not config id in 'seats' array
                const ticket = await Ticket.findOne({ seats: seat._id });
                if (ticket) {
                    console.log(`  LINKED TICKET: ${ticket._id}`);
                    console.log(`    Status: ${ticket.status}`);
                    console.log(`    User: ${ticket.user_id}`);
                } else {
                    console.log(`  NO LINKED TICKET FOUND (Possible Zombie State)`);
                }
            }
            console.log('-------------------');
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

checkSeats();
