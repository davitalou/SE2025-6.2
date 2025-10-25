const { body, validationResult } = require('express-validator');
const User = require('./User');

class SignupForm {
  constructor() {
    this.username = '';
    this.email = '';
    this.password = '';
  }

  static validationRules() {
    return [
      body('username')
        .notEmpty().withMessage('Username cannot be blank.')
        .isLength({ min: 2, max: 255 }).withMessage('Username should contain at least 2 characters.'),
      body('email')
        .notEmpty().withMessage('Email cannot be blank.')
        .isEmail().withMessage('Email is not a valid email address.'),
      body('password')
        .notEmpty().withMessage('Password cannot be blank.')
        .isLength({ min: 6 }).withMessage('Password should contain at least 6 characters.')
    ];
  }

  static async validate(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return { isValid: false, errors: errors.array() };
    }

    const { username, email, password } = req.body;
    const form = new SignupForm();
    form.username = username;
    form.email = email;
    form.password = password;

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return { isValid: false, errors: [{ msg: 'This username has already been taken.' }] };
    }

    // Check if email already exists
    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return { isValid: false, errors: [{ msg: 'This email address has already been taken.' }] };
    }

    return { isValid: true, form };
  }

  async signup() {
    const user = new User({
      username: this.username,
      email: this.email,
      status: 9 // STATUS_INACTIVE
    });

    await user.setPassword(this.password);
    user.generateAuthKey();
    user.generateEmailVerificationToken();

    await user.save();
    return user;
  }
}

module.exports = SignupForm;
