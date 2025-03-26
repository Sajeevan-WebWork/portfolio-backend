const mongoose = require("mongoose");

const ContactSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    subject: String,
}, { timestamps: true });

module.exports = mongoose.model("Contact", ContactSchema);
