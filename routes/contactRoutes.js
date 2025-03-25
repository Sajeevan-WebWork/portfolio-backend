const express = require("express");
const router = express.Router();

const transporter = require("../config/mailer");
const Contact = require("../Models/Contact");

router.post("/contact", async (req, res) => {
    try {
        const { name, email, message, subject } = req.body;

        // Save data to MongoDB
        const newContact = new Contact({ name, email, message, subject });
        await newContact.save();

        // Email to Admin
        const adminMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: process.env.ADMIN_EMAIL,
            subject: "New Contact Inquiry",
            html: `<h2><strong>Name:</strong> ${name}</h2>
                   <h3><strong>Email:</strong> ${email}</h3>
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
                   <p>Sajeevan Techwork</p>`
        };

        // Send emails
        // await transporter.sendMail(adminMailOptions);
        // await transporter.sendMail(userMailOptions);

        res.status(200).json({ message: "Submission successful! ✅😊" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});

module.exports = router;
