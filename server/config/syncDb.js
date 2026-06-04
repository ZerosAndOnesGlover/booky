const sequelize = require('./db');

require('../models/Admin');
require('../models/PasswordResetToken');
require('../models/BlogPost');
require('../models/SiteSettings');
require('../models/AboutContent');
require('../models/Testimonial');
require('../models/QuoteSubmission');
require('../models/PageView');
require('../models/BlogLike');
require('../models/BlogComment');
require('../models/Book');

const syncDb = async () => {
  try {
    // Never auto-ALTER in production — it can drop/recast columns, hold locks,
    // or fail mid-migration against live data. Production schema changes should
    // go through reviewed migrations; only mirror models without altering here.
    const options = process.env.NODE_ENV === 'production' ? {} : { alter: true };
    await sequelize.sync(options);
    console.log('All tables created/updated successfully');
  } catch (err) {
    console.error('Error syncing database:', err.message);
    throw err;
  }
};

module.exports = syncDb;
