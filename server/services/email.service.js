const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// --- PASSWORD RESET EMAIL ---
const sendPasswordResetEmail = async (toEmail, resetUrl) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Booky Admin" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Booky Admin — Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4B2E63;">Password Reset Request</h2>
        <p>You requested a password reset for your Booky Admin account.</p>
        <p>Click the button below to reset your password. This link expires in <strong>1 hour</strong>.</p>
        <a href="${resetUrl}" style="
          display: inline-block;
          background-color: #4B2E63;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 4px;
          margin: 16px 0;
        ">Reset Password</a>
        <p>If you did not request this, ignore this email. Your password will not change.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">Booky Editing Services &mdash; Admin Panel</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// --- QUOTE FORM NOTIFICATION EMAIL ---
const sendQuoteNotificationEmail = async (submission) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Booky Website" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFICATION_EMAIL,
    subject: `New Quote Request — ${submission.full_name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4B2E63;">New Quote Request Received</h2>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${submission.full_name}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${submission.email}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${submission.phone}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Book Title</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${submission.book_title}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Genre</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${submission.genre}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Word Count</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${submission.word_count}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Service Needed</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${submission.editing_type}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Deadline</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${submission.deadline}</td></tr>
          <tr><td style="padding: 8px;"><strong>Manuscript</strong></td><td style="padding: 8px;">${submission.file_url ? `<a href="${submission.file_url}">Download File</a>` : 'No file uploaded'}</td></tr>
        </table>
        <p style="margin-top: 24px;">Log in to the <a href="${process.env.FRONTEND_URL}/admin">Admin Panel</a> to view and manage this submission.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">Booky Editing Services &mdash; Automated Notification</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

// --- WHATSAPP NOTIFICATION via CallMeBot ---
const sendWhatsAppNotification = async (whatsappNumber, submission) => {
  const apiKey = process.env.CALLMEBOT_API_KEY;
  if (!apiKey || !whatsappNumber) return;

  const cleanNumber = whatsappNumber.replace(/\D/g, '');
  const message =
    `📋 New Quote Request!\n` +
    `👤 ${submission.full_name}\n` +
    `📧 ${submission.email}\n` +
    `📞 ${submission.phone || 'N/A'}\n` +
    `📖 "${submission.book_title}" (${submission.genre || 'N/A'})\n` +
    `✏️ ${submission.editing_type}\n` +
    `🗓 Deadline: ${submission.deadline || 'N/A'}\n` +
    `Check admin panel for details.`;

  const url =
    `https://api.callmebot.com/whatsapp.php` +
    `?phone=${encodeURIComponent(cleanNumber)}` +
    `&text=${encodeURIComponent(message)}` +
    `&apikey=${encodeURIComponent(apiKey)}`;

  const https = require('https');
  return new Promise((resolve) => {
    https.get(url, (res) => {
      res.resume();
      resolve();
    }).on('error', () => resolve());
  });
};

// --- OTP / 2FA EMAIL ---
const sendOtpEmail = async (otp) => {
  const transporter = createTransporter();

  const mailOptions = {
    from: `"Booky Admin" <${process.env.EMAIL_USER}>`,
    to: process.env.NOTIFICATION_EMAIL,
    subject: 'Booky Admin — Login Verification Code',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4B2E63;">Login Verification Code</h2>
        <p>A login attempt was made from an unrecognized device.</p>
        <p>Your one-time verification code is:</p>
        <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4B2E63; margin: 24px 0; padding: 16px; background: #f5f0fa; border-radius: 8px; text-align: center;">${otp}</div>
        <p>This code expires in <strong>10 minutes</strong>.</p>
        <p>If you did not attempt to log in, your password may have been compromised — change it immediately.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #888; font-size: 12px;">Booky Editing Services &mdash; Admin Panel</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = { sendPasswordResetEmail, sendQuoteNotificationEmail, sendWhatsAppNotification, sendOtpEmail };
