require('dotenv').config();

const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1);

/* ---------------------------------------------------------
   Middleware
--------------------------------------------------------- */
app.use(express.json());

// Only allow requests from your actual frontend (set in .env)
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['POST', 'GET'],
}));

// Basic protection against spam/abuse: max 10 booking requests
// per 15 minutes, per IP address.
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Too many booking requests. Please try again later.' },
});

/* ---------------------------------------------------------
   Email transporter (Gmail SMTP via Nodemailer)
--------------------------------------------------------- */
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Verify the email connection on startup so problems show up
// immediately in the terminal, not on the first real booking.
transporter.verify((err) => {
  if (err) {
    console.error('❌ Email transporter error:', err.message);
    console.error('   Check EMAIL_USER / EMAIL_PASS in your .env file.');
  } else {
    console.log('✅ Email transporter ready.');
  }
});

/* ---------------------------------------------------------
   Helpers
--------------------------------------------------------- */
function escapeHtml(str = '') {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/* ---------------------------------------------------------
   Routes
--------------------------------------------------------- */

// Health check — useful to confirm the server is alive after deploying
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Panditji Online API is running.' });
});

// Main booking endpoint
app.post('/api/book-pandit', bookingLimiter, async (req, res) => {
  try {
    const { name, phone, email, pujaType, date, city, message } = req.body;

    // --- Validation ---
    if (!name || !phone || !pujaType || !date) {
      return res.status(400).json({
        error: 'Please provide name, phone, puja type, and date.',
      });
    }
    if (email && !isValidEmail(email)) {
      return res.status(400).json({ error: 'Please provide a valid email address.' });
    }
    if (!/^[\d\s()+-]{7,15}$/.test(phone)) {
      return res.status(400).json({ error: 'Please provide a valid phone number.' });
    }

    // --- Build the email to the pandit ---
    const pujaTypeSafe = escapeHtml(pujaType);
    const nameSafe = escapeHtml(name);
    const citySafe = escapeHtml(city || 'Not specified');
    const messageSafe = escapeHtml(message || 'None');

    const mailOptions = {
      from: `"Panditji Online" <${process.env.EMAIL_USER}>`,
      to: process.env.PANDIT_EMAIL,
      replyTo: email || undefined,
      subject: `New Booking Request: ${pujaTypeSafe} — ${nameSafe}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
          <h2 style="color:#B23A2E;">New Puja Booking Request</h2>
          <table style="width:100%; border-collapse: collapse;">
            <tr><td style="padding:8px 0; font-weight:bold; width:140px;">Puja Type</td><td>${pujaTypeSafe}</td></tr>
            <tr><td style="padding:8px 0; font-weight:bold;">Name</td><td>${nameSafe}</td></tr>
            <tr><td style="padding:8px 0; font-weight:bold;">Phone</td><td>${escapeHtml(phone)}</td></tr>
            <tr><td style="padding:8px 0; font-weight:bold;">Email</td><td>${email ? escapeHtml(email) : 'Not provided'}</td></tr>
            <tr><td style="padding:8px 0; font-weight:bold;">Preferred Date</td><td>${escapeHtml(date)}</td></tr>
            <tr><td style="padding:8px 0; font-weight:bold;">City</td><td>${citySafe}</td></tr>
            <tr><td style="padding:8px 0; font-weight:bold; vertical-align:top;">Message</td><td>${messageSafe}</td></tr>
          </table>
          <p style="margin-top:20px; color:#6B564C; font-size:.9em;">
            Sent automatically from the Panditji Online booking form.
          </p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);

    if (email) {
      await transporter.sendMail({
        from: `"Vaishnavacharya Sagar" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `Booking Received — ${pujaTypeSafe}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto;">
            <h2 style="color:#B23A2E;">Thank you, ${nameSafe}!</h2>
            <p>We've received your request for <strong>${pujaTypeSafe}</strong> on <strong>${escapeHtml(date)}</strong>.</p>
            <p>The pandit has been notified and will contact you shortly at ${escapeHtml(phone)} to confirm details.</p>
            <p style="color:#6B564C; font-size:.9em; margin-top:24px;">— Vaishnavacharya Sagar</p>
          </div>
        `,
      });
    }

    res.status(200).json({ success: true, message: 'Booking request sent successfully.' });

  } catch (err) {
    console.error('Booking error:', err);
    res.status(500).json({ error: 'Something went wrong. Please try again shortly.' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Panditji Online API running on http://localhost:${PORT}`);
});
