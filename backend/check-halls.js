
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hall from './src/models/Hall.js';
import Stadium from './src/models/Stadium.js';

dotenv.config();

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/tazkarty')
    .then(async () => {
        console.log('Connected to MongoDB');

        const stadiums = await Stadium.find({});
        console.log(`Found ${stadiums.length} stadiums`);

        for (const stadium of stadiums) {
            console.log(`\nStadium: ${stadium.name} (${stadium._id})`);

            const hallsStadium = await Hall.find({ stadium_id: stadium._id });
            const hallsVenue = await Hall.find({ venue_id: stadium._id });

            console.log(`- Halls by stadium_id: ${hallsStadium.length}`);
            console.log(`- Halls by venue_id: ${hallsVenue.length}`);

            if (hallsStadium.length > 0) console.log(hallsStadium.map(h => h.name));
            if (hallsVenue.length > 0) console.log(hallsVenue.map(h => h.name));
        }

        const allHalls = await Hall.find({});
        console.log(`\nTotal Halls in DB: ${allHalls.length}`);
        if (allHalls.length > 0 && allHalls.length < 20) {
            console.log('Sample Hall:', allHalls[0]);
        }

        process.exit();
    })
    .catch(err => {
        console.error(err);
        process.exit(1);
    });
