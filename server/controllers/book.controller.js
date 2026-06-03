const Book = require('../models/Book');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// --- PUBLIC: Get all active books ---
const getBooks = async (req, res, next) => {
  try {
    const books = await Book.findAll({
      where: { is_active: true },
      order: [['display_order', 'ASC'], ['created_at', 'ASC']],
    });
    return res.status(200).json({ books });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Get all books ---
const getAllBooks = async (req, res, next) => {
  try {
    const books = await Book.findAll({
      order: [['display_order', 'ASC'], ['created_at', 'DESC']],
    });
    return res.status(200).json({ books });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Create book ---
const createBook = async (req, res, next) => {
  try {
    const { title, author, genre, description, links } = req.body;
    if (!title || !author) {
      return res.status(400).json({ error: true, message: 'Title and author are required.' });
    }

    let parsedLinks = [];
    if (links) {
      try { parsedLinks = typeof links === 'string' ? JSON.parse(links) : links; } catch {}
    }

    let cover_image_url = null;
    let cover_image_public_id = null;

    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'booky/books',
        resource_type: 'image',
      });
      cover_image_url = result.secure_url;
      cover_image_public_id = result.public_id;
    }

    const count = await Book.count();
    const book = await Book.create({
      title,
      author,
      genre: genre || null,
      description: description || null,
      cover_image_url,
      cover_image_public_id,
      links: parsedLinks,
      display_order: count,
    });

    return res.status(201).json({ message: 'Book added successfully', book });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Update book ---
const updateBook = async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ error: true, message: 'Book not found.' });
    }

    const { title, author, genre, description, links, display_order, is_active } = req.body;

    let parsedLinks = book.links;
    if (links !== undefined) {
      try { parsedLinks = typeof links === 'string' ? JSON.parse(links) : links; } catch {}
    }

    let cover_image_url = book.cover_image_url;
    let cover_image_public_id = book.cover_image_public_id;

    if (req.file) {
      await deleteFromCloudinary(book.cover_image_public_id);
      const result = await uploadToCloudinary(req.file.buffer, {
        folder: 'booky/books',
        resource_type: 'image',
      });
      cover_image_url = result.secure_url;
      cover_image_public_id = result.public_id;
    }

    await book.update({
      title: title ?? book.title,
      author: author ?? book.author,
      genre: genre !== undefined ? (genre || null) : book.genre,
      description: description !== undefined ? (description || null) : book.description,
      cover_image_url,
      cover_image_public_id,
      links: parsedLinks,
      display_order: display_order !== undefined ? Number(display_order) : book.display_order,
      is_active: is_active !== undefined ? is_active : book.is_active,
    });

    return res.status(200).json({ message: 'Book updated successfully', book });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Delete book ---
const deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findByPk(req.params.id);
    if (!book) {
      return res.status(404).json({ error: true, message: 'Book not found.' });
    }
    await deleteFromCloudinary(book.cover_image_public_id);
    await book.destroy();
    return res.status(200).json({ message: 'Book deleted successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getBooks, getAllBooks, createBook, updateBook, deleteBook };
