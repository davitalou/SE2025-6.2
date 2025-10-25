const { body, validationResult } = require('express-validator');
const nodemailer = require('nodemailer');

class ContactForm {
  constructor() {
    this.name = '';
    this.email = '';
    this.subject = '';
    this.body = '';
    this.verifyCode = '';
  }

  static validationRules() {
    return [
      body('name').notEmpty().withMessage('Name cannot be blank.'),
      body('email')
        .notEmpty().withMessage('Email cannot be blank.')
        .isEmail().withMessage('Email is not a valid email address.'),
      body('subject').notEmpty().withMessage('Subject cannot be blank.'),
      body('body').notEmpty().withMessage('Body cannot be blank.')
    ];
  }

  static async validate(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return { isValid: false, errors: errors.array() };
    }

    const { name, email, subject, body, verifyCode } = req.body;
    const form = new ContactForm();
    form.name = name;
    form.email = email;
    form.subject = subject;
    form.body = body;
    form.verifyCode = verifyCode;

    return { isValid: true, form };
  }

  async sendEmail(adminEmail) {
    try {
      const transporter = nodemailer.createTransporter({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        }
      });

      const mailOptions = {
        from: this.email,
        to: adminEmail,
        subject: this.subject,
        text: `From: ${this.name} (${this.email})\n\n${this.body}`
      };

      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }
}

module.exports = ContactForm;
