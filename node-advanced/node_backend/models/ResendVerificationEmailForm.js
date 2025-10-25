const { body, validationResult } = require('express-validator');
const User = require('./User');
const nodemailer = require('nodemailer');

class ResendVerificationEmailForm {
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
    const form = new ResendVerificationEmailForm();
    form.email = email;

    const user = await User.findOne({ where: { email, status: 9 } }); // STATUS_INACTIVE
    if (!user) {
      return { isValid: false, errors: [{ msg: 'There is no inactive user with this email address.' }] };
    }

    return { isValid: true, form, user };
  }

  async sendEmail() {
    try {
      const user = await User.findOne({ where: { email: this.email, status: 9 } });
      if (!user) return false;

      // Generate new verification token if needed
      if (!user.verification_token) {
        user.generateEmailVerificationToken();
        await user.save();
      }

      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/verify-email?token=${user.verification_token}`;
      
      const mailOptions = {
        from: process.env.SMTP_USER,
        to: this.email,
        subject: 'Email Verification',
        html: `
          <h2>Email Verification</h2>
          <p>Hello ${user.username},</p>
          <p>Please click the link below to verify your email address:</p>
          <p><a href="${verifyUrl}">Verify Email</a></p>
          <p>If you did not create this account, please ignore this email.</p>
        `
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending verification email:', error);
      return false;
    }
  }
}

module.exports = ResendVerificationEmailForm;
