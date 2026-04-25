const QuoteSubmission = require('../models/QuoteSubmission');
const SiteSettings = require('../models/SiteSettings');
const { uploadToCloudinary } = require('../middleware/upload');
const { sendQuoteNotificationEmail, sendWhatsAppNotification } = require('../services/email.service');

// --- PUBLIC: Submit quote form ---
const submitQuote = async (req, res, next) => {
  try {
    // Honeypot check
    if (req.body.website) {
      return res.status(200).json({ message: 'Submission received.' });
    }

    const { full_name, email, phone, book_title, genre, word_count, editing_type, deadline } = req.body;

    let file_url = null;
    let file_public_id = null;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'booky/manuscripts',
        resource_type: 'raw',
        use_filename: true,
      });
      file_url = result.secure_url;
      file_public_id = result.public_id;
    }

    const submission = await QuoteSubmission.create({
      full_name,
      email,
      phone,
      book_title,
      genre,
      word_count: parseInt(word_count),
      editing_type,
      deadline,
      file_url,
      file_public_id,
    });

    // Send notifications (non-blocking)
    sendQuoteNotificationEmail(submission).catch((err) => {
      console.error('Email notification failed:', err.message);
    });

    SiteSettings.findByPk(1).then((settings) => {
      if (settings?.whatsapp_number) {
        sendWhatsAppNotification(settings.whatsapp_number, submission).catch(() => {});
      }
    }).catch(() => {});

    return res.status(201).json({
      message: "Thank you! We'll get back to you within 24-48 hours.",
    });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Get all quote submissions ---
const getQuotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const offset = (page - 1) * limit;
    const where = {};

    if (req.query.status === 'read') where.is_read = true;
    if (req.query.status === 'unread') where.is_read = false;

    const { count, rows } = await QuoteSubmission.findAndCountAll({
      where,
      order: [['submitted_at', 'DESC']],
      limit,
      offset,
    });

    return res.status(200).json({
      quotes: rows,
      total: count,
      page,
      totalPages: Math.ceil(count / limit),
    });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Get single quote submission ---
const getQuoteById = async (req, res, next) => {
  try {
    const quote = await QuoteSubmission.findByPk(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: true, message: 'Submission not found.' });
    }

    return res.status(200).json({ quote });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Toggle read status ---
const toggleReadStatus = async (req, res, next) => {
  try {
    const quote = await QuoteSubmission.findByPk(req.params.id);
    if (!quote) {
      return res.status(404).json({ error: true, message: 'Submission not found.' });
    }

    await quote.update({ is_read: req.body.is_read });
    return res.status(200).json({ message: 'Status updated successfully', quote });
  } catch (err) {
    next(err);
  }
};

module.exports = { submitQuote, getQuotes, getQuoteById, toggleReadStatus };
