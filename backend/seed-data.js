import mongoose from "mongoose";
import Venue from "./src/models/Venue.js";
import Event from "./src/models/Event.js";
import EventCategory from "./src/models/EventCategory.js";
import "dotenv/config";

const seedData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Clear existing data
        await Venue.deleteMany({});
        await Event.deleteMany({});
        await EventCategory.deleteMany({});
        console.log("🧹 Cleared existing data");

        // 1. Create Venues
        await Venue.insertMany([
            {
                name: "Cairo Opera House",
                location: "Zamalek, Cairo",
                city: "Cairo",
                capacity: 1200,
                image: "https://images.unsplash.com/photo-1514306191717-45224512c2d0?q=80&w=2070&auto=format&fit=crop",
                description: "The main performing arts venue in Egypt.",
                is_active: true
            },
            {
                name: "El Sawy Culturewheel",
                location: "Zamalek, Cairo",
                city: "Cairo",
                capacity: 500,
                image: "https://images.unsplash.com/photo-1470229722913-7ea051c21359?q=80&w=2070&auto=format&fit=crop",
                description: "A comprehensive cultural center.",
                is_active: true
            },
            {
                name: "Cairo International Stadium",
                location: "Nasr City, Cairo",
                city: "Cairo",
                capacity: 75000,
                image: "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?q=80&w=2223&auto=format&fit=crop",
                description: "The largest stadium in Egypt.",
                is_active: true
            }
        ]);
        const venues = await Venue.find({});
        console.log(`🏟️ seeded ${venues.length} venues`);

        // 2. Create Categories
        await EventCategory.insertMany([
            { name: "Music", slug: "music", icon: "🎵" },
            { name: "Sports", slug: "sports", icon: "⚽" },
            { name: "Theater", slug: "theater", icon: "🎭" },
            { name: "Cinema", slug: "cinema", icon: "🎬" }
        ]);
        const categories = await EventCategory.find({});
        console.log(`📂 seeded ${categories.length} categories`);

        // Helpers
        const getCatId = (slug) => {
            const cat = categories.find(c => c.slug === slug);
            if (!cat) throw new Error(`Category not found: ${slug}`);
            return cat._id;
        };

        const getVenueId = (namePart) => {
            const venue = venues.find(v => v.name.includes(namePart));
            if (!venue) throw new Error(`Venue not found: ${namePart}`);
            return venue._id;
        };

        // 3. Create Events
        await Event.insertMany([
            {
                title: "Omar Khairat Live",
                description: "A magical night with the legendary composer Omar Khairat.",
                category_id: getCatId("music"),
                venue_id: getVenueId("Opera"),
                type: "concert",
                duration_minutes: 120,
                poster_url: "https://images.unsplash.com/photo-1465847899078-b4905ad92803?q=80&w=2070&auto=format&fit=crop",
                release_date: new Date("2025-01-15"),
                is_active: true
            },
            {
                title: "Ahly vs Zamalek",
                description: "The biggest derby in Africa.",
                category_id: getCatId("sports"),
                venue_id: getVenueId("Stadium"),
                type: "sports",
                duration_minutes: 90,
                poster_url: "https://images.unsplash.com/photo-1579952363873-27f3bde9be51?q=80&w=2070&auto=format&fit=crop",
                release_date: new Date("2025-01-20"),
                is_active: true
            },
            {
                title: "Romeo & Juliet",
                description: "A modern adaptation of the classic play.",
                category_id: getCatId("theater"),
                venue_id: getVenueId("Opera"),
                type: "show",
                duration_minutes: 150,
                poster_url: "https://images.unsplash.com/photo-1503095392269-275d84793269?q=80&w=2070&auto=format&fit=crop",
                release_date: new Date("2025-02-01"),
                is_active: true
            },
            {
                title: "Underground Band Night",
                description: "Featuring Cairokee and Sharmoofers.",
                category_id: getCatId("music"),
                venue_id: getVenueId("Sawy"),
                type: "concert",
                duration_minutes: 180,
                poster_url: "https://images.unsplash.com/photo-1459749411177-04be3a4dd9ca?q=80&w=2070&auto=format&fit=crop",
                release_date: new Date("2025-01-10"),
                is_active: true
            },
            {
                title: "Interstellar 10th Anniversary",
                description: "Special IMAX screening.",
                category_id: getCatId("cinema"),
                venue_id: getVenueId("Sawy"),
                type: "movie",
                duration_minutes: 169,
                poster_url: "https://images.unsplash.com/photo-1440404653325-ab127d49abc1?q=80&w=2070&auto=format&fit=crop",
                release_date: new Date("2025-01-05"),
                is_active: true
            }
        ]);

        console.log("🎉 Events seeded successfully!");
        process.exit(0);

    } catch (error) {
        console.error("❌ Error seeding data:", error.message);
        process.exit(1);
    }
};

seedData();
