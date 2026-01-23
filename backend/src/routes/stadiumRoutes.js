import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import {
    createStadium,
    getStadiums,
    getStadiumById,
    updateStadium,
    deleteStadium
} from "../controllers/stadiumController.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();

router.route("/")
    .get(getStadiums)
    .post(protect, admin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'layout_image', maxCount: 1 }]), createStadium);

router.route("/:id")
    .get(getStadiumById)
    .put(protect, admin, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'layout_image', maxCount: 1 }]), updateStadium)
    .delete(protect, admin, deleteStadium);

export default router;
