const { body, validationResult } = require('express-validator');
const User = require('./User');

class LoginForm {
  constructor() {
    this.username = '';
    this.password = '';
    this.rememberMe = false;
  }

  static validationRules() {
    return [
      body('username').notEmpty().withMessage('Username cannot be blank.'),
      body('password').notEmpty().withMessage('Password cannot be blank.')
    ];
  }

  static async validate(req) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return { isValid: false, errors: errors.array() };
    }

    const { username, password, rememberMe } = req.body;
    const form = new LoginForm();
    form.username = username;
    form.password = password;
    form.rememberMe = rememberMe || false;

    // Find user by username or email
    let user = await User.findByUsername(username);
    if (!user) {
      user = await User.findByEmail(username);
    }

    if (!user) {
      return { isValid: false, errors: [{ msg: 'Incorrect username or password.' }] };
    }

    if (!(await user.validatePassword(password))) {
      return { isValid: false, errors: [{ msg: 'Incorrect username or password.' }] };
    }

    return { isValid: true, user };
  }
}

module.exports = LoginForm;
