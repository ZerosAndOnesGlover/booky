const SiteSettings = require('../models/SiteSettings');
const { uploadToCloudinary, deleteFromCloudinary } = require('../middleware/upload');

// --- PUBLIC: Get site settings ---
const getSettings = async (req, res, next) => {
  try {
    const [settings] = await SiteSettings.findOrCreate({
      where: { id: 1 },
      defaults: { whatsapp_number: '', contact_email: '' },
    });

    return res.status(200).json({ settings });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Update contact details and social links ---
const updateSettings = async (req, res, next) => {
  try {
    const { whatsapp_number, contact_email, instagram_url, twitter_url, facebook_url, linkedin_url } = req.body;

    const [settings] = await SiteSettings.findOrCreate({
      where: { id: 1 },
      defaults: { whatsapp_number: '', contact_email: '' },
    });

    await settings.update({
      whatsapp_number: whatsapp_number || settings.whatsapp_number,
      contact_email: contact_email || settings.contact_email,
      instagram_url: instagram_url || settings.instagram_url,
      twitter_url: twitter_url || settings.twitter_url,
      facebook_url: facebook_url || settings.facebook_url,
      linkedin_url: linkedin_url || settings.linkedin_url,
    });

    return res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Upload logo ---
const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded.' });
    }

    const [settings] = await SiteSettings.findOrCreate({
      where: { id: 1 },
      defaults: { whatsapp_number: '', contact_email: '' },
    });

    await deleteFromCloudinary(settings.logo_public_id);

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'booky/brand',
      resource_type: 'image',
    });

    await settings.update({
      logo_url: result.secure_url,
      logo_public_id: result.public_id,
    });

    return res.status(200).json({ message: 'Logo uploaded successfully', logo_url: result.secure_url });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Upload founder photo ---
const uploadFounderPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: true, message: 'No file uploaded.' });
    }

    const [settings] = await SiteSettings.findOrCreate({
      where: { id: 1 },
      defaults: { whatsapp_number: '', contact_email: '' },
    });

    await deleteFromCloudinary(settings.founder_photo_public_id);

    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'booky/brand',
      resource_type: 'image',
    });

    await settings.update({
      founder_photo_url: result.secure_url,
      founder_photo_public_id: result.public_id,
    });

    return res.status(200).json({ message: 'Founder photo uploaded successfully', founder_photo_url: result.secure_url });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Remove logo ---
const removeLogo = async (req, res, next) => {
  try {
    const [settings] = await SiteSettings.findOrCreate({
      where: { id: 1 },
      defaults: { whatsapp_number: '', contact_email: '' },
    });

    await deleteFromCloudinary(settings.logo_public_id);
    await settings.update({ logo_url: null, logo_public_id: null });

    return res.status(200).json({ message: 'Logo removed successfully' });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Remove founder photo ---
const removeFounderPhoto = async (req, res, next) => {
  try {
    const [settings] = await SiteSettings.findOrCreate({
      where: { id: 1 },
      defaults: { whatsapp_number: '', contact_email: '' },
    });

    await deleteFromCloudinary(settings.founder_photo_public_id);
    await settings.update({ founder_photo_url: null, founder_photo_public_id: null });

    return res.status(200).json({ message: 'Founder photo removed successfully' });
  } catch (err) {
    next(err);
  }
};

module.exports = { getSettings, updateSettings, uploadLogo, uploadFounderPhoto, removeLogo, removeFounderPhoto };
