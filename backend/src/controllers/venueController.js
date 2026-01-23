import Venue from "../models/Venue.js";

// Create Venue
export const createVenue = async (req, res) => {
    try {
        const { name, location, city, capacity, image, layout_image, description } = req.body;

        // Validation
        if (!name || !location || !city) {
            return res.status(400).json({
                message: "Name, location and city are required"
            });
        }

        // Check duplicate
        const exists = await Venue.findOne({ name });
        if (exists) {
            return res.status(400).json({
                message: "Venue with this name already exists"
            });
        }

        const venue = await Venue.create({
            name,
            location,
            city,
            capacity,
            image,
            layout_image,
            description
        });

        res.status(201).json({
            message: "Venue created successfully",
            venue
        });

    } catch (error) {
        console.error("Create Venue Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all venues
export const getVenues = async (req, res) => {
    try {
        const { search, is_active = true } = req.query;

        let query = { is_active };

        if (search) {
            query.$text = { $search: search };
        }

        const venues = await Venue.find(query)
            .populate('halls')
            .sort({ createdAt: -1 });

        res.json({
            count: venues.length,
            venues
        });
    } catch (error) {
        console.error("Get Venues Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get single venue with halls
export const getVenueById = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id)
            .populate('halls');

        if (!venue) {
            return res.status(404).json({ message: "Venue not found" });
        }

        res.json(venue);
    } catch (error) {
        console.error("Get Venue Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update venue
export const updateVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);

        if (!venue) {
            return res.status(404).json({ message: "Venue not found" });
        }

        // Update fields
        const allowedUpdates = [
            'name',
            'location',
            'city',
            'capacity',
            'image',
            'layout_image',
            'description',
            'is_active'
        ];

        allowedUpdates.forEach(field => {
            if (req.body[field] !== undefined) {
                venue[field] = req.body[field];
            }
        });

        await venue.save();

        res.json({
            message: "Venue updated successfully",
            venue
        });

    } catch (error) {
        console.error("Update Venue Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete venue (soft delete)
export const deleteVenue = async (req, res) => {
    try {
        const venue = await Venue.findById(req.params.id);

        if (!venue) {
            return res.status(404).json({ message: "Venue not found" });
        }

        // Soft delete
        venue.is_active = false;
        await venue.save();

        res.json({
            message: "Venue deleted successfully"
        });

    } catch (error) {
        console.error("Delete Venue Error:", error);
        res.status(500).json({ message: error.message });
    }
};