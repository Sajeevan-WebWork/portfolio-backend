require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");
const Contact = require("./Models/Contact");

const app = express();

const allowedOrigins = ['https://sajeevan-web-dev.web.app', 'http://localhost:5000', 'http://localhost:5173'];

// CORS Middleware
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error("Not Allowed by CORS"))
        }
    }
}));

app.use(bodyParser.json());

const limiter = rateLimit({
    winddwMs: 15 * 60 * 1000,
    max: 100,
    message: "To many requests from this IP, Please try again later.",
})

app.use(limiter)

app.use((req, res, next) => {
    const origin = req.get('origin')
    const referer = req.get('referer')

    if (origin && !allowedOrigins.includes(origin)) {
        return res.status(403).json({ error: 'Access forbidden: Invalid Origin' })
    }

    if (
        referer &&
        !referer.startsWith('http://localhost:5173') &&
        !referer.startsWith('https://sajeevan-web-dev.web.app')
    ) {
        return res.status(403).json({ error: 'Access forbidden: Invalid Origin' });
    }

    next();
})

// API Key Authentication Middleware
app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'];

    if (apiKey !== process.env.API_SECRET_KEY) {
        return res.status(403).json({ error: "Access Denied: Invalid API Key" });
    }

    next();
});


// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));



// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
    },
});

// API Route to handle form submission
app.post("/api/contact", async (req, res) => {
    try {
        const { name, email, message, subject } = req.body;

        // Save data to MongoDB
        const newContact = new Contact({ name, email, message, subject });
        await newContact.save();

        // Email to Admin
        const adminMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: process.env.ADMIN_EMAIL, // Send to Admin
            subject: "New Contact Inquiry",
            html: `<h2><strong>Name:</strong> ${name}</h2>
             <h3><strong>Email:</strong> ${email}<h3>
             <h3><strong>Message:</strong> ${message}</h3>
             <h3><strong>Subject:</strong> ${subject}</h3>`
        };

        // Email to User
        const userMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: email,
            subject: "Thank You for Contacting Us",
            html: `<p>Dear ${name},</p>
             <p>Thank you for reaching out! We will get back to you soon.</p>
             <p>Best Regards,</p>
             <p>Sajeevan Techwork</p>`,

            // html: HtmlTemplate
        };

        // Send emails
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);

        res.status(200).json({ message: "Submission successful! ✅😊" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

app.get("/", (req, res) => {
    res.send("<h1>API is Running successfully</h1>")
})


// Start the server
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
