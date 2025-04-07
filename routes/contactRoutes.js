
const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const transporter = require("../config/mailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User")


// Portfolio Contact
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
            html: `
            <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Elegant Thank You Email</title>
  <link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600&family=Playfair+Display:wght@600&display=swap" rel="stylesheet">
  <style>
    body {
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #fdfcfb, #f5f4f0);
      font-family: 'Open Sans', sans-serif;
      color: #2b2b2b;
    }

    .email-container {
      max-width: 620px;
      margin: 60px auto;
      background-color: #ffffff;
      border-radius: 16px;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.06);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #16202a, #6b98f2);
      color: #fff8e7;
      padding: 50px 30px;
      text-align: center;
    }

    .header h1 {
      margin: 0;
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 600;
      letter-spacing: 1px;
color: #FFF;
    }

    .content {
      padding: 40px 30px;
    }

    .content h2 {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      margin-bottom: 16px;
      color: #2f2f2f;
    }

    .content p {
      font-size: 16px;
      line-height: 1.8;
      color: #444;
      margin: 12px 0;
    }

    .thankyou-block {
      background-color: #fff8e7;
      border-left: 5px solid #d4af37;
      padding: 24px;
      border-radius: 8px;
      margin: 30px 0;
      text-align: center;
    }

    .thankyou-block p {
      margin: 0;
      font-size: 18px;
      font-weight: 600;
      color: #6e4c1e;
    }

    .signature {
      margin-top: 40px;
      font-weight: 600;
      color: #2b2b2b;
    }

    .footer {
      background-color: #fafafa;
      text-align: center;
      padding: 20px;
      font-size: 13px;
      color: #aaa;
      border-top: 1px solid #eee;
    }

    @media (max-width: 640px) {
      .content, .header {
        padding: 20px;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>Thank You for Reaching Out</h1>
    </div>
    <div class="content">
      <h2>Hello Sajeevan,</h2>
      <p>We sincerely appreciate your message and the time you took to get in touch with us. Our team is reviewing your inquiry and we’ll respond to you as soon as possible.</p>

      <div class="thankyou-block">
        <p>Your trust means everything to us.</p>
      </div>

      <p>In the meantime, if you need anything else or have an update to your message, feel free to reply to this email directly.</p>

      <p class="signature">Warm regards,<br/>Sajeevan Techwork Team</p>
    </div>
    <div class="footer">
      &copy; 2025 Sajeevan Techwork. All rights reserved.
    </div>
  </div>
</body>
</html>


            `
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


        const adminMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: process.env.ADMIN_EMAIL,
            subject: `New User Signup Notification – ${name}`,
            html: `<h2><strong>Name:</strong> ${name}</h2>
                   <h3><strong>Email:</strong> ${email}</h3>`
        };

        const userMailOptions = {
            from: process.env.ADMIN_EMAIL,
            to: email,
            subject: "Welcome to login Auth – Thank You for Signing Up!",
            html:
                `
                <p>Hi ${name},</p>
                <p>Thank you for signing up with login Auth! 🎉 We're thrilled to have you on board.</p>
                <p>You're all set to explore . To get started, simply</p>
                <div>👉 <a href="https://login-auth-32bdd.web.app/login" target="_blank">Login</a></div>
                <p>Once again, welcome aboard!</p>
                <p>Sajeevan</p>
                <a hre="https://login-auth-32bdd.web.app/" target="_blank">login Auth</a>

                `
        }

        await transporter.sendMail(adminMailOptions);
        await transporter.sendMail(userMailOptions);

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
