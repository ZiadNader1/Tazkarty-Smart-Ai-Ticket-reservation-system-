import mongoose from "mongoose";
import Seat from "../models/Seat.js";
import Ticket from "../models/Ticket.js";
import Show from "../models/Show.js";
import Hall from "../models/Hall.js";
import PromoCode from "../models/PromoCode.js";
import Payment from "../models/Payment.js";
import Notification from "../models/Notification.js";
import TrainBooking from "../models/TrainBooking.js";
import TrainSeat from "../models/TrainSeat.js";
import qrcode from "qrcode";
import { sendNotificationToUser } from "../services/socketService.js";

// =====================================================
// STEP 1: CREATE BOOKING (Lock Seats + Pending Ticket)
// =====================================================
export const createBooking = async (req, res) => {
  const { show_id, seatIds, promoCode } = req.body;
  const user_id = req.user.id;

  if (!show_id || !seatIds || !seatIds.length) {
    return res.status(400).json({
      message: "show_id and seatIds are required"
    });
  }

  // Get show
  const show = await Show.findById(show_id);
  if (!show) {
    return res.status(404).json({ message: "Show not found" });
  }

  // Lock duration: 5 minutes
  const LOCK_DURATION = 5 * 60 * 1000;
  const lockedUntil = new Date(Date.now() + LOCK_DURATION);

  let session = null;

  try {
    // Start transaction
    // Start transaction (Disabled for local standalone Mongo compatibility)
    /*
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }
    */
    session = null;

    // ===== 1) LOCK SEATS ATOMICALLY =====
    const lockedSeats = [];

    for (const seatId of seatIds) {
      let query = {
        show_id,
        $or: [
          { status: "available" },
          { status: "locked", locked_until: { $lt: new Date() } },
          { status: "locked", locked_by: user_id }
        ]
      };

      // Robust Query: Check _id if valid ObjectID, otherwise check seat_config_id
      if (mongoose.Types.ObjectId.isValid(seatId)) {
        query._id = seatId;
      } else {
        query.seat_config_id = seatId;
      }

      const seat = await Seat.findOneAndUpdate(
        query,
        {
          $set: {
            status: "locked",
            locked_by: user_id,
            locked_until: lockedUntil
          }
        },
        { new: true, session }
      );


      if (!seat) {
        // Rollback
        if (session) {
          await session.abortTransaction();
          session.endSession();
        } else {
          await Seat.updateMany(
            { _id: { $in: lockedSeats.map(s => s._id) } },
            {
              $set: {
                status: "available",
                locked_by: null,
                locked_until: null
              }
            }
          );
        }
        return res.status(400).json({
          message: `Seat ${seatId} is not available`
        });
      }

      lockedSeats.push(seat);
    }

    // ===== 2) CALCULATE PRICE =====

    let pricePerSeat = show.price;
    let total_price = pricePerSeat * seatIds.length;
    let promoRef = null;

    // Apply promo code
    if (promoCode) {
      const promo = await PromoCode.findOne({
        code: promoCode.toUpperCase()
      });

      if (!promo) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(400).json({
          message: "Invalid promo code"
        });
      }

      // Validate promo
      if (!promo.isValid()) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(400).json({
          message: "Promo code expired or not active"
        });
      }

      // Check user eligibility
      if (!promo.canBeUsedBy(user_id)) {
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(400).json({
          message: "You cannot use this promo code"
        });
      }

      promoRef = promo._id;
      const discount = (promo.discount_percentage / 100) * total_price;
      total_price = total_price - discount;
    }

    // ===== 3) CREATE PENDING TICKET =====

    const ticketData = {
      user_id,
      show_id,
      seats: seatIds,
      price_per_seat: pricePerSeat,
      total_price,
      status: "pending",
      isPaid: false,
      booking_time: new Date(),
      promo_code: promoRef
    };

    // Remove session and array syntax since we disabled transactions
    const createdTicket = await Ticket.create(ticketData);

    // ===== 4) CREATE PAYMENT RECORD =====

    const createdPayment = await Payment.create({
      user_id,
      ticket_id: createdTicket._id,
      amount: total_price,
      method: "pending",
      status: "pending"
    });

    // Commit transaction
    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // Return response
    return res.status(201).json({
      message: "Booking created! Complete payment within 5 minutes.",
      ticket: createdTicket,
      payment: createdPayment,
      lock_expires_at: lockedUntil
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Create Booking Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ========================================
// STEP 2: CONFIRM BOOKING (After Payment)
// ========================================
export const confirmBooking = async (req, res) => {
  const { ticketId, transaction_id } = req.body;
  const user_id = req.user.id;

  if (!ticketId) {
    return res.status(400).json({ message: "ticketId is required" });
  }

  let session = null;

  try {
    try {
      session = await mongoose.startSession();
      session.startTransaction();
    } catch (e) {
      session = null;
    }

    // Find pending ticket
    const ticket = await Ticket.findOne({
      _id: ticketId,
      user_id,
      status: "pending"
    }).session(session);

    if (!ticket) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }
      return res.status(404).json({
        message: "Pending ticket not found"
      });
    }

    // Check if already booked
    if (ticket.status === "booked") {
      if (session) {
        await session.commitTransaction();
        session.endSession();
      }
      return res.status(200).json({
        message: "Ticket already booked",
        ticket
      });
    }

    // Verify seats still locked by user
    const now = new Date();
    const seats = await Seat.find({
      _id: { $in: ticket.seats }
    }).session(session);



    for (const seat of seats) {


      if (seat.status === "booked") {
        console.error(`[DEBUG] Seat ${seat._id} is already booked!`);
        if (session) {
          await session.abortTransaction();
          session.endSession();
        }
        return res.status(400).json({
          message: `Seat ${seat._id} is already booked`
        });
      }

      if (seat.status === "locked") {
        // Relaxed check: Only check user ID. Ignore time for a moment to test? No, time is important.
        const isUserMatch = String(seat.locked_by) === String(user_id);
        const isTimeValid = seat.locked_until && new Date(seat.locked_until) >= now;

        if (!isUserMatch) console.error(`[DEBUG] User Mismatch! Seat: ${seat.locked_by}, Req: ${user_id}`);
        if (!isTimeValid) console.error(`[DEBUG] Time Expired! Until: ${seat.locked_until}, Now: ${now}`);

        if (!isUserMatch || !isTimeValid) {
          if (session) {
            await session.abortTransaction();
            session.endSession();
          }
          return res.status(400).json({
            message: "Seat lock expired or invalid user. Please try again."
          });
        }
      }
    }

    // Update payment
    await Payment.findOneAndUpdate(
      { ticket_id: ticket._id },
      {
        $set: {
          status: "paid",
          method: "stripe",
          transaction_id: transaction_id || null
        }
      },
      { new: true, session }
    );

    // Mark seats as booked
    await Seat.updateMany(
      { _id: { $in: ticket.seats } },
      {
        $set: {
          status: "booked",
          locked_by: null,
          locked_until: null
        }
      },
      { session }
    );

    // Update ticket
    ticket.status = "booked";
    ticket.isPaid = true;
    await ticket.save({ session });

    // Increment promo usage
    if (ticket.promo_code) {
      await PromoCode.findByIdAndUpdate(
        ticket.promo_code,
        { $inc: { used_count: 1 } },
        { session }
      );
    }

    // Generate QR Code
    const qrData = JSON.stringify({
      ticket_id: String(ticket._id),
      user_id: String(user_id),
      show_id: String(ticket.show_id),
      seats: ticket.seats.map(s => String(s))
    });

    const qr_url = await qrcode.toDataURL(qrData);
    ticket.qr_code_url = qr_url;
    await ticket.save({ session });

    // Create notification
    const notification = await Notification.create([{
      user_id,
      title: "🎉 Booking Confirmed!",
      message: `Your booking for ${ticket.seats.length} seat(s) is confirmed!`,
      is_read: false
    }], { session });

    if (session) {
      await session.commitTransaction();
      session.endSession();
    }

    // Send real-time notification
    sendNotificationToUser(user_id, {
      title: notification[0].title,
      message: notification[0].message,
      type: "booking_confirmed",
      ticket_id: ticket._id
    });

    return res.json({
      message: "Booking confirmed successfully!",
      ticket
    });

  } catch (error) {
    if (session) {
      await session.abortTransaction();
      session.endSession();
    }
    console.error("Confirm Booking Error:", error);
    return res.status(500).json({ message: error.message });
  }
};

// ==========================
// CANCEL BOOKING
// ==========================
export const cancelBooking = async (req, res) => {
  const { ticketId } = req.body;
  const user_id = req.user.id;

  if (!ticketId) {
    return res.status(400).json({ message: "ticketId is required" });
  }

  try {
    // Populate show to check start time
    let ticket = await Ticket.findOne({
      _id: ticketId,
      user_id
    }).populate("show_id");

    if (!ticket) {
      // Try Train Booking
      const trainBooking = await TrainBooking.findOne({ _id: ticketId, user_id });
      if (!trainBooking) {
        return res.status(404).json({ message: "Booking not found" });
      }

      // Train Cancellation Logic
      if (trainBooking.status === 'booked') {
        const travelTime = new Date(trainBooking.travel_date).getTime();
        const now = Date.now();
        if ((travelTime - now) / (1000 * 60 * 60) < 24) {
          return res.status(400).json({ message: "Refunds for trains are only allowed 24h before travel." });
        }
        trainBooking.status = 'cancelled'; // Or 'refunded'
      } else {
        trainBooking.status = 'cancelled';
      }

      // Unlock Train Seats
      for (const s of trainBooking.seats) {
        await TrainSeat.findOneAndUpdate(
          {
            train_number: trainBooking.train_number,
            travel_date: trainBooking.travel_date,
            carriage_number: s.carriage_number,
            seat_label: s.seat_label
          },
          { $set: { status: 'available', locked_by: null, locked_until: null } }
        );
      }

      await trainBooking.save();
      await Notification.create({
        user_id,
        title: "Train Booking Cancelled",
        message: `Your train booking for ${trainBooking.train_number} has been cancelled.`,
        is_read: false
      });

      return res.json({ message: "Train booking cancelled successfully", ticket: trainBooking });
    }

    // CHECK 1: Refund Policy (24h Rule)
    if (ticket.status === "booked") {
      const show = ticket.show_id;
      if (!show || !show.start_time) {
        return res.status(400).json({ message: "Cannot verify event time." });
      }

      const eventTime = new Date(show.start_time).getTime();
      const now = Date.now();
      const hoursUntilEvent = (eventTime - now) / (1000 * 60 * 60);

      if (hoursUntilEvent < 24) {
        return res.status(400).json({
          message: "Refunds are only allowed at least 24 hours before the event."
        });
      }

      ticket.status = "refunded"; // Mark as refunded
    } else {
      ticket.status = "cancelled";
    }

    // Unlock seats
    await Seat.updateMany(
      { _id: { $in: ticket.seats } },
      {
        $set: {
          status: "available",
          locked_by: null,
          locked_until: null
        }
      }
    );

    await ticket.save();

    await Notification.create({
      user_id,
      title: "Booking Cancelled",
      message: `Your booking ${ticket._id} has been cancelled.`,
      is_read: false
    });

    return res.json({
      message: "Booking cancelled successfully",
      ticket
    });

  } catch (error) {
    console.error("Cancel Booking Error:", error);
    // Log stack trace for deeper debugging
    if (error.stack) {
      console.error(error.stack);
    }
    return res.status(500).json({ message: error.message });
  }
};

// ==========================
// GET USER BOOKINGS
// ==========================
export const getMyBookings = async (req, res) => {
  try {
    const user_id = req.user.id;

    const tickets = await Ticket.find({ user_id })
      .populate({
        path: "show_id",
        populate: { path: "event_id" }
      })
      .populate("seats")
      .populate("promo_code")
      .sort({ booking_time: -1 });

    const trainBookings = await TrainBooking.find({ user_id })
      .sort({ createdAt: -1 });

    // Mark train bookings for frontend distinction
    const formattedTrainBookings = trainBookings.map(tb => ({
      ...tb.toObject(),
      isTrain: true
    }));

    // Combine
    const allBookings = [...tickets, ...formattedTrainBookings].sort((a, b) => {
      const dateA = a.booking_time || a.createdAt;
      const dateB = b.booking_time || b.createdAt;
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });

    res.json({
      count: allBookings.length,
      tickets: allBookings
    });

  } catch (error) {
    console.error("Get Bookings Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// GET AVAILABLE SEATS
// ==========================
export const getAvailableSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const show = await Show.findById(showId);
    if (!show) {
      return res.status(404).json({ message: "Show not found" });
    }

    // Auto-unlock expired locks
    await Seat.updateMany(
      {
        show_id: showId,
        status: "locked",
        locked_until: { $lt: new Date() }
      },
      {
        $set: {
          status: "available",
          locked_by: null,
          locked_until: null
        }
      }
    );

    // Check for existing seats
    let seats = await Seat.find({ show_id: showId }).sort({ row: 1, column: 1 });

    // LAZY INITIALIZATION: If no seats exist, generate them based on Hall config
    if (seats.length === 0) {

      // Use lean() to ensure seat_map_config (Mixed type) is a plain object/array
      const hall = await Hall.findById(show.hall_id).lean();

      if (hall) {
        const newSeats = [];

        // STRATEGY 1: Use Seat Map Config if available (Preferred)
        if (hall.seat_map_config && hall.seat_map_config.sections) {


          for (const section of hall.seat_map_config.sections) {
            if (!section.rows) continue;
            for (const row of section.rows) {
              if (!row.seats) continue;
              const rowLabel = row.label || String(row.index) || "Row"; // Fallback

              for (const seat of row.seats) {
                newSeats.push({
                  show_id: showId,
                  seat_config_id: seat.id, // CRITICAL: Link to visual map
                  row: row.index || 0, // approximate
                  column: 0, // varying
                  row_label: rowLabel,
                  seat_label: seat.label || "Seat",
                  status: seat.status || 'available', // Respect config status (e.g. gaps/disabled)
                  price: show.price // Base price, could be tiered later
                });
              }
            }
          }
        }
        // STRATEGY 2: Fallback to Grid (Legacy)
        else {

          const rows = hall.total_rows || 10;
          const cols = hall.total_columns || 10;

          for (let r = 1; r <= rows; r++) {
            const rowLabel = String.fromCharCode(64 + r); // A, B, C...
            for (let c = 1; c <= cols; c++) {
              newSeats.push({
                show_id: showId,
                row: r,
                column: c,
                row_label: rowLabel,
                seat_label: String(c),
                status: 'available',
                price: show.price
              });
            }
          }
        }

        if (newSeats.length > 0) {
          seats = await Seat.insertMany(newSeats);

        }
      }
    }

    const available = seats.filter(s => s.status === "available");
    const locked = seats.filter(s => s.status === "locked");
    const booked = seats.filter(s => s.status === "booked");

    res.json({
      total_seats: seats.length,
      available: available.length,
      locked: locked.length,
      booked: booked.length,
      seats: seats.map(s => ({
        _id: s._id,
        row: s.row,
        column: s.column,
        status: s.status,
        seat_config_id: s.seat_config_id,
        locked_until: s.locked_until
      }))
    });

  } catch (error) {
    console.error("Get Available Seats Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ==========================
// GET BOOKING BY ID
// ==========================
export const getBookingById = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    let ticket = await Ticket.findOne({ _id: id, user_id })
      .populate({
        path: "show_id",
        populate: {
          path: "event_id",
          select: "title type category poster_url venue_id stadium_id",
          populate: [
            { path: "venue_id", select: "name city" },
            { path: "stadium_id", select: "name location city" }
          ]
        }
      })
      .populate({
        path: "show_id",
        populate: {
          path: "hall_id",
          select: "name venue_id stadium_id",
          populate: [
            { path: "venue_id", select: "name city" },
            { path: "stadium_id", select: "name location city" }
          ]
        }
      })
      .populate({
        path: "seats"
      })
      .populate("promo_code");

    if (!ticket) {
      const trainBooking = await TrainBooking.findOne({ _id: id, user_id });
      if (trainBooking) {
        return res.json({
          ...trainBooking.toObject(),
          isTrain: true
        });
      }
      return res.status(404).json({ message: "Booking not found" });
    }

    res.json(ticket);
  } catch (error) {
    console.error("Get Booking By ID Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// =====================================================
// HELPER: Get Recent Bookings (For Admin Dashboard)
// =====================================================
export const getRecentBookings = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const bookings = await Ticket.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user_id", "name email")
      .populate({
        path: "show_id",
        select: "title start_time poster_url event_id price",
        populate: {
          path: "event_id",
          select: "title poster_url category type"
        }
      })
      .populate("seats"); // Ensure seats are populated

    res.json({
      data: bookings,
      count: bookings.length
    });
  } catch (error) {
    console.error("Get Recent Bookings Error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Export default moved to end of file

// ==========================
// DELETE BOOKING (History)
// ==========================
export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const user_id = req.user.id;

    const ticket = await Ticket.findOne({ _id: id, user_id });
    if (!ticket) {
      return res.status(404).json({ message: "Ticket not found" });
    }

    // Only allow deleting cancelled/refunded/pending?
    // User asked for "Delete for the things I cancelled"
    if (ticket.status === 'booked') {
      return res.status(400).json({ message: "Cannot delete active bookings. Cancel them first." });
    }

    await Ticket.deleteOne({ _id: id });

    // If it was pending, ensure seats are unlocked (double check)
    if (ticket.status === 'pending') {
      await Seat.updateMany(
        { _id: { $in: ticket.seats } },
        { $set: { status: 'available', locked_by: null, locked_until: null } }
      );
    }

    res.json({ message: "Booking removed from history" });

  } catch (error) {
    console.error("Delete Booking Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export default {
  createBooking,
  confirmBooking,
  cancelBooking,
  getMyBookings,
  getAvailableSeats,
  getBookingById,
  getRecentBookings,
  deleteBooking
};