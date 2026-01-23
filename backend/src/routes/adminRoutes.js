import express from "express";
import { 
    registerAdmin, 
    loginAdmin, 
    getAdminProfile, 
    updateAdminProfile 
} from "../controllers/adminController.js";

import { protectAdmin } from "../middleware/adminMiddleware.js";

const router = express.Router();

router.post("/register", registerAdmin);
router.post("/login", loginAdmin);

// Protected Admin Routes
router.get("/profile", protectAdmin, getAdminProfile);
router.put("/update", protectAdmin, updateAdminProfile);

export default router;
