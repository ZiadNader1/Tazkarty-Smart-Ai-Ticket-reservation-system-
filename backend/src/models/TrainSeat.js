import mongoose from "mongoose";

const trainSeatSchema = new mongoose.Schema({
    train_number: { type: String, required: true },
    travel_date: { type: Date, required: true },
    carriage_number: { type: Number, required: true },
    seat_label: { type: String, required: true },
    status: {
        type: String,
        enum: ['available', 'locked', 'booked', 'blocked'],
        default: 'available'
    },
    locked_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    locked_until: Date,
    price: Number
}, { timestamps: true });

// Index for quick lookup of specific train seat on a date
trainSeatSchema.index({ train_number: 1, travel_date: 1, carriage_number: 1, seat_label: 1 }, { unique: true });

export default mongoose.model("TrainSeat", trainSeatSchema);
