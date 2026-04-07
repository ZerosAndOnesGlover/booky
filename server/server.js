require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const sequelize = require('./config/db');
const syncDb = require('./config/syncDb');
const errorHandler = require('./middleware/errorHandler');

// --- Routes ---
const authRoutes = require('./routes/auth.routes');
const blogRoutes = require('./routes/blog.routes');
const settingsRoutes = require('./routes/settings.routes');
const aboutRoutes = require('./routes/about.routes');
const testimonialRoutes = require('./routes/testimonial.routes');
const quoteRoutes = require('./routes/quote.routes');

const app = express();

// --- Security Middleware ---
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// --- Body Parsing Middleware ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Health Check ---
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'Booky API is running' });
});

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api', blogRoutes);
app.use('/api', settingsRoutes);
app.use('/api', aboutRoutes);
app.use('/api', testimonialRoutes);
app.use('/api', quoteRoutes);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

// --- Global Error Handler ---
app.use(errorHandler);

// --- Database Connection + Sync + Start Server ---
const PORT = process.env.PORT || 5000;

sequelize.authenticate()
  .then(() => {
    console.log('PostgreSQL connected successfully');
    return syncDb();
  })
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Booky API running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Startup error:', err.message);
    process.exit(1);
  });
