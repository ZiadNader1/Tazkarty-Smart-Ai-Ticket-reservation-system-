import Stadium from "../models/Stadium.js";
import Hall from "../models/Hall.js";

// Create Stadium
export const createStadium = async (req, res) => {
    try {
        const { name, location, city, capacity, description } = req.body;

        let image = req.body.image;
        if (req.files && req.files.image) {
            image = `/uploads/${req.files.image[0].filename}`;
        }

        let layout_image = req.body.layout_image;
        if (req.files && req.files.layout_image) {
            layout_image = `/uploads/${req.files.layout_image[0].filename}`;
        }

        // Validation
        if (!name || !location || !city) {
            return res.status(400).json({
                message: "Name, location and city are required"
            });
        }

        // Check duplicate
        const exists = await Stadium.findOne({ name });
        if (exists) {
            return res.status(400).json({
                message: "Stadium with this name already exists"
            });
        }

        const stadium = await Stadium.create({
            name,
            location,
            city,
            capacity,
            image,
            layout_image,
            description
        });

        res.status(201).json({
            message: "Stadium created successfully",
            stadium
        });

    } catch (error) {
        console.error("Create Stadium Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Get all stadiums
export const getStadiums = async (req, res) => {
    try {
        const { search, is_active } = req.query;

        let query = {};
        if (is_active !== undefined) {
            query.is_active = is_active;
        }

        if (search) {
            query.$text = { $search: search };
        }

        const stadiums = await Stadium.find(query)
            .populate('halls')
            .sort({ createdAt: -1 });

        res.json({
            count: stadiums.length,
            stadiums
        });
    } catch (error) {
        console.error("Get Stadiums Error:", error);
        res.status(500).json({ message: error.message });
    }
};


// Get single stadium with halls
export const getStadiumById = async (req, res) => {
    try {
        const stadium = await Stadium.findById(req.params.id);

        if (!stadium) {
            return res.status(404).json({ message: "Stadium not found" });
        }

        // Manually fetch halls to be robust against venue_id vs stadium_id usage
        // This ensures we find sections even if they were created with generic venue_id

        const halls = await Hall.find({
            $or: [
                { stadium_id: stadium._id },
                { venue_id: stadium._id }
            ]
        });


        const result = stadium.toObject();
        result.halls = halls;

        res.json(result);
    } catch (error) {
        console.error("Get Stadium Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Update stadium
export const updateStadium = async (req, res) => {
    try {
        const stadium = await Stadium.findById(req.params.id);

        if (!stadium) {
            return res.status(404).json({ message: "Stadium not found" });
        }

        // Handle File Uploads
        if (req.files) {
            if (req.files.image) {
                req.body.image = `/uploads/${req.files.image[0].filename}`;
            }
            if (req.files.layout_image) {
                req.body.layout_image = `/uploads/${req.files.layout_image[0].filename}`;
            }
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
                stadium[field] = req.body[field];
            }
        });

        await stadium.save();

        res.json({
            message: "Stadium updated successfully",
            stadium
        });

    } catch (error) {
        console.error("Update Stadium Error:", error);
        res.status(500).json({ message: error.message });
    }
};

// Delete stadium (soft delete)
export const deleteStadium = async (req, res) => {
    try {
        const stadium = await Stadium.findById(req.params.id);

        if (!stadium) {
            return res.status(404).json({ message: "Stadium not found" });
        }

        // Soft delete
        stadium.is_active = false;
        await stadium.save();

        res.json({
            message: "Stadium deleted successfully"
        });

    } catch (error) {
        console.error("Delete Stadium Error:", error);
        res.status(500).json({ message: error.message });
    }
};
