const express = require("express");
const router = express.Router();
// Assuming these models/configs exist in your setup:
const Contact = require("../models/Contact"); // UNCOMMENTED
const transporter = require("../config/mailer"); // UNCOMMENTED
const User = require("../models/User") // UNCOMMENTED

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require("path");

// --- START: Performance Refactoring ---
// Read templates ONCE when the server starts, not on every request.
const TEMPLATES_DIR = path.join(__dirname, "templates");

// Ensure the templates directory exists or adjust the path if files are flat.
// For this example, we assume the templates are in a 'templates' folder.
let THANKYOU_TEMPLATE = '';
let INQUIRY_TEMPLATE = '';

try {
  // Read and cache template content
  THANKYOU_TEMPLATE = fs.readFileSync(path.join(TEMPLATES_DIR, "thankyouUserTemplate.html"), "utf-8");
  INQUIRY_TEMPLATE = fs.readFileSync(path.join(TEMPLATES_DIR, "inquiryEmailTemplate.html"), "utf-8");
  console.log("Email templates loaded and cached successfully.");
} catch (error) {
  console.error("CRITICAL ERROR: Failed to load email templates. Check path and file existence.", error);
  // In a real app, you might crash the process or set a fallback.
}
// --- END: Performance Refactoring ---


function thankyouEmailTemplate(name, subject, submittedAt) {
  if (!THANKYOU_TEMPLATE) return "Error loading template.";
  
  // Replace placeholders with actual data
  let htmlTemplate = THANKYOU_TEMPLATE
    .replace(/{{name}}/g, name)
    .replace(/{{subject}}/g, subject)
    .replace(/{{submittedAt}}/g, submittedAt);

  return htmlTemplate;
}


function InquiryEmailTemplate(name, email, message, subject, submittedAt) {
  if (!INQUIRY_TEMPLATE) return "Error loading template.";

  // Replace placeholders with actual data
  let htmlTemplate = INQUIRY_TEMPLATE
    .replace(/{{name}}/g, name)
    .replace(/{{email}}/g, email)
    .replace(/{{message}}/g, message)
    .replace(/{{subject}}/g, subject)
    .replace(/{{submittedAt}}/g, submittedAt);

  return htmlTemplate;
}

// Portfolio Contact
router.post("/contact", async (req, res) => {
  try {
    const { name, email, message, subject } = req.body;

    // Save data to MongoDB
    // This line caused the error when Contact was undefined.
    const newContact = new Contact({ name, email, message, subject });
    await newContact.save();

    // Email to Admin
    // const submittedAt = new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" });
    const submittedAt = new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata", year: "numeric", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", hour12: true });
    const adminMailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: "New Contact Inquiry",
      html: InquiryEmailTemplate(name, email, message, subject, submittedAt)
    };

    // Email to User
    const userMailOptions = {
      from: process.env.ADMIN_EMAIL,
      to: email,
      subject: `${name} Thank You for Contacting`,
      html: thankyouEmailTemplate(name, subject, submittedAt)
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


// Signup route with auto-login (JWT return) for better UX
router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: "User already exists" })

    const salt = await bcrypt.genSalt(10);
    const hashePassword = await bcrypt.hash(password, salt)

    user = new User({ name, email, password: hashePassword })
    await user.save();

    // 1. Generate JWT (auto-login)
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h"
    });

    // 2. Send Notifications (admin & user emails unchanged)
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

    // 3. Respond with token and user details
    res.status(201).json({
      message: "User registered successfully",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      }
    });
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
