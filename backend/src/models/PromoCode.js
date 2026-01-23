import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
  code: { 
    type: String, 
    unique: true,
    required: [true, 'Promo code is required'],
    uppercase: true,
    trim: true
  },
  discount_percentage: { 
    type: Number,
    required: [true, 'Discount percentage is required'],
    min: [1, 'Discount must be at least 1%'],
    max: [100, 'Discount cannot exceed 100%']
  },
  max_uses: { 
    type: Number,
    default: 100,
    min: [1, 'Max uses must be at least 1']
  },
  used_count: { 
    type: Number,
    default: 0,
    min: 0
  },
  valid_from: { 
    type: Date,
    default: Date.now
  },
  valid_to: { 
    type: Date,
    required: [true, 'Expiry date is required']
  },
  is_active: { 
    type: Boolean,
    default: true
  },
  // اختياري: تحديد على events معينة
  applicable_events: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event'
  }],
  // اختياري: تحديد على users معينة
  applicable_users: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, { 
  timestamps: true 
});

// Methods
promoCodeSchema.methods.isValid = function() {
  const now = new Date();
  return (
    this.is_active &&
    (!this.valid_from || now >= this.valid_from) &&
    (!this.valid_to || now <= this.valid_to) &&
    this.used_count < this.max_uses
  );
};

promoCodeSchema.methods.canBeUsedBy = function(userId) {
  if (this.applicable_users.length === 0) return true;
  return this.applicable_users.some(id => id.toString() === userId.toString());
};

// Index
promoCodeSchema.index({ code: 1, is_active: 1 });
promoCodeSchema.index({ valid_to: 1 });

export default mongoose.model("PromoCode", promoCodeSchema);