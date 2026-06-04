require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./db');

require('../models/Admin');
require('../models/SiteSettings');
require('../models/AboutContent');

const Admin = require('../models/Admin');
const SiteSettings = require('../models/SiteSettings');
const AboutContent = require('../models/AboutContent');

const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Admin user — credentials come from the environment, never hardcoded
    const seedEmail = process.env.SEED_ADMIN_EMAIL;
    const seedPassword = process.env.SEED_ADMIN_PASSWORD;
    if (!seedEmail || !seedPassword) {
      console.error('Refusing to seed: set SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD in the environment.');
      process.exit(1);
    }

    const existing = await Admin.findOne({ where: { email: seedEmail.toLowerCase().trim() } });
    if (!existing) {
      const password_hash = await bcrypt.hash(seedPassword, 12);
      await Admin.create({ email: seedEmail, password_hash });
      console.log(`Admin user created for ${seedEmail}`);
    } else {
      console.log('Admin user already exists - skipping');
    }

    // Site settings singleton
    await SiteSettings.findOrCreate({
      where: { id: 1 },
      defaults: {
        whatsapp_number: '',
        contact_email: 'bookyeditingservices@gmail.com',
      },
    });
    console.log('Site settings singleton ready');

    // About content singleton
    await AboutContent.findOrCreate({
      where: { id: 1 },
      defaults: {
        founder_story: '',
        mission: 'Supporting authors in creating timeless books',
        vision: 'Becoming a trusted global editing and publishing brand',
        value_1_label: 'Excellence',
        value_1_description: 'We hold every manuscript to the highest editorial standard.',
        value_2_label: 'Integrity',
        value_2_description: 'We are honest, transparent, and trustworthy in every engagement.',
        value_3_label: 'Clarity',
        value_3_description: 'We communicate clearly and ensure your message lands with precision.',
        value_4_label: 'Client Satisfaction',
        value_4_description: 'Your success is our success. We go the extra mile for every author.',
      },
    });
    console.log('About content singleton ready');

    console.log('Seed completed successfully');
    process.exit(0);
  } catch (err) {
    console.error('Seed error:', err.message);
    process.exit(1);
  }
};

seed();
