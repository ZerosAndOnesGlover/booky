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
const analyticsRoutes = require('./routes/analytics.routes');
const commentRoutes = require('./routes/comment.routes');
const aiRoutes = require('./routes/ai.routes');

const app = express();
app.set('trust proxy', 1);

// --- Security Middleware ---
app.use(helmet());
// Support comma-separated list e.g. "https://old.vercel.app,https://new.vercel.app"
const allowedOrigins = [
  ...(process.env.FRONTEND_URL || '').split(',').map(u => u.trim()).filter(Boolean),
  // Allow any private network IP on the same port (for local client previews)
  /^http:\/\/(192\.168|10\.\d+|172\.(1[6-9]|2\d|3[01]))\.\d+\.\d+:5173$/,
];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => typeof o === 'string' ? o === origin : o.test(origin))) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Device-ID'],
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
app.use('/api', analyticsRoutes);
app.use('/api', commentRoutes);
app.use('/api', aiRoutes);

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
