import Contact from "../models/contact.model.js";
import { sendContactEmail } from "../utils/emailService.js";

export const sendContactMessage = async (req, res) => {
  try {
    const { name, email, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ message: "name, email and message are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({ message: "Invalid email address" });
    }

    if (message.trim().length < 10) {
      return res.status(400).json({ message: "Message must be at least 10 characters" });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();

    const contact = await Contact.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    });

    // Fire-and-forget: send feedback email to website owner
    sendContactEmail({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
    }).catch((err) => console.error("Contact email error:", err.message));

    return res.status(201).json({
      message: "Feedback sent successfully. We'll get back to you soon!",
      id: contact._id,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
