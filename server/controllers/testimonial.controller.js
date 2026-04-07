const Testimonial = require('../models/Testimonial');

// --- PUBLIC: Get all active testimonials ---
const getTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC']],
    });

    return res.status(200).json({ testimonials });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Get all testimonials ---
const getAllTestimonials = async (req, res, next) => {
  try {
    const testimonials = await Testimonial.findAll({
      order: [['display_order', 'ASC']],
    });

    return res.status(200).json({ testimonials });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Create testimonial ---
const createTestimonial = async (req, res, next) => {
  try {
    const { client_name, quote, book_title } = req.body;

    const count = await Testimonial.count();

    const testimonial = await Testimonial.create({
      client_name,
      quote,
      book_title: book_title || null,
      display_order: count,
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

    const { client_name, quote, book_title, display_order, is_active } = req.body;

    await testimonial.update({
      client_name: client_name ?? testimonial.client_name,
      quote: quote ?? testimonial.quote,
      book_title: book_title ?? testimonial.book_title,
      display_order: display_order ?? testimonial.display_order,
      is_active: is_active ?? testimonial.is_active,
    });

    return res.status(200).json({ message: 'Testimonial updated successfully', testimonial });
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

module.exports = { getTestimonials, getAllTestimonials, createTestimonial, updateTestimonial, deleteTestimonial };
