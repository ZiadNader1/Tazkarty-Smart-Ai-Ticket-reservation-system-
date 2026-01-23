
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Payment from './src/models/Payment.js';

dotenv.config();

const cleanPayments = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const result = await Payment.deleteMany({
            $or: [
                { transaction_id: { $exists: false } },
                { transaction_id: null },
                { transaction_id: "" }
            ]
        });

        console.log(`Deleted ${result.deletedCount} invalid payments.`);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

cleanPayments();
