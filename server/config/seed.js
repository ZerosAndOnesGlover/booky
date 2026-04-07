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

    // Admin user
    const existing = await Admin.findOne({ where: { email: 'admin@bookyediting.com' } });
    if (!existing) {
      const password_hash = await bcrypt.hash('Booky@Admin2025', 12);
      await Admin.create({ email: 'admin@bookyediting.com', password_hash });
      console.log('Admin user created');
      console.log('Email: admin@bookyediting.com');
      console.log('Password: Booky@Admin2025');
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
