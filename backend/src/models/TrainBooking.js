import mongoose from "mongoose";

const trainBookingSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    train_number: {
        type: String,
        required: true
    },
    train_type: {
        type: String,
        required: true
    },
    departure_city: {
        type: String,
        required: true
    },
    destination_city: {
        type: String,
        required: true
    },
    departure_time: {
        type: String,
        required: true
    },
    arrival_time: {
        type: String
    },
    travel_date: {
        type: Date,
        required: true
    },
    seats: [{
        carriage_number: Number,
        seat_label: String,
        price: Number
    }],
    national_id: {
        type: String,
        required: true
    },
    passengers: [{
        name: String,
        national_id: String
    }],
    total_price: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'booked', 'cancelled', 'completed'],
        default: 'pending'
    },
    locked_until: {
        type: Date
    },
    payment_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment'
    },
    isPaid: {
        type: Boolean,
        default: false
    },
    qr_code_url: {
        type: String
    }
}, { timestamps: true });

export default mongoose.model("TrainBooking", trainBookingSchema);
