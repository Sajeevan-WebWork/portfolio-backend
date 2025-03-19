const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

// Define Contact Schema
const contactSchema = new mongoose.Schema({
  name: String,
  email: String,
  subject: String,
  message: String,
  createdAt: { type: Date, default: Date.now }
});

const Contact = mongoose.model("Contact", contactSchema);

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail", // Change for other services like SendGrid, SMTP
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

app.post('/', async (req, res) => {
  res.send("API is running")
})
// Handle Contact Form Submission
app.post("/api/contact", async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;

    // Save to Database
    const newContact = new Contact({ name, email, subject, message });
    await newContact.save();

    // Send Notification to Admin
    const adminMailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: "New Contact Form Submission",
      text: `New contact request from ${name} (${email})\n\nSubject: ${subject}\nMessage: ${message}`
    };

    await transporter.sendMail(adminMailOptions);

    // Send Thanks Email to User
    const userMailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thanks for Contacting Us",
      text: `Hello ${name},\n\nThanks for reaching out! We have received your message and will get back to you soon.\n\nBest Regards,`
    };

    await transporter.sendMail(userMailOptions);

    res.status(200).json({ message: "Form submitted successfully" });

  } catch (error) {
    console.error("Error submitting form:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start Server (Local Only)
if (process.env.NODE_ENV !== "production") {
  app.listen(5000, () => console.log("Server running on port 5000"));
}

// Export for Vercel
module.exports = app;
