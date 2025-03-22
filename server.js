require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const nodemailer = require("nodemailer");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection
mongoose
    .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("MongoDB connected"))
    .catch((err) => console.log(err));

// Define Contact Schema
const contactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    subject: String,
    createdAt: { type: Date, default: Date.now },
});

const Contact = mongoose.model("Contact", contactSchema);

// Nodemailer transporter setup
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.ADMIN_EMAIL,
        pass: process.env.ADMIN_EMAIL_PASSWORD,
    },
});

// API Route to handle form submission
app.post("/contact", async (req, res) => {
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

const port = process.env.PORT || 4000;


// Start the server
const PORT = port|| 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
