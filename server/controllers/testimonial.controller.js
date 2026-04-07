const Testimonial = require('../models/Testimonial');
const { Op } = require('sequelize');

// --- PUBLIC: Get approved testimonials ---
const getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.findAll({
      where: { is_active: true, is_approved: true },
      order: [['display_order', 'ASC']],
    });
    return res.status(200).json({ testimonials });
  } catch (err) {
    next(err);
  }
};

// --- PUBLIC: Submit a testimonial (pending approval) ---
const submitPublicTestimonial = async (req, res, next) => {
  try {
    const { client_name, quote, book_title, rating } = req.body;
    if (!client_name || !quote) {
      return res.status(400).json({ error: true, message: 'Name and review are required.' });
    }
    await Testimonial.create({
      client_name: client_name.trim(),
      quote: quote.trim(),
      book_title: book_title?.trim() || null,
      rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
      is_approved: false,
      source: 'public',
      display_order: 9999,
    });
    return res.status(201).json({ message: 'Thank you! Your review has been submitted for approval.' });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Get all testimonials (with optional filter) ---
const getAllTestimonials = async (req, res, next) => {
  try {
    const where = {};
    if (req.query.status === 'pending') where.is_approved = false;
    if (req.query.status === 'approved') where.is_approved = true;

    const testimonials = await Testimonial.findAll({
      where,
      order: [['display_order', 'ASC'], ['created_at', 'DESC']],
    });
    return res.status(200).json({ testimonials });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Create testimonial ---
const createTestimonial = async (req, res, next) => {
  try {
    const { client_name, quote, book_title, rating } = req.body;
    const count = await Testimonial.count({ where: { is_approved: true } });
    const testimonial = await Testimonial.create({
      client_name,
      quote,
      book_title: book_title || null,
      rating: Math.min(5, Math.max(1, parseInt(rating) || 5)),
      display_order: count,
      is_approved: true,
      source: 'admin',
    });
    return res.status(201).json({ message: 'Testimonial created successfully', testimonial });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Update testimonial ---
const updateTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ error: true, message: 'Testimonial not found.' });
    }
    const { client_name, quote, book_title, display_order, is_active, rating } = req.body;
    await testimonial.update({
      client_name: client_name ?? testimonial.client_name,
      quote: quote ?? testimonial.quote,
      book_title: book_title ?? testimonial.book_title,
      display_order: display_order ?? testimonial.display_order,
      is_active: is_active ?? testimonial.is_active,
      rating: rating !== undefined ? Math.min(5, Math.max(1, parseInt(rating) || 5)) : testimonial.rating,
    });
    return res.status(200).json({ message: 'Testimonial updated successfully', testimonial });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Approve testimonial ---
const approveTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ error: true, message: 'Testimonial not found.' });
    }
    const approvedCount = await Testimonial.count({ where: { is_approved: true } });
    await testimonial.update({ is_approved: true, display_order: approvedCount });
    return res.status(200).json({ message: 'Testimonial approved', testimonial });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Delete testimonial ---
const deleteTestimonial = async (req, res, next) => {
  try {
    const testimonial = await Testimonial.findByPk(req.params.id);
    if (!testimonial) {
      return res.status(404).json({ error: true, message: 'Testimonial not found.' });
    }
    await testimonial.destroy();
    return res.status(200).json({ message: 'Testimonial deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getTestimonials, submitPublicTestimonial,
  getAllTestimonials, createTestimonial, updateTestimonial,
  approveTestimonial, deleteTestimonial,
};
