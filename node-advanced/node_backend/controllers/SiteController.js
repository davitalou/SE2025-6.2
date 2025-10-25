const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');
const LoginForm = require('../models/LoginForm');
const SignupForm = require('../models/SignupForm');
const ContactForm = require('../models/ContactForm');
const PasswordResetRequestForm = require('../models/PasswordResetRequestForm');
const ResetPasswordForm = require('../models/ResetPasswordForm');
const VerifyEmailForm = require('../models/VerifyEmailForm');
const ResendVerificationEmailForm = require('../models/ResendVerificationEmailForm');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Middleware to check if user is guest
const requireGuest = (req, res, next) => {
  if (!req.session.user) {
    next();
  } else {
    res.redirect('/');
  }
};

// Homepage
router.get('/', async (req, res) => {
  try {
    const posts = await Post.findAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['username']
      }],
      order: [['created_at', 'DESC']],
      limit: 10
    });
    
    res.render('site/index', {
      title: 'My Yii Application',
      posts
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    res.render('site/index', {
      title: 'My Yii Application',
      posts: []
    });
  }
});

// Login page
router.get('/login', requireGuest, (req, res) => {
  res.render('site/login', {
    title: 'Login',
    model: new LoginForm()
  });
});

// Login process
router.post('/login', requireGuest, LoginForm.validationRules(), async (req, res) => {
  const validation = await LoginForm.validate(req);
  
  if (!validation.isValid) {
    return res.render('site/login', {
      title: 'Login',
      model: new LoginForm(),
      errors: validation.errors
    });
  }

  req.session.user = validation.user;
  req.flash('success', 'Welcome back!');
  res.redirect('/');
});

// Logout
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/');
  });
});

// Signup page
router.get('/signup', requireGuest, (req, res) => {
  res.render('site/signup', {
    title: 'Signup',
    model: new SignupForm()
  });
});

// Signup process
router.post('/signup', requireGuest, SignupForm.validationRules(), async (req, res) => {
  const validation = await SignupForm.validate(req);
  
  if (!validation.isValid) {
    return res.render('site/signup', {
      title: 'Signup',
      model: new SignupForm(),
      errors: validation.errors
    });
  }

  try {
    const signupForm = new SignupForm();
    signupForm.username = validation.form.username;
    signupForm.email = validation.form.email;
    signupForm.password = validation.form.password;
    
    const user = await signupForm.signup();
    
    req.flash('success', 'Thank you for registration. Please check your inbox for verification email.');
    res.redirect('/');
  } catch (error) {
    console.error('Error during signup:', error);
    req.flash('error', 'There was an error during registration.');
    res.redirect('/signup');
  }
});

// Contact page
router.get('/contact', (req, res) => {
  res.render('site/contact', {
    title: 'Contact',
    model: new ContactForm()
  });
});

// Contact form submission
router.post('/contact', ContactForm.validationRules(), async (req, res) => {
  const validation = await ContactForm.validate(req);
  
  if (!validation.isValid) {
    return res.render('site/contact', {
      title: 'Contact',
      model: new ContactForm(),
      errors: validation.errors
    });
  }

  try {
    const success = await validation.form.sendEmail(process.env.ADMIN_EMAIL || 'admin@example.com');
    
    if (success) {
      req.flash('success', 'Thank you for contacting us. We will respond to you as soon as possible.');
    } else {
      req.flash('error', 'There was an error sending your message.');
    }
    
    res.redirect('/contact');
  } catch (error) {
    console.error('Error sending contact form:', error);
    req.flash('error', 'There was an error sending your message.');
    res.redirect('/contact');
  }
});

// About page
router.get('/about', (req, res) => {
  res.render('site/about', {
    title: 'About'
  });
});

// Request password reset
router.get('/request-password-reset', requireGuest, (req, res) => {
  res.render('site/requestPasswordResetToken', {
    title: 'Request Password Reset',
    model: new PasswordResetRequestForm()
  });
});

// Process password reset request
router.post('/request-password-reset', requireGuest, PasswordResetRequestForm.validationRules(), async (req, res) => {
  const validation = await PasswordResetRequestForm.validate(req);
  
  if (!validation.isValid) {
    return res.render('site/requestPasswordResetToken', {
      title: 'Request Password Reset',
      model: new PasswordResetRequestForm(),
      errors: validation.errors
    });
  }

  try {
    const success = await validation.form.sendEmail();
    
    if (success) {
      req.flash('success', 'Check your email for further instructions.');
      res.redirect('/');
    } else {
      req.flash('error', 'Sorry, we are unable to reset password for the provided email address.');
      res.redirect('/request-password-reset');
    }
  } catch (error) {
    console.error('Error processing password reset request:', error);
    req.flash('error', 'There was an error processing your request.');
    res.redirect('/request-password-reset');
  }
});

// Reset password page
router.get('/reset-password', requireGuest, async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    req.flash('error', 'Invalid token.');
    return res.redirect('/');
  }

  const validation = await ResetPasswordForm.validate(null, token);
  
  if (!validation.isValid) {
    req.flash('error', 'Invalid or expired token.');
    return res.redirect('/');
  }

  res.render('site/resetPassword', {
    title: 'Reset Password',
    model: new ResetPasswordForm(token),
    token
  });
});

// Process password reset
router.post('/reset-password', requireGuest, ResetPasswordForm.validationRules(), async (req, res) => {
  const { token } = req.body;
  
  const validation = await ResetPasswordForm.validate(req, token);
  
  if (!validation.isValid) {
    return res.render('site/resetPassword', {
      title: 'Reset Password',
      model: new ResetPasswordForm(token),
      token,
      errors: validation.errors
    });
  }

  try {
    const success = await validation.form.resetPassword();
    
    if (success) {
      req.flash('success', 'New password saved.');
      res.redirect('/');
    } else {
      req.flash('error', 'There was an error resetting your password.');
      res.redirect('/reset-password?token=' + token);
    }
  } catch (error) {
    console.error('Error resetting password:', error);
    req.flash('error', 'There was an error resetting your password.');
    res.redirect('/reset-password?token=' + token);
  }
});

// Verify email
router.get('/verify-email', requireGuest, async (req, res) => {
  const { token } = req.query;
  
  if (!token) {
    req.flash('error', 'Invalid token.');
    return res.redirect('/');
  }

  try {
    const validation = await VerifyEmailForm.validate(token);
    
    if (!validation.isValid) {
      req.flash('error', 'Invalid or expired token.');
      return res.redirect('/');
    }

    const user = await validation.form.verifyEmail();
    
    if (user) {
      req.session.user = user;
      req.flash('success', 'Your email has been confirmed!');
      res.redirect('/');
    } else {
      req.flash('error', 'Sorry, we are unable to verify your account with provided token.');
      res.redirect('/');
    }
  } catch (error) {
    console.error('Error verifying email:', error);
    req.flash('error', 'There was an error verifying your email.');
    res.redirect('/');
  }
});

// Resend verification email
router.get('/resend-verification-email', requireGuest, (req, res) => {
  res.render('site/resendVerificationEmail', {
    title: 'Resend Verification Email',
    model: new ResendVerificationEmailForm()
  });
});

// Process resend verification email
router.post('/resend-verification-email', requireGuest, ResendVerificationEmailForm.validationRules(), async (req, res) => {
  const validation = await ResendVerificationEmailForm.validate(req);
  
  if (!validation.isValid) {
    return res.render('site/resendVerificationEmail', {
      title: 'Resend Verification Email',
      model: new ResendVerificationEmailForm(),
      errors: validation.errors
    });
  }

  try {
    const success = await validation.form.sendEmail();
    
    if (success) {
      req.flash('success', 'Check your email for further instructions.');
      res.redirect('/');
    } else {
      req.flash('error', 'Sorry, we are unable to resend verification email for the provided email address.');
      res.redirect('/resend-verification-email');
    }
  } catch (error) {
    console.error('Error resending verification email:', error);
    req.flash('error', 'There was an error resending the verification email.');
    res.redirect('/resend-verification-email');
  }
});

module.exports = router;