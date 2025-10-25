const { body, validationResult } = require('express-validator');
const User = require('./User');

class ResetPasswordForm {
  constructor(token) {
    this.token = token;
    this.password = '';
  }

  static validationRules() {
    return [
      body('password')
        .notEmpty().withMessage('Password cannot be blank.')
        .isLength({ min: 6 }).withMessage('Password should contain at least 6 characters.')
    ];
  }

  static async validate(req, token) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return { isValid: false, errors: errors.array() };
    }

    if (!token) {
      return { isValid: false, errors: [{ msg: 'Invalid token.' }] };
    }

    const user = await User.findByPasswordResetToken(token);
    if (!user) {
      return { isValid: false, errors: [{ msg: 'Invalid or expired token.' }] };
    }

    const { password } = req.body;
    const form = new ResetPasswordForm(token);
    form.password = password;

    return { isValid: true, form, user };
  }

  async resetPassword() {
    try {
      const user = await User.findByPasswordResetToken(this.token);
      if (!user) return false;

      await user.setPassword(this.password);
      user.removePasswordResetToken();
      user.status = 10; // STATUS_ACTIVE
      await user.save();

      return true;
    } catch (error) {
      console.error('Error resetting password:', error);
      return false;
    }
  }
}

module.exports = ResetPasswordForm;
