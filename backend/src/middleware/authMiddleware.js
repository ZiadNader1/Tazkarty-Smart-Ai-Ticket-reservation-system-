import jwt from "jsonwebtoken";
import User from "../models/User.js";


export const protect = async (req, res, next) => {
  let token;

  try {
    // Check header
    if (req.headers.authorization && req.headers.authorization.startsWith("Bearer")) {
      token = req.headers.authorization.split(" ")[1];



      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);


      // Find logged user
      req.user = await User.findById(decoded.id).select("-password");

      if (!req.user) {

        return res.status(401).json({ error: "Not authorized, user not found!" });
      }


      next();
    } else {

      return res.status(401).json({ error: "Not authorized, no token!" });
    }
  } catch (error) {

    return res.status(401).json({ error: "Token invalid!" });
  }
};

// Check for admin role
export const admin = (req, res, next) => {

  if (req.user && req.user.role === "admin") {

    next();
  } else {

    res.status(401).json({ error: "Not authorized as an admin" });
  }
};
