import mongoose from "mongoose";
import nodemailer from "nodemailer";
import Contact from "../../models/Contact";

// MongoDB Connection
const connectDB = async () => {
    if (mongoose.connection.readyState >= 1) return;
    await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
};

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method Not Allowed" });
    }

    try {
        // Connect to the database
        await connectDB();

        const { name, email, message } = req.body;

        // Create and save the contact record in MongoDB
        const contact = new Contact({ name, email, message });
        await contact.save();

        // Nodemailer setup
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Email to Admin
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.ADMIN_EMAIL, // Your Admin Email
            subject: "New Contact Inquiry",
            text: `A new user contacted you.\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}\nDate: ${new Date()}`,
        });

        // Thank You Email to User
        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Thank You for Contacting Us!",
            text: `Hi ${name},\n\nThank you for reaching out. We will get back to you soon.\n\nBest Regards,\nYour Company`,
        });

        // Success response
        res.status(200).json({ message: "Form submitted successfully" });
    } catch (error) {
        console.error("Error submitting form:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
}
