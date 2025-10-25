# Node.js Backend - Yii2 Advanced Migration

This is a Node.js backend application migrated from Yii2 PHP framework, maintaining all the original functionality and interfaces.

## Features

- **User Authentication**: Login, Signup, Password Reset, Email Verification
- **Post Management**: Create, Read, Update, Delete posts
- **Comment System**: Add, Edit, Delete comments on posts
- **Contact Form**: Email contact functionality
- **Session Management**: Secure user sessions
- **Database Integration**: MySQL with Sequelize ORM

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## Installation

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Database Setup**
   - Create a MySQL database named `yii2_advanced`
   - Update the database configuration in `config.env`:
     ```
     DB_HOST=localhost
     DB_PORT=3306
     DB_NAME=yii2_advanced
     DB_USER=your_username
     DB_PASSWORD=your_password
     ```

3. **Environment Configuration**
   - Copy `config.env` and update the values:
     ```
     NODE_ENV=development
     PORT=3000
     JWT_SECRET=your_super_secret_jwt_key_here
     SESSION_SECRET=your_super_secret_session_key_here
     ADMIN_EMAIL=admin@example.com
     SMTP_HOST=smtp.gmail.com
     SMTP_PORT=587
     SMTP_USER=your_email@gmail.com
     SMTP_PASS=your_app_password
     ```

4. **Run Database Migration**
   ```bash
   npm run migrate
   ```

5. **Start the Application**
   ```bash
   npm start
   # or for development with auto-reload
   npm run dev
   ```

## Default Admin User

After running the migration, a default admin user is created:
- **Username**: admin
- **Password**: admin123
- **Email**: admin@example.com

**Important**: Change the default password after first login!

## API Endpoints

### Authentication
- `GET /login` - Login page
- `POST /login` - Login process
- `GET /signup` - Signup page
- `POST /signup` - Signup process
- `POST /logout` - Logout
- `GET /request-password-reset` - Password reset request
- `POST /request-password-reset` - Process password reset request
- `GET /reset-password` - Reset password page
- `POST /reset-password` - Process password reset
- `GET /verify-email` - Email verification
- `GET /resend-verification-email` - Resend verification email
- `POST /resend-verification-email` - Process resend verification

### Posts
- `GET /post` - List all posts
- `GET /post/:id` - View single post
- `GET /post/create` - Create post form
- `POST /post/create` - Create post
- `GET /post/:id/edit` - Edit post form
- `POST /post/:id/edit` - Update post
- `POST /post/:id/delete` - Delete post

### Comments
- `POST /comment/create` - Create comment
- `GET /comment/:id/edit` - Edit comment form
- `POST /comment/:id/edit` - Update comment
- `POST /comment/:id/delete` - Delete comment

### Other
- `GET /` - Homepage
- `GET /about` - About page
- `GET /contact` - Contact page
- `POST /contact` - Contact form submission

## Database Schema

### Users Table
- `id` - Primary key
- `username` - Unique username
- `email` - Unique email
- `password_hash` - Hashed password
- `auth_key` - Authentication key
- `password_reset_token` - Password reset token
- `verification_token` - Email verification token
- `status` - User status (0=deleted, 9=inactive, 10=active)
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### Posts Table
- `id` - Primary key
- `title` - Post title
- `body` - Post content
- `created_by` - User ID who created the post
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

### Comments Table
- `id` - Primary key
- `post_id` - Foreign key to posts table
- `body` - Comment content
- `created_by` - User ID who created the comment
- `created_at` - Creation timestamp
- `updated_at` - Update timestamp

## Security Features

- Password hashing with bcrypt
- JWT tokens for authentication
- Session management
- CSRF protection
- Input validation
- SQL injection prevention with Sequelize ORM

## Development

### Running Tests
```bash
npm test
```

### Code Structure
```
node-backend/
├── config/
│   ├── database.js          # Database configuration
│   └── config.env          # Environment variables
├── controllers/
│   ├── SiteController.js    # Main site controller
│   ├── PostController.js    # Post management
│   └── CommentController.js # Comment management
├── models/
│   ├── User.js             # User model
│   ├── Post.js             # Post model
│   ├── Comment.js          # Comment model
│   ├── LoginForm.js        # Login form validation
│   ├── SignupForm.js       # Signup form validation
│   ├── ContactForm.js      # Contact form validation
│   ├── PasswordResetRequestForm.js
│   ├── ResetPasswordForm.js
│   ├── VerifyEmailForm.js
│   └── ResendVerificationEmailForm.js
├── views/
│   ├── layouts/
│   │   └── main.ejs         # Main layout template
│   ├── site/               # Site pages
│   ├── post/               # Post pages
│   └── comment/            # Comment pages
├── migrations/
│   └── migrate.js          # Database migration script
├── public/                 # Static files
├── app.js                  # Main application file
└── package.json           # Dependencies and scripts
```

## Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check MySQL is running
   - Verify database credentials in `config.env`
   - Ensure database exists

2. **Email Not Sending**
   - Check SMTP configuration in `config.env`
   - Verify email credentials
   - Check firewall settings

3. **Session Issues**
   - Clear browser cookies
   - Check session secret in `config.env`
   - Restart the application

## Migration from PHP

This Node.js application maintains the same functionality as the original Yii2 PHP application:

- ✅ User authentication system
- ✅ Post management
- ✅ Comment system
- ✅ Contact form
- ✅ Email functionality
- ✅ Session management
- ✅ Database operations
- ✅ Input validation
- ✅ Security features

The interface and user experience remain identical to the original PHP application.
