const { body, validationResult } = require('express-validator');
const User = require('./User');
const nodemailer = require('nodemailer');

class PasswordResetRequestForm {
  constructor() {
    this.email = '';
  }

  static validationRules() {
    return [
      body('email')
        .notEmpty().withMessage('Email cannot be blank.')
        .isEmail().withMessage('Email is not a valid email address.')
    ];
  }

  static async validate(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return { isValid: false, errors: errors.array() };
    }

    const { email } = req.body;
    const form = new PasswordResetRequestForm();
    form.email = email;

    const user = await User.findByEmail(email);
    if (!user) {
      return { isValid: false, errors: [{ msg: 'There is no user with this email address.' }] };
    }

    return { isValid: true, form, user };
  }

  async sendEmail() {
    try {
      const user = await User.findByEmail(this.email);
      if (!user) return false;

      user.generatePasswordResetToken();
      await user.save();

      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const resetUrl = `${process.env.APP_URL || 'http://localhost:3000'}/reset-password?token=${user.password_reset_token}`;
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: this.email,
        subject: 'Password Reset Request',
        html: `
          <h2>Password Reset Request</h2>
          <p>Hello ${user.username},</p>
          <p>You have requested a password reset. Please click the link below to reset your password:</p>
          <p><a href="${resetUrl}">Reset Password</a></p>
          <p>If you did not request this, please ignore this email.</p>
          <p>This link will expire in 24 hours.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending password reset email:', error);
      return false;
    }
  }
}

module.exports = PasswordResetRequestForm;
