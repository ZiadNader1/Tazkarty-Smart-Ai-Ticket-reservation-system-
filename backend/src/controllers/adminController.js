import Admin from "../models/AdminModel.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Generate Token
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, {
        expiresIn: "7d",
    });
};


export const registerAdmin = async (req, res) => {
    try {
        const { name, email, password, role } = req.body;

        const exists = await Admin.findOne({ email });
        if (exists) return res.status(400).json({ message: "Admin already exists" });

        const hashed = await bcrypt.hash(password, 10);

        const admin = await Admin.create({
            name,
            email,
            password: hashed,
            role
        });

        res.json({ message: "Admin created", admin });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const loginAdmin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const admin = await Admin.findOne({ email });
        if (!admin) return res.status(400).json({ message: "Admin not found" });

        const match = await bcrypt.compare(password, admin.password);
        if (!match) return res.status(400).json({ message: "Invalid password" });

        const token = jwt.sign(
            { id: admin._id, role: admin.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.json({
            message: "Admin login successful",
            token
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// GET Admin Profile
export const getAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id).select("-password");

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        res.json(admin);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// UPDATE Admin Profile
export const updateAdminProfile = async (req, res) => {
    try {
        const admin = await Admin.findById(req.admin.id);

        if (!admin) {
            return res.status(404).json({ message: "Admin not found" });
        }

        admin.name = req.body.name || admin.name;
        admin.email = req.body.email || admin.email;
        admin.role = req.body.role || admin.role;

        if (req.body.password) {
            admin.password = await bcrypt.hash(req.body.password, 10);
        }

        await admin.save();

        res.json({
            message: "Profile updated successfully",
            admin: admin,
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
