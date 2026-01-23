import Payment from "../models/Payment.js";
import Ticket from "../models/Ticket.js";
import Seat from "../models/Seat.js";
import PromoCode from "../models/PromoCode.js";
import Notification from "../models/Notification.js";
import TrainBooking from "../models/TrainBooking.js";
import TrainSeat from "../models/TrainSeat.js";
import qrcode from "qrcode";
import {
  createPaymentIntent,
  confirmPaymentIntent,
  createRefund,
  verifyWebhookSignature
} from "../services/stripeService.js";
import {
  sendNotificationToUser,
  sendPaymentUpdate,
  sendTicketUpdate
} from "../services/socketService.js";

/**
 * Create Payment Intent (Step 1)
 */
export const createPaymentSession = async (req, res) => {
  try {
    const { ticketId } = req.body;
    const userId = req.user.id;

    // Step A: Try finding entertainment ticket
    let ticket = await Ticket.findOne({
      _id: ticketId,
      user_id: userId,
      status: "pending"
    }).populate('show_id');

    let bookingType = 'ticket';

    // Step B: If not found, try finding train booking
    if (!ticket) {
      ticket = await TrainBooking.findOne({
        _id: ticketId,
        user_id: userId,
        status: "pending"
      });
      bookingType = 'train';
    }

    if (!ticket) {
      return res.status(404).json({ message: "Pending booking not found" });
    }

    // Check if payment already exists
    let payment = await Payment.findOne({ ticket_id: ticketId });


    // Self-healing: Delete invalid payment records
    if (payment && !payment.transaction_id) {
      console.warn('[DEBUG] Invalid payment detected (missing transaction_id). Deleting...');
      await Payment.findByIdAndDelete(payment._id);
      payment = null;
    }

    let clientSecret = "";

    if (!payment) {

      // Create Stripe Payment Intent
      const paymentIntent = await createPaymentIntent(
        ticket.total_price,
        'usd',
        {
          ticketId: ticket._id.toString(),
          userId: userId.toString(),
          type: bookingType,
          trainNumber: ticket.train_number || 'N/A'
        }
      );


      clientSecret = paymentIntent.client_secret;

      // Create Payment record
      payment = await Payment.create({
        user_id: userId,
        ticket_id: ticketId,
        amount: ticket.total_price,
        method: "stripe",
        status: "pending",
        transaction_id: paymentIntent.id
      });


    } else {

      const paymentIntent = await confirmPaymentIntent(payment.transaction_id);

      clientSecret = paymentIntent.client_secret;
    }

    res.json({
      clientSecret: clientSecret,
      payment,
      ticket
    });

  } catch (error) {
    console.error("Create Payment Session Error (Detailed):", error);

    // Log to file for AI Agent visibility
    const fs = await import('fs');
    const path = await import('path');
    const logPath = path.resolve('debug_error.log');
    const logEntry = `\n[${new Date().toISOString()}] Error: ${error.message}\nStack: ${error.stack}\nTicketID: ${req.body.ticketId}\n`;
    fs.appendFileSync(logPath, logEntry);

    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

/**
 * Confirm Payment (Step 2 - Called after successful payment)
 */
export const confirmPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const userId = req.user.id;

    // Verify payment with Stripe
    const paymentIntent = await confirmPaymentIntent(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        message: "Payment not completed",
        status: paymentIntent.status
      });
    }

    // Find payment record
    const payment = await Payment.findOne({
      transaction_id: paymentIntentId
    });

    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    // Update payment status
    payment.status = "paid";
    await payment.save();

    // Find ticket OR train booking
    let ticket = await Ticket.findById(payment.ticket_id);
    let isTrain = false;

    if (!ticket) {
      ticket = await TrainBooking.findById(payment.ticket_id);
      isTrain = true;
    }

    if (!ticket) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!isTrain) {
      // Entertainment Seat Logic
      const seats = await Seat.find({
        _id: { $in: ticket.seats },
        locked_by: userId,
        locked_until: { $gt: new Date() }
      });

      if (seats.length !== ticket.seats.length) {
        await createRefund(paymentIntentId);
        payment.status = "refunded";
        await payment.save();
        return res.status(400).json({ message: "Seat lock expired. Payment refunded." });
      }

      await Seat.updateMany(
        { _id: { $in: ticket.seats } },
        { $set: { status: "booked", locked_by: null, locked_until: null } }
      );
    } else {
      // Train Seat Logic
      for (const s of ticket.seats) {
        const seat = await TrainSeat.findOne({
          train_number: ticket.train_number,
          travel_date: ticket.travel_date,
          carriage_number: s.carriage_number,
          seat_label: s.seat_label,
          locked_by: userId,
          locked_until: { $gt: new Date() }
        });

        if (!seat) {
          await createRefund(paymentIntentId);
          payment.status = "refunded";
          await payment.save();
          return res.status(400).json({ message: "Train seat lock expired. Payment refunded." });
        }
      }

      for (const s of ticket.seats) {
        await TrainSeat.findOneAndUpdate(
          {
            train_number: ticket.train_number,
            travel_date: ticket.travel_date,
            carriage_number: s.carriage_number,
            seat_label: s.seat_label
          },
          { $set: { status: "booked", locked_by: null, locked_until: null } }
        );
      }
    }

    // Generate QR Code
    const qrData = JSON.stringify({
      ticket_id: ticket._id,
      user_id: ticket.user_id,
      booking_type: isTrain ? 'train' : 'entertainment',
      train_number: ticket.train_number || null,
      seats: isTrain ? ticket.seats.map(s => `${s.carriage_number}-${s.seat_label}`) : ticket.seats,
      amount: ticket.total_price
    });

    const qr_url = await qrcode.toDataURL(qrData);

    // Update ticket
    ticket.status = "booked";
    ticket.isPaid = true;
    ticket.payment_id = payment._id;
    ticket.qr_code_url = qr_url;
    await ticket.save();

    // Increment promo usage
    if (ticket.promo_code) {
      await PromoCode.findByIdAndUpdate(
        ticket.promo_code,
        { $inc: { used_count: 1 } }
      );
    }

    // Create Notification in DB
    const notification = await Notification.create({
      user_id: userId,
      title: "🎉 Booking Confirmed!",
      message: `Your booking for ${ticket.seats.length} seat(s) is confirmed. Show starts soon!`,
      is_read: false
    });

    // Send Real-time Notification via Socket.IO
    sendNotificationToUser(userId, {
      title: notification.title,
      message: notification.message,
      type: "booking_confirmed",
      ticket_id: ticket._id
    });

    // Send Ticket Update
    sendTicketUpdate(userId, {
      action: "booked",
      ticket: ticket
    });

    res.json({
      message: "Payment confirmed! Booking successful.",
      ticket,
      payment,
      qr_code_url: qr_url
    });

  } catch (error) {
    console.error("Confirm Payment Error:", error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * Stripe Webhook Handler
 */
export const handleStripeWebhook = async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    // Verify webhook signature
    const event = verifyWebhookSignature(req.body, signature);



    switch (event.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(event.data.object);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(event.data.object);
        break;

      case 'charge.refunded':
        await handleRefund(event.data.object);
        break;

      default:

    }

    res.json({ received: true });

  } catch (error) {
    console.error('Webhook Error:', error);
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
};

/**
 * Handle Payment Success (from webhook)
 */
async function handlePaymentSuccess(paymentIntent) {
  const payment = await Payment.findOne({
    transaction_id: paymentIntent.id
  });

  if (payment && payment.status === 'pending') {
    payment.status = 'paid';
    await payment.save();

    // Send notification
    sendPaymentUpdate(payment.user_id, {
      status: 'success',
      payment_id: payment._id
    });


  }
}

/**
 * Handle Payment Failure
 */
async function handlePaymentFailure(paymentIntent) {
  const payment = await Payment.findOne({
    transaction_id: paymentIntent.id
  });

  if (payment) {
    payment.status = 'failed';
    await payment.save();

    // Unlock seats
    const ticket = await Ticket.findById(payment.ticket_id);
    if (ticket) {
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

      ticket.status = 'cancelled';
      await ticket.save();
    }

    // Send notification
    sendNotificationToUser(payment.user_id, {
      title: "❌ Payment Failed",
      message: "Your payment could not be processed. Please try again.",
      type: "payment_failed"
    });


  }
}

/**
 * Handle Refund
 */
async function handleRefund(charge) {
  const payment = await Payment.findOne({
    transaction_id: charge.payment_intent
  });

  if (payment) {
    payment.status = 'refunded';
    await payment.save();

    sendNotificationToUser(payment.user_id, {
      title: "💰 Refund Processed",
      message: "Your payment has been refunded successfully.",
      type: "refund_processed"
    });


  }
}

/**
 * Get All Payments (Admin)
 */
export const getAllPayments = async (req, res) => {
  try {
    const payments = await Payment.find()
      .populate("user_id", "name email")
      .populate("ticket_id")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get User Payments
 */
export const getUserPayments = async (req, res) => {
  try {
    const payments = await Payment.find({ user_id: req.params.userId })
      .populate("ticket_id")
      .sort({ createdAt: -1 });

    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};