import { MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

// Cache MongoDB client to reuse across function calls in a serverless environment
const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
    if (cachedClient && cachedDb) {
        return { client: cachedClient, db: cachedDb };
    }
    const client = await MongoClient.connect(uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    const db = client.db(process.env.MONGODB_DB);
    cachedClient = client;
    cachedDb = db;
    return { client, db };
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method not allowed' });
        return;
    }

    const { name, email, message } = req.body;

    // Validate required fields
    if (!name || !email || !message) {
        res.status(422).json({ message: 'Missing required fields' });
        return;
    }

    try {
        // Save the contact inquiry into MongoDB
        const { db } = await connectToDatabase();
        const newContact = {
            name,
            email,
            message,
            submittedAt: new Date(),
        };
        await db.collection('contacts').insertOne(newContact);

        // Configure nodemailer transporter with SMTP credentials
        let transporter = nodemailer.createTransport({
            host: process.env.EMAIL_HOST,
            port: parseInt(process.env.EMAIL_PORT),
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // Prepare the email to the site administrator
        const inquiryMailOptions = {
            from: process.env.EMAIL_FROM,
            to: process.env.ADMIN_EMAIL,
            subject: 'New Contact Inquiry',
            text: `You have a new contact inquiry:\n\nName: ${name}\nEmail: ${email}\nMessage: ${message}`,
        };

        // Prepare the thank-you email to the user
        const thankYouMailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Thank You for Contacting Us',
            text: `Dear ${name},\n\nThank you for reaching out. We have received your inquiry and will get back to you shortly.\n\nBest regards,\nYour Company Name`,
        };

        // Send both emails
        await transporter.sendMail(inquiryMailOptions);
        await transporter.sendMail(thankYouMailOptions);

        res.status(200).json({ message: 'Contact submitted successfully' });
    } catch (error) {
        console.error('Error processing contact form:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}
