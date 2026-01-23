import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import TrainSeatMap from '../models/TrainSeatMap.js';
import TrainSeat from '../models/TrainSeat.js';
import TrainBooking from '../models/TrainBooking.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import mongoose from 'mongoose';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const getTrainsByDestination = async (req, res) => {
    try {
        const { destination } = req.params;
        const fileName = `cairo_to_${destination.toLowerCase()}.json`;
        const filePath = path.join(__dirname, '../../uploads', fileName);

        try {
            const data = await fs.readFile(filePath, 'utf8');
            const trains = JSON.parse(data);
            res.json(trains);
        } catch (err) {
            console.error(`File not found: ${filePath}`);
            res.status(404).json({ message: `No trains found for destination: ${destination}` });
        }
    } catch (error) {
        console.error("Train Controller Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// --- NEW TRAIN BOOKING METHODS ---

/**
 * Get Seat Map and Availability for a specific train
 */
export const getTrainAvailability = async (req, res) => {
    try {
        const { trainNumber } = req.params;
        const { date, trainType } = req.query; // Date is expected in YYYY-MM-DD

        if (!date) return res.status(400).json({ message: "Date is required" });

        const travelDate = new Date(date);
        travelDate.setHours(0, 0, 0, 0);

        // 0. Auto-unlock expired seats for this train and date
        await TrainSeat.updateMany(
            {
                train_number: trainNumber,
                travel_date: travelDate,
                status: 'locked',
                locked_until: { $lt: new Date() }
            },
            {
                $set: { status: 'available', locked_by: null, locked_until: null }
            }
        );

        // 1. Get the layout for this train type from TrainSeatMap
        let seatMap = await TrainSeatMap.findOne({ train_type: trainType });

        // Default layout if none exists (Admins will update this later)
        if (!seatMap) {
            // Provide a basic 2+2 layout for 5 carriages as a fallback
            const carriages = [];
            for (let i = 1; i <= 5; i++) {
                carriages.push({
                    number: i,
                    class: i <= 2 ? '1st Class' : '2nd Class',
                    rows: 15,
                    columns_per_row: 4,
                    layout_type: '2+2',
                    capacity: 60,
                    price: i <= 2 ? 150 : 80
                });
            }
            seatMap = { train_type: trainType, carriages };
        }

        // 2. Get already booked/locked seats from TrainSeat for this train & date
        const occupiedSeats = await TrainSeat.find({
            train_number: trainNumber,
            travel_date: travelDate
        });

        res.json({
            train_number: trainNumber,
            train_type: trainType,
            travel_date: travelDate,
            layout: seatMap.carriages,
            occupied: occupiedSeats.map(s => ({
                carriage: s.carriage_number,
                seat: s.seat_label,
                status: s.status
            }))
        });

    } catch (error) {
        console.error("Train Availability Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Create a Train Booking (Locks seats and keeps them pending)
 */
export const createTrainBooking = async (req, res) => {
    try {
        const {
            train_number,
            train_type,
            departure_city,
            destination_city,
            departure_time,
            arrival_time,
            travel_date,
            seats, // Array of { carriage, seat, price }
            national_id,
            passengers
        } = req.body;

        const userId = req.user.id;
        const dateObj = new Date(travel_date);
        dateObj.setHours(0, 0, 0, 0);

        // 1. Validate Seats Availability
        for (const s of seats) {
            const existing = await TrainSeat.findOne({
                train_number,
                travel_date: dateObj,
                carriage_number: s.carriage,
                seat_label: s.seat
            });

            const isAvailable = !existing ||
                existing.status === 'available' ||
                (existing.status === 'locked' && existing.locked_until < new Date()) ||
                (existing.status === 'locked' && String(existing.locked_by) === String(userId));

            if (!isAvailable) {
                return res.status(400).json({ message: `Seat ${s.seat} in carriage ${s.carriage} is no longer available.` });
            }
        }

        // 2. Create TrainSeats entries (Mark as LOCKED)
        const LOCK_DURATION = 10 * 60 * 1000; // 10 minutes
        const lockedUntil = new Date(Date.now() + LOCK_DURATION);

        const seatEntries = seats.map(s => ({
            train_number,
            travel_date: dateObj,
            carriage_number: s.carriage,
            seat_label: s.seat,
            status: 'locked',
            locked_by: userId,
            locked_until: lockedUntil,
            price: s.price
        }));

        for (const entry of seatEntries) {
            await TrainSeat.findOneAndUpdate(
                {
                    train_number: entry.train_number,
                    travel_date: entry.travel_date,
                    carriage_number: entry.carriage_number,
                    seat_label: entry.seat_label
                },
                entry,
                { upsert: true, new: true }
            );
        }

        // 3. Create Pending Booking Record
        const total_price = seats.reduce((sum, s) => sum + s.price, 0);

        const booking = await TrainBooking.create({
            user_id: userId,
            train_number,
            train_type,
            departure_city,
            destination_city,
            departure_time: departure_time || 'Scheduled',
            arrival_time,
            travel_date: dateObj,
            seats: seats.map(s => ({
                carriage_number: s.carriage,
                seat_label: s.seat,
                price: s.price
            })),
            national_id,
            passengers,
            total_price,
            status: 'pending',
            locked_until: lockedUntil
        });

        // 4. Update User's National ID if not set
        const user = await User.findById(userId);
        if (user && !user.national_id) {
            user.national_id = national_id;
            await user.save();
        }

        res.status(201).json({
            message: "Seat locked! Complete payment within 10 minutes.",
            booking,
            locked_until: lockedUntil
        });

    } catch (error) {
        console.error("Train Booking Error:", error);
        res.status(500).json({ message: error.message });
    }
};

/**
 * Confirm Train Booking (After successful payment)
 */
export const confirmTrainBooking = async (req, res) => {
    try {
        const { bookingId, transaction_id } = req.body;
        const userId = req.user.id;

        const booking = await TrainBooking.findOne({ _id: bookingId, user_id: userId, status: 'pending' });
        if (!booking) return res.status(404).json({ message: "Pending booking not found." });

        // Check if lock expired
        if (booking.locked_until < new Date()) {
            return res.status(400).json({ message: "Reservation expired. Please try again." });
        }

        // 1. Mark seats as BOOKED
        for (const s of booking.seats) {
            await TrainSeat.findOneAndUpdate(
                {
                    train_number: booking.train_number,
                    travel_date: booking.travel_date,
                    carriage_number: s.carriage_number,
                    seat_label: s.seat_label
                },
                {
                    $set: {
                        status: 'booked',
                        locked_by: null,
                        locked_until: null
                    }
                }
            );
        }

        // 2. Create Payment Record
        const payment = await Payment.create({
            user_id: userId,
            ticket_id: booking._id, // Using booking ID for both sports/trains
            amount: booking.total_price,
            method: 'stripe',
            status: 'paid',
            transaction_id: transaction_id
        });

        // 3. Update Booking Status
        booking.status = 'booked';
        booking.payment_id = payment._id;
        await booking.save();

        res.json({
            message: "Train booking confirmed!",
            booking,
            payment
        });

    } catch (error) {
        console.error("Confirm Train Booking Error:", error);
        res.status(500).json({ message: error.message });
    }
};

