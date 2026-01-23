import PromoCode from "../models/PromoCode.js";

// Create promo
export const createPromoCode = async (req, res) => {
  try {
    const promo = await PromoCode.create(req.body);
    res.status(201).json(promo);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all promo codes
export const getPromoCodes = async (req, res) => {
  try {
    const list = await PromoCode.find();
    res.json(list);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get promo by ID
export const getPromoCodeById = async (req, res) => {
  try {
    const promo = await PromoCode.findById(req.params.id);
    if (!promo) return res.status(404).json({ message: "Promo not found" });

    res.json(promo);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update promo
export const updatePromoCode = async (req, res) => {
  try {
    const updated = await PromoCode.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Promo not found" });

    res.json(updated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete promo
export const deletePromoCode = async (req, res) => {
  try {
    const deleted = await PromoCode.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Promo not found" });

    res.json({ message: "Promo deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Apply promo code (validate)
export const applyPromoCode = async (req, res) => {
  try {
    const { code } = req.body;

    const promo = await PromoCode.findOne({ code });

    if (!promo) return res.status(404).json({ message: "Invalid code" });

    if (!promo.is_active)
      return res.status(400).json({ message: "Promo is not active" });

    const now = new Date();

    if (promo.valid_from && now < promo.valid_from)
      return res.status(400).json({ message: "Promo not started yet" });

    if (promo.valid_to && now > promo.valid_to)
      return res.status(400).json({ message: "Promo expired" });

    if (promo.used_count >= promo.max_uses)
      return res.status(400).json({ message: "Promo usage limit reached" });

    // If everything is valid
    res.json({
      discount_percentage: promo.discount_percentage,
      promo_id: promo._id
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
