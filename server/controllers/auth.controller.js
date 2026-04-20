const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const Admin = require('../models/Admin');
const PasswordResetToken = require('../models/PasswordResetToken');
const { sendPasswordResetEmail, sendOtpEmail } = require('../services/email.service');

// --- LOGIN ---
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const admin = await Admin.findOne({ where: { email: email.toLowerCase().trim() } });

    if (!admin) {
      return res.status(401).json({ error: true, message: 'Invalid email or password.' });
    }

    // Check if account is locked
    if (admin.lock_until && new Date(admin.lock_until) > new Date()) {
      const minutesLeft = Math.ceil((new Date(admin.lock_until) - new Date()) / 60000);
      return res.status(423).json({
        error: true,
        message: `Account locked. Try again in ${minutesLeft} minute(s).`,
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password_hash);

    if (!isMatch) {
      const attempts = admin.login_attempts + 1;
      const updateData = { login_attempts: attempts };

      if (attempts >= 5) {
        updateData.lock_until = new Date(Date.now() + 15 * 60 * 1000);
        updateData.login_attempts = 0;
      }

      await admin.update(updateData);
      return res.status(401).json({ error: true, message: 'Invalid email or password.' });
    }

    // Reset login attempts on success
    await admin.update({ login_attempts: 0, lock_until: null });

    // --- Device check for 2FA ---
    const deviceId = req.cookies?.booky_device_id;
    const knownTokens = admin.known_device_tokens || [];

    let deviceKnown = false;
    if (deviceId) {
      const deviceHash = crypto.createHash('sha256').update(deviceId).digest('hex');
      deviceKnown = knownTokens.includes(deviceHash);
    }

    if (!deviceKnown) {
      // Unknown device — send OTP
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
      await admin.update({
        otp_code: otpHash,
        otp_expires_at: new Date(Date.now() + 10 * 60 * 1000),
      });
      try {
        await sendOtpEmail(otp);
      } catch (emailErr) {
        console.error('OTP email failed:', emailErr.message);
        return res.status(500).json({
          error: true,
          message: 'Could not send verification code — email configuration issue. Check EMAIL_USER and EMAIL_PASS in server environment variables.',
        });
      }
      return res.status(200).json({ requiresOtp: true });
    }

    // Known device — issue token directly
    return issueToken(res, admin);
  } catch (err) {
    next(err);
  }
};

// Helper to sign JWT and respond
const issueToken = (res, admin) => {
  const token = jwt.sign(
    { id: admin.id, email: admin.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  );

  res.cookie('booky_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000,
  });

  return res.status(200).json({
    message: 'Login successful',
    token,
    user: { id: admin.id, email: admin.email },
  });
};

// --- VERIFY OTP ---
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    const admin = await Admin.findOne({ where: { email: email.toLowerCase().trim() } });

    if (!admin || !admin.otp_code) {
      return res.status(400).json({ error: true, message: 'Invalid or expired code.' });
    }

    if (new Date(admin.otp_expires_at) < new Date()) {
      await admin.update({ otp_code: null, otp_expires_at: null });
      return res.status(400).json({ error: true, message: 'Verification code has expired. Please log in again.' });
    }

    const otpHash = crypto.createHash('sha256').update(otp).digest('hex');
    if (otpHash !== admin.otp_code) {
      return res.status(400).json({ error: true, message: 'Invalid verification code.' });
    }

    // Generate and store new device token
    const deviceToken = crypto.randomBytes(32).toString('hex');
    const deviceHash = crypto.createHash('sha256').update(deviceToken).digest('hex');

    const knownTokens = admin.known_device_tokens || [];
    knownTokens.push(deviceHash);
    if (knownTokens.length > 5) knownTokens.shift(); // Keep last 5 devices

    await admin.update({
      otp_code: null,
      otp_expires_at: null,
      known_device_tokens: knownTokens,
    });

    // Set long-lived device cookie
    res.cookie('booky_device_id', deviceToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 365 * 24 * 60 * 60 * 1000, // 1 year
    });

    return issueToken(res, admin);
  } catch (err) {
    next(err);
  }
};

// --- LOGOUT ---
const logout = (req, res) => {
  res.clearCookie('booky_token');
  return res.status(200).json({ message: 'Logged out successfully' });
};

// --- VERIFY TOKEN ---
const verify = (req, res) => {
  return res.status(200).json({
    user: { id: req.user.id, email: req.user.email },
  });
};

// --- CHANGE PASSWORD ---
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const admin = await Admin.findByPk(req.user.id);
    if (!admin) {
      return res.status(404).json({ error: true, message: 'Admin not found.' });
    }

    const isMatch = await bcrypt.compare(currentPassword, admin.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: true, message: 'Current password is incorrect.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await admin.update({ password_hash });

    return res.status(200).json({ message: 'Password changed successfully.' });
  } catch (err) {
    next(err);
  }
};

// --- FORGOT PASSWORD ---
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    const admin = await Admin.findOne({ where: { email: email.toLowerCase().trim() } });

    // Always return 200 to prevent email enumeration
    if (!admin) {
      return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }

    // Invalidate any existing tokens
    await PasswordResetToken.destroy({ where: { admin_id: admin.id } });

    const rawToken = crypto.randomBytes(32).toString('hex');
    const token_hash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expires_at = new Date(Date.now() + 60 * 60 * 1000);

    await PasswordResetToken.create({ admin_id: admin.id, token_hash, expires_at });

    const resetUrl = `${process.env.FRONTEND_URL}/admin/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(admin.email, resetUrl);

    return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    next(err);
  }
};

// --- RESET PASSWORD ---
const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;

    const token_hash = crypto.createHash('sha256').update(token).digest('hex');

    const resetToken = await PasswordResetToken.findOne({ where: { token_hash, used: false } });

    if (!resetToken) {
      return res.status(400).json({ error: true, message: 'Invalid or expired reset token.' });
    }

    if (new Date(resetToken.expires_at) < new Date()) {
      await resetToken.destroy();
      return res.status(400).json({ error: true, message: 'Reset token has expired.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    await Admin.update({ password_hash }, { where: { id: resetToken.admin_id } });
    await resetToken.update({ used: true });

    return res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { login, verifyOtp, logout, verify, changePassword, forgotPassword, resetPassword };
