
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    if (!authorization || !authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        message: "Access denied. No token provided."
      });
    }

    const token = authorization.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        message: "Access denied. Invalid token format."
      });
    }

    if (!process.env.JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.userId);

    if (!user) {
      return res.status(401).json({
        message: "User no longer exists."
      });
    }

    req.user = user;

    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Session expired. Please log in again."
      });
    }

    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid authentication token."
      });
    }

    console.error("Authentication error:", error.message);

    return res.status(500).json({
      message: "Authentication failed."
    });
  }
};

module.exports = protect;
