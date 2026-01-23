import mongoose from "mongoose";

const trainSeatMapSchema = new mongoose.Schema({
    train_type: {
        type: String,
        required: true,
        unique: true // One map per train type
    },
    carriages: [{
        number: { type: Number, required: true },
        class: { type: String, required: true }, // 1st Class, 2nd Class, etc.
        rows: { type: Number, required: true },
        columns_per_row: { type: Number, required: true }, // e.g., 4 for 2+2
        layout_type: {
            type: String,
            enum: ['2+2', '2+1', '1+1', 'open'],
            default: '2+2'
        },
        capacity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    description: String,
    is_active: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model("TrainSeatMap", trainSeatMapSchema);
