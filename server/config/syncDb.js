const sequelize = require('./db');

require('../models/Admin');
require('../models/PasswordResetToken');
require('../models/BlogPost');
require('../models/SiteSettings');
require('../models/AboutContent');
require('../models/Testimonial');
require('../models/QuoteSubmission');

const syncDb = async () => {
  try {
    await sequelize.sync({ alter: true });
    console.log('All tables created/updated successfully');
  } catch (err) {
    console.error('Error syncing database:', err.message);
    throw err;
  }
};

module.exports = syncDb;
