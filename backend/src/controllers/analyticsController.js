import User from "../models/User.js";
import Ticket from "../models/Ticket.js";
import Event from "../models/Event.js";

// @desc    Get dashboard stats (Admins only)
// @route   GET /api/analytics/dashboard
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalActiveEvents = await Event.countDocuments({ is_active: true });
        const totalActiveSports = await Event.countDocuments({ is_active: true, type: 'sports' });

        // Calculate Total Revenue and Bookings
        const bookings = await Ticket.find({ status: 'booked' });
        const totalBookings = bookings.length;
        const totalRevenue = bookings.reduce((acc, booking) => acc + (booking.total_price || 0), 0);

        // Calculate Growth (vs last month)
        const now = new Date();
        const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        // This month stats
        const thisMonthBookings = await Ticket.find({
            status: 'booked',
            booking_time: { $gte: startOfThisMonth }
        });
        const thisMonthRevenue = thisMonthBookings.reduce((acc, b) => acc + (b.total_price || 0), 0);

        // Last month stats
        const lastMonthBookings = await Ticket.find({
            status: 'booked',
            booking_time: { $gte: startOfLastMonth, $lt: startOfThisMonth }
        });
        const lastMonthRevenue = lastMonthBookings.reduce((acc, b) => acc + (b.total_price || 0), 0);

        // Growth Calculation Helper
        const calcGrowth = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return parseFloat(((current - previous) / previous * 100).toFixed(1));
        };

        const revenueGrowth = calcGrowth(thisMonthRevenue, lastMonthRevenue);
        const bookingsGrowth = calcGrowth(thisMonthBookings.length, lastMonthBookings.length);

        // User growth
        const thisMonthUsers = await User.countDocuments({ createdAt: { $gte: startOfThisMonth } });
        const lastMonthUsers = await User.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } });
        const usersGrowth = calcGrowth(thisMonthUsers, lastMonthUsers);

        // Event growth
        const thisMonthEvents = await Event.countDocuments({ createdAt: { $gte: startOfThisMonth } });
        const lastMonthEvents = await Event.countDocuments({ createdAt: { $gte: startOfLastMonth, $lt: startOfThisMonth } });
        const eventsGrowth = calcGrowth(thisMonthEvents, lastMonthEvents);

        // Category Breakdown
        const categories = await Event.aggregate([
            {
                $group: {
                    _id: "$type",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Conversion rate
        const conversionRate = totalBookings > 0 ? (totalBookings / (totalUsers * 5) * 100).toFixed(1) : 0;

        res.status(200).json({
            total_revenue: totalRevenue,
            total_bookings: totalBookings,
            active_events: totalActiveEvents, // For general count
            active_sports: totalActiveSports, // For the specific sports card
            total_users: totalUsers,
            conversion_rate: parseFloat(conversionRate),
            categories: categories,
            revenueGrowth,
            bookingsGrowth,
            eventsGrowth,
            usersGrowth
        });
    } catch (error) {
        console.error("Dashboard Stats Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};


// @desc    Get revenue stats over time
// @route   GET /api/analytics/revenue
// @access  Private/Admin
export const getRevenueStats = async (req, res) => {
    try {
        const days = parseInt(req.query.days) || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const revenueData = await Ticket.aggregate([
            {
                $match: {
                    status: 'booked',
                    booking_time: { $gte: startDate }
                }
            },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$booking_time" } },
                    revenue: { $sum: "$total_price" },
                    bookings: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        res.status(200).json({
            data: revenueData.map(item => ({
                date: item._id,
                revenue: item.revenue,
                bookings: item.bookings
            }))
        });
    } catch (error) {
        console.error("Revenue Stats Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

// @desc    Get top performing events
// @route   GET /api/analytics/bookings
// @access  Private/Admin
export const getBookingStats = async (req, res) => {
    try {
        const topEvents = await Ticket.aggregate([
            { $match: { status: 'booked' } },
            {
                $group: {
                    _id: "$show_id",
                    total_bookings: { $sum: 1 },
                    total_revenue: { $sum: "$total_price" }
                }
            },
            { $sort: { total_bookings: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "shows",
                    localField: "_id",
                    foreignField: "_id",
                    as: "show_info"
                }
            },
            { $unwind: "$show_info" },
            {
                $lookup: {
                    from: "events",
                    localField: "show_info.event_id",
                    foreignField: "_id",
                    as: "event_info"
                }
            },
            { $unwind: "$event_info" },
            {
                $project: {
                    title: "$event_info.title",
                    type: "$event_info.type",
                    total_bookings: 1,
                    total_revenue: 1
                }
            }
        ]);

        res.status(200).json({
            top_events: topEvents
        });
    } catch (error) {
        console.error("Booking Stats Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
};

