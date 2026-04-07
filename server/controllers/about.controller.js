const AboutContent = require('../models/AboutContent');

// --- PUBLIC: Get about content ---
const getAbout = async (req, res, next) => {
  try {
    const [about] = await AboutContent.findOrCreate({
      where: { id: 1 },
      defaults: {
        founder_story: '',
        mission: 'Supporting authors in creating timeless books',
        vision: 'Becoming a trusted global editing and publishing brand',
      },
    });

    return res.status(200).json({ about });
  } catch (err) {
    next(err);
  }
};

// --- ADMIN: Update about content ---
const updateAbout = async (req, res, next) => {
  try {
    const {
      founder_story, mission, vision,
      value_1_label, value_1_description,
      value_2_label, value_2_description,
      value_3_label, value_3_description,
      value_4_label, value_4_description,
    } = req.body;

    const [about] = await AboutContent.findOrCreate({
      where: { id: 1 },
      defaults: { founder_story: '', mission: '', vision: '' },
    });

    await about.update({
      founder_story: founder_story ?? about.founder_story,
      mission: mission ?? about.mission,
      vision: vision ?? about.vision,
      value_1_label: value_1_label ?? about.value_1_label,
      value_1_description: value_1_description ?? about.value_1_description,
      value_2_label: value_2_label ?? about.value_2_label,
      value_2_description: value_2_description ?? about.value_2_description,
      value_3_label: value_3_label ?? about.value_3_label,
      value_3_description: value_3_description ?? about.value_3_description,
      value_4_label: value_4_label ?? about.value_4_label,
      value_4_description: value_4_description ?? about.value_4_description,
    });

    return res.status(200).json({ message: 'About content updated successfully', about });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAbout, updateAbout };
