require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");

// Import custom modules
const connectDB = require("./config/db");
const corsOptions = require("./config/corsOptions");
const limiter = require("./middlewares/rateLimiter");
const authMiddleware = require("./middlewares/authMiddleware");
const contactRoutes = require("./routes/contactRoutes");

const app = express();

// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(limiter);
app.use(authMiddleware);

// Connect to MongoDB
connectDB();

// Routes
app.use("/api", contactRoutes);

// Root route
app.get("/", (req, res) => {
    res.send("<h1>API is Running successfully</h1>");
});

// Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
