const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: true, message: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });

    // Enforce token revocation: a password change/reset bumps token_version,
    // invalidating every token issued before it. Defaults to 0 so tokens issued
    // before this field existed keep working until the next credential change.
    const admin = await Admin.findByPk(decoded.id, { attributes: ['id', 'token_version'] });
    if (!admin || (decoded.tv ?? 0) !== (admin.token_version ?? 0)) {
      return res.status(401).json({ error: true, message: 'Session expired. Please log in again.' });
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: true, message: 'Token expired. Please log in again.' });
    }
    return res.status(401).json({ error: true, message: 'Invalid token.' });
  }
};

module.exports = authMiddleware;
