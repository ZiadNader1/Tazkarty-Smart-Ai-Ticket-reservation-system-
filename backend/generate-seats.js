import mongoose from 'mongoose';
import Show from './src/models/Show.js';
import Seat from './src/models/Seat.js';
import Hall from './src/models/Hall.js';

// Hardcoded URI to avoid env issues
const MONGO_URI = "mongodb+srv://ziad320230146_db_user:Ziadnader1234@cluster0.7iirq6q.mongodb.net/tazkarty?retryWrites=true&w=majority";

const generateSeatsForShows = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Find all active shows
        const shows = await Show.find({ is_active: true });
        console.log(`Found ${shows.length} active shows.`);

        for (const show of shows) {
            // Check if seats exist for this show
            const seatCount = await Seat.countDocuments({ show_id: show._id });
            if (seatCount > 0) {
                console.log(`Show ${show._id} already has ${seatCount} seats. Skipping.`);
                continue;
            }

            console.log(`Show ${show._id} has NO seats. Generating...`);

            const hall = await Hall.findById(show.hall_id);
            if (!hall) {
                console.error(`Hall not found for show ${show._id}`);
                // If hall is missing, we can't really create seats accurately, but for sports we might use a dummy hall structure?
                // Let's assume hall exists as ensured by fix-shows.js
                continue;
            }

            console.log(`Generating seats for Hall: ${hall.name} (${hall.total_rows}x${hall.total_columns})`);

            const seatsToCreate = [];
            const rowLabels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

            for (let r = 0; r < hall.total_rows; r++) {
                const rowLabel = rowLabels[r % 26];
                for (let c = 1; c <= hall.total_columns; c++) {
                    seatsToCreate.push({
                        show_id: show._id,
                        hall_id: hall._id,
                        seat_id: `${rowLabel}${c}`, // e.g., A1
                        row_label: rowLabel,
                        seat_label: c.toString(),
                        status: 'available',
                        tier: 'Standard',
                        price: show.price || 100, // Use show price
                        // REQUIRED FIELDS
                        row: r + 1,      // numeric 1-based index
                        column: c        // numeric 1-based index
                    });
                }
            }

            if (seatsToCreate.length > 0) {
                await Seat.insertMany(seatsToCreate);
                console.log(`Successfully created ${seatsToCreate.length} seats for Show ${show._id}`);
            }
        }

        console.log('All shows processed.');
        process.exit(0);

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

generateSeatsForShows();
