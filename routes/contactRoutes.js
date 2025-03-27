
const express = require("express");
const router = express.Router();
const Contact = require("../models/Contact");
const transporter = require("../config/mailer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");


const generateTokenAndSetCookie = async (res, userId) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    });

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return token;
};


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
        // Check if user already exists
        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res.status(400).json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = Math.floor(10000 + Math.random() * 900000).toString();

        const user = new User({
            email,
            password: hashedPassword,
            name,
            verificationToken,
            verificationTokenExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
        });

        await user.save();

        const sendVerificationEmail = {
            from: process.env.ADMIN_EMAIL,
            to: email,
            subject: `${name}, Verify your email`,
            // html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            html: `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Onboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            background-color: #4CAF50;
            color: white;
            padding: 15px 0;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
        }
        .content {
            padding: 20px;
            color: #555555;
            line-height: 1.6;
        }
        .content p {
            margin: 0 0 15px;
        }
        .footer {
            text-align: center;
            padding: 10px 0;
            font-size: 12px;
            color: #777777;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome Onboard!</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome to Sajeevan Techwork! We are thrilled to have you join our community.</p>
            <p>we are dedicated to providing you with the best experience possible. If you have any questions or need assistance, feel free to reach out at any time.</p>
            <p>Click below to explore your account and get started:</p>
            <a href="https://sajeevan-web-dev.web.app/" target="_blank" class="button">Get Started</a>
            <p>We look forward to your journey with us!</p>
            <p>Warm regards,</p>
            <p>Sajeevan</p>
        </div>
        <div class="footer">
            &copy; Sajeevan. All rights reserved.
        </div>
    </div>
</body>
</html>
`

        };


        await transporter.sendMail(sendVerificationEmail);

        const token = await generateTokenAndSetCookie(res, user._id);

        res.status(201).json({
            success: true,
            message: "User Created Successfully. Please check your email for verification.",
            user: {
                ...user._doc,
                password: undefined, // Don't return password in response
            },
            token,
        });

    } catch (error) {
        console.error("Signup error:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

router.post("/verify-email", async (req, res) => {
    const { code, email, name } = req.body;

    try {
        const user = await User.findOne({
            verificationToken: code,
            verificationTokenExpiresAt: { $gt: Date.now() }
        })

        if (!user) {
            return res.status(400).json({
                success: false,
                message: "Invalid or expired verification code"
            })
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        user.verificationTokenExpiresAt = undefined;

        await user.save();

        const sendWelcomeEmail = {
            from: process.env.ADMIN_EMAIL,
            to: email,
            subject: `Welcome onboard`,
            // html: VERIFICATION_EMAIL_TEMPLATE.replace("{verificationCode}", verificationToken),
            html: `
            <!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome Onboard</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f4f4f4;
        }
        .email-container {
            max-width: 600px;
            margin: 20px auto;
            background-color: #ffffff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            background-color: #4CAF50;
            color: white;
            padding: 15px 0;
            border-radius: 8px 8px 0 0;
        }
        .header h1 {
            margin: 0;
        }
        .content {
            padding: 20px;
            color: #555555;
            line-height: 1.6;
        }
        .content p {
            margin: 0 0 15px;
        }
        .footer {
            text-align: center;
            padding: 10px 0;
            font-size: 12px;
            color: #777777;
        }
        .button {
            display: inline-block;
            padding: 10px 20px;
            background-color: #4CAF50;
            color: white;
            text-decoration: none;
            border-radius: 4px;
            margin-top: 15px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header">
            <h1>Welcome Onboard!</h1>
        </div>
        <div class="content">
            <p>Hi ${name},</p>
            <p>Welcome to Sajeevan Techwork! We are thrilled to have you join our community.</p>
            <p>we are dedicated to providing you with the best experience possible. If you have any questions or need assistance, feel free to reach out at any time.</p>
            <p>Click below to explore your account and get started:</p>
            <a href="https://sajeevan-web-dev.web.app/" target="_blank" class="button">Get Started</a>
            <p>We look forward to your journey with us!</p>
            <p>Warm regards,</p>
            <p>Sajeevan</p>
        </div>
        <div class="footer">
            &copy; Sajeevan. All rights reserved.
        </div>
    </div>
</body>
</html>

            `

        };

        await transporter.sendMail(sendWelcomeEmail);


        res.status(200).json({
            success: true,
            message: "Email verified successfully",
            user: {
                ...user._doc,
                password: undefined
            }
        })

    } catch (error) {
        console.log("error in ", error);
        res.status(500).json({
            success: false,
            message: "server error:", error
        })
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
