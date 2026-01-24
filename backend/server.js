import express from "express";
import mongoose from "mongoose";
import "dotenv/config";
import cors from "cors";
import { createServer } from "http";
import cron from "node-cron";

// Services
import { initializeSocket } from "./src/services/socketService.js";

// Routes
import userRoutes from "./src/routes/userRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import venueRoutes from "./src/routes/venueRoutes.js";
import hallRoutes from "./src/routes/hallRoutes.js";
import seatRoutes from "./src/routes/seatRoutes.js";
import bookingRoutes from "./src/routes/ticketRoutes.js";
import eventCategoryRoutes from "./src/routes/eventCategoryRoutes.js";
import promoCodeRoutes from "./src/routes/promoCodeRoutes.js";
import showRoutes from "./src/routes/showRoutes.js";
import seatCategoryRoutes from "./src/routes/seatCategoryRoutes.js";
import reviewRoutes from "./src/routes/reviewRoutes.js";
import paymentRoutes from "./src/routes/paymentRoutes.js";
import notificationRoutes from "./src/routes/notificationRoutes.js";
import searchHistoryRoutes from "./src/routes/searchHistoryRoutes.js";
import aiConversationRoutes from "./src/routes/aiConversationRoutes.js";
import recommendationRoutes from "./src/routes/recommendationRoutes.js";
import seatLockRoutes from "./src/routes/seatLockRoutes.js";
import analyticsRoutes from "./src/routes/analyticsRoutes.js";
import eventRoutes from "./src/routes/eventRoutes.js";
import stadiumRoutes from "./src/routes/stadiumRoutes.js";
import trainRoutes from "./src/routes/trainRoutes.js";

// Middleware
import { errorHandler, notFound } from "./src/middleware/errorHandler.js";

// Models
import Seat from "./src/models/Seat.js";

// dotenv.config() called via import

const app = express();
const httpServer = createServer(app);

// ===== INITIALIZE SOCKET.IO =====
initializeSocket(httpServer);

// ===== MIDDLEWARES =====
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      "http://localhost:3000",
      "http://localhost:4200",
      "https://tazkartyapp.netlify.app",
      process.env.FRONTEND_URL
    ].filter(Boolean).map(url => url.replace(/\/$/, "")); // Remove trailing slashes

    // Allow Netlify subdomains and the explicit origins
    const isAllowed = allowedOrigins.includes(origin) ||
      (origin && origin.endsWith('.netlify.app')) ||
      (origin && origin.endsWith('.vercel.app'));

    if (!isAllowed) {
      console.log('Blocked by CORS:', origin);
      return callback(null, false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// ⚠️ IMPORTANT: Webhook route MUST be before express.json()
app.use("/api/payments/webhook", express.raw({ type: 'application/json' }));

// Normal JSON parsing for other routes
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logger (Development only)
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.path}`);
    next();
  });
}

// ===== CRON JOBS =====
// Auto-unlock expired seat locks (every minute)
cron.schedule('* * * * *', async () => {
  try {
    const result = await Seat.updateMany(
      {
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

    if (result.modifiedCount > 0) {
      console.log(`🔓 Auto-unlocked ${result.modifiedCount} expired seats`);
    }
  } catch (error) {
    console.error('❌ Cron job error:', error);
  }
});

// ===== ROUTES =====
app.get("/", (req, res) => {
  res.json({
    message: "🎟️ Tazkarty API is running",
    version: "2.0.0",
    features: ["Stripe Payments", "Socket.IO Notifications", "Auto Seat Unlocking"]
  });
});

app.use("/api/users", userRoutes);
app.use("/api/admins", adminRoutes);
app.use("/api/venues", venueRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/halls", hallRoutes);
app.use("/api/seats", seatRoutes);
app.use("/api/bookings", bookingRoutes);
app.use("/api/event-categories", eventCategoryRoutes);
app.use("/api/promocodes", promoCodeRoutes);
app.use("/api/shows", showRoutes);
app.use("/api/seat-categories", seatCategoryRoutes);
app.use("/api/reviews", reviewRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/search-history", searchHistoryRoutes);
app.use("/api/ai-conversation", aiConversationRoutes);
app.use("/api/recommendations", recommendationRoutes);
app.use("/api/seat-lock", seatLockRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/stadiums", stadiumRoutes);
app.use("/api/trains", trainRoutes);

// Static Uploads Folder
import path from "path";
const __dirname = path.resolve();
app.use("/uploads", express.static(path.join(__dirname, "/uploads")));

// ===== ERROR HANDLING =====
app.use(notFound);
app.use(errorHandler);

// ===== DATABASE CONNECTION =====
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
    console.log(`📂 DB URI: ${process.env.MONGO_URI.substring(0, 25)}...`);

    // Start Server
    const PORT = process.env.PORT || 5000;
    httpServer.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`💳 Stripe Integration: Enabled`);
      console.log(`🔌 Socket.IO: Active`);
      console.log(`⏰ Cron Jobs: Running`);
    });
  })
  .catch((err) => {
    console.error("❌ DB Connection Error:", err.message);
    process.exit(1);
  });

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('❌ Unhandled Rejection:', err.message);
  httpServer.close(() => process.exit(1));
});