import mongoose from "mongoose";

const stadiumSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Stadium name is required'],
        trim: true,
        unique: true
    },
    location: {
        type: String,
        required: [true, 'Location is required'],
        trim: true
    },
    city: {
        type: String,
        required: [true, 'City is required'],
        trim: true
    },
    capacity: {
        type: Number,
        min: [1, 'Capacity must be at least 1']
    },
    image: {
        type: String,
        trim: true
    },
    layout_image: {
        type: String, // 2D layout image
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    is_active: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual for halls/sections (if generic Halls are used, they can still reference 'venue_id' as 'stadium_id' or we can add 'stadium_id' to Hall model.
// For now, assuming Hall model still uses 'venue_id', we might need to duplicate Hall logic or alias it.
// However, the cleanest way is if Hall has both venue_id and stadium_id (mutually exclusive) OR we treat stadium as a type of provider.
// Given the user wants them SEPARATE, I will assume we will link Halls to Stadiums later or now. 
// For now, let's keep the schema simple. If the user adds Halls to Stadiums, we need to update Hall model to support stadium_id.
// But checking the frontend code, it reuses 'halls'.
// Let's add a virtual for 'halls' but we need to ensure Halls can reference Stadiums.
// Since Hall model likely has 'venue_id', we will need to update Hall model to also support 'stadium_id' OR we just use 'venue_id' field in Hall to store Stadium ID (polymorphic relation or just loose ref).
// To avoid breaking existing references, let's strictly follow the request: Separate.

// For now, I will NOT add the halls virtual until I update the Hall model, or I will add it assuming we will fix the relation.
// Actually, let's check Hall model.
// Virtual for halls
stadiumSchema.virtual('halls', {
    ref: 'Hall',
    localField: '_id',
    foreignField: 'stadium_id'
});

stadiumSchema.index({ name: 'text', location: 'text', city: 'text' });

export default mongoose.model("Stadium", stadiumSchema);
