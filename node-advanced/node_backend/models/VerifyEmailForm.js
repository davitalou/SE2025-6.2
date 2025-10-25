const User = require('./User');

class VerifyEmailForm {
  constructor(token) {
    this.token = token;
  }

  static async validate(token) {
    if (!token) {
      return { isValid: false, errors: [{ msg: 'Invalid token.' }] };
    }

    const user = await User.findByVerificationToken(token);
    if (!user) {
      return { isValid: false, errors: [{ msg: 'Invalid or expired token.' }] };
    }

    const form = new VerifyEmailForm(token);
    return { isValid: true, form, user };
  }

  async verifyEmail() {
    try {
      const user = await User.findByVerificationToken(this.token);
      if (!user) return null;

      user.status = 10; // STATUS_ACTIVE
      user.verification_token = null;
      await user.save();

      return user;
    } catch (error) {
      console.error('Error verifying email:', error);
      return null;
    }
  }
}

module.exports = VerifyEmailForm;
