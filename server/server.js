require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const sequelize = require('./config/db');
const syncDb = require('./config/syncDb');

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

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({ error: true, message: 'Route not found' });
});

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
