import mongoose from "mongoose";
import Event from "../models/Event.js";
import EventCategory from "../models/EventCategory.js";
import Stadium from "../models/Stadium.js";
import Show from "../models/Show.js";
import Hall from "../models/Hall.js";

// Helper to ensure a Show exists for Sports events
const ensureSportsShow = async (event) => {
    if (event.type !== 'sports' || !event.stadium_id) return;

    // Check if show already exists
    const existingShow = await Show.findOne({ event_id: event._id });
    if (existingShow) return;

    // Find a default hall for the stadium (usually the whole stadium is one "hall" or we pick the first section)
    // Actually, for booking, we just need *any* valid show record linked to the event.
    // Ideally, we'd have a specific "General" hall or iterate halls.
    // For now, let's pick the first hall found for this stadium to attach the show to.
    const hall = await Hall.findOne({ stadium_id: event.stadium_id });

    if (hall) {
        const endTime = new Date(event.release_date).getTime() + (event.duration_minutes * 60000);

        await Show.create({
            event_id: event._id,
            hall_id: hall._id,
            start_time: event.release_date,
            end_time: new Date(endTime),
            price: 100, // Default base price, though sections override this
            is_active: true
        });

    } else {
        console.warn(`No Hall found for Stadium ${event.stadium_id}, cannot auto-create Show.`);
    }
};

// Create Event
export const createEvent = async (req, res) => {
    try {
        const {
            title,
            description,
            category_id,
            venue_id,
            type,
            duration_minutes,
            poster_url,
            release_date,

            // Sports Fields
            championship_type,
            home_team,
            away_team,
            gates_open_at,
            total_capacity,
            home_capacity,
            away_capacity,
            stadium_id,
            is_featured
        } = req.body;

        let posterUrl = poster_url;
        let layoutImageUrl = null;

        if (req.files) {
            if (req.files.poster && req.files.poster[0]) {
                posterUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files.poster[0].filename}`;
            }
            if (req.files.layout_image && req.files.layout_image[0]) {
                layoutImageUrl = `${req.protocol}://${req.get('host')}/uploads/${req.files.layout_image[0].filename}`;
            }
        }

        // Validation - Require either venue_id OR stadium_id
        if (!title || !category_id || !type || (!venue_id && !stadium_id)) {
            return res.status(400).json({
                message: "Title, category, type, and either venue or stadium are required"
            });
        }

        const event = await Event.create({
            title,
            description,
            category_id,
            venue_id: venue_id || undefined, // undefined if empty string
            stadium_id: stadium_id || undefined,
            type,
            duration_minutes: Number(duration_minutes),
            poster_url: posterUrl,
            layout_image: layoutImageUrl, // Save layout image if provided
            release_date,
            championship_type,
            home_team,
            away_team,
            gates_open_at,
            total_capacity: Number(total_capacity),
            home_capacity: Number(home_capacity),
            away_capacity: Number(away_capacity),
            is_featured: is_featured === 'true' || is_featured === true
        });

        // Auto-create Show for Sports
        await ensureSportsShow(event);

        res.status(201).json({
            message: "Event created successfully",
            event
        });
    } catch (error) {
        console.error("Create Event Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get All Events with filters
export const getEvents = async (req, res) => {
    try {
        const {
            category,
            type,
            venue,
            search,
            team,
            stadium,
            championship_type,
            is_featured,
            is_active = true
        } = req.query;



        // 1. Basic Filters
        let query = { is_active: is_active === 'true' || is_active === true };

        // 2. Category Filter
        if (category) {
            if (category.toLowerCase() === 'entertainment') {
                // Special Case: Entertainment = Everything NOT Sports
                const sportsCat = await EventCategory.findOne({ name: 'Sports' });
                if (sportsCat) {
                    query.category_id = { $ne: sportsCat._id };
                }
            } else if (mongoose.Types.ObjectId.isValid(category)) {
                query.category_id = category;
            } else {
                const categoryDoc = await EventCategory.findOne({
                    name: { $regex: new RegExp(`^${category}$`, 'i') }
                });
                query.category_id = categoryDoc ? categoryDoc._id : null;
            }
        }

        // 3. Type & Venue
        if (type) query.type = type;
        if (venue) query.venue_id = venue;

        // 4. Sports Filters (The "Clean" Implementation)

        // Team Filter: Search in Home OR Away
        if (team && team !== 'All') {
            const teamRegex = new RegExp(team.trim(), 'i');
            query.$or = [
                { home_team: { $regex: teamRegex } },
                { away_team: { $regex: teamRegex } }
            ];
        }

        // Stadium Filter: Name lookup -> ID
        if (stadium && stadium !== 'All') {
            if (mongoose.Types.ObjectId.isValid(stadium)) {
                query.stadium_id = stadium;
            } else {
                const stadiumDoc = await Stadium.findOne({
                    name: { $regex: new RegExp(stadium.trim(), 'i') }
                });
                if (stadiumDoc) {
                    query.stadium_id = stadiumDoc._id;
                } else {
                    // If stadium name provided but not found, ensure no results matching invalid stadium
                    query.stadium_id = new mongoose.Types.ObjectId();
                }
            }
        }

        // Tournament Filter
        if (championship_type && championship_type !== 'All') {
            query.championship_type = championship_type;
        }

        // Feature Filter
        if (is_featured !== undefined) {
            query.is_featured = is_featured === 'true' || is_featured === true;
        }

        // 5. Improved Text Search (Regex for partial matches)
        if (search) {
            const searchRegex = new RegExp(search.trim(), 'i');
            const searchConditions = [
                { title: { $regex: searchRegex } },
                { description: { $regex: searchRegex } }
            ];

            if (query.$or) {
                // Both team filter AND text search are present
                const teamCondition = { $or: query.$or };
                const searchCondition = { $or: searchConditions };
                delete query.$or;
                query.$and = [teamCondition, searchCondition];
            } else {
                query.$or = searchConditions;
            }
        }


        // Execute Query
        const events = await Event.find(query)
            .populate("venue_id", "name location")
            .populate("stadium_id", "name location city")
            .populate("category_id", "name")
            .sort({ createdAt: -1 });

        res.json({
            data: events,
            meta: {
                total: events.length,
                page: 1,
                limit: events.length,
                pages: 1
            }
        });
    } catch (error) {
        console.error("Get Events Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get Single Event
export const getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id)
            .populate("venue_id")
            .populate("stadium_id")
            .populate("category_id");

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        res.json(event);
    } catch (error) {
        console.error("Get Event Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update Event
export const updateEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Update fields
        const allowedUpdates = [
            'title',
            'description',
            'category_id',
            'venue_id',
            'type',
            'duration_minutes',
            'poster_url',
            'layout_image', // Add to allowed updates
            'release_date',
            'is_active',
            'championship_type',
            'home_team',
            'away_team',
            'gates_open_at',
            'total_capacity',
            'home_capacity',
            'away_capacity',
            'stadium_id'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                // Fix for empty strings on ObjectId fields
                if (['venue_id', 'stadium_id', 'category_id'].includes(field) && req.body[field] === '') {
                    event[field] = undefined;
                } else {
                    event[field] = req.body[field];
                }
            }
        });

        // Handle file uploads for update (MOVED AFTER BODY UPDATES TO PREVENT OVERWRITE)
        if (req.files) {
            if (req.files.poster && req.files.poster[0]) {
                event.poster_url = `${req.protocol}://${req.get('host')}/uploads/${req.files.poster[0].filename}`;
            }
            if (req.files.layout_image && req.files.layout_image[0]) {
                event.layout_image = `${req.protocol}://${req.get('host')}/uploads/${req.files.layout_image[0].filename}`;
            }
        }

        await event.save();

        // Auto-create/Fix Show for Sports
        await ensureSportsShow(event);

        res.json({
            message: "Event updated successfully",
            event
        });
    } catch (error) {
        console.error("Update Event Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete Event (Soft delete)
export const deleteEvent = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: "Event not found" });
        }

        // Soft delete
        event.is_active = false;
        await event.save();

        res.json({
            message: "Event deleted successfully"
        });
    } catch (error) {
        console.error("Delete Event Error:", error);
        res.status(500).json({ message: error.message });
    }
};