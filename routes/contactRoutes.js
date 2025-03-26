
const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const transporter = require("../config/mailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User")

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
        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);

        res.status(200).json({ message: "Submission successful! ✅😊" });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Something went wrong" });
    }
});


router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: "User already exists" })

        const salt = await bcrypt.genSalt(10);
        const hashePassword = await bcrypt.hash(password, salt)

        user = new User({ name, email, password: hashePassword })
        await user.save();

        res.status(201).json({ message: "User registered successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }

})

router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email })
        if (!user) return res.status(400).json({ message: "Invalid Credentials" })

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Invalid Credentials" })

        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: "1h"
        });

        res.json({
            token, user: {
                id: user._id,
                name: user.name,
                email: user.email,
            }
        })

    } catch (error) {
        res.status(500).json({ message: "Server Error", error });
    }
})

module.exports = router;
