const sequelize = require('../config/database');
const User = require('../models/User');
const Post = require('../models/Post');
const Comment = require('../models/Comment');

// Set up model associations
const models = { User, Post, Comment };
Object.keys(models).forEach(modelName => {
  if (models[modelName].associate) {
    models[modelName].associate(models);
  }
});

async function migrate() {
  try {
    console.log('Starting database migration...');
    
    // Test database connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    // Sync database (create tables if they don't exist)
    await sequelize.sync({ force: false, alter: true });
    console.log('Database synchronized successfully.');
    
    // Create a default admin user if no users exist
    const userCount = await User.count();
    if (userCount === 0) {
      console.log('Creating default admin user...');
      const adminUser = new User({
        username: 'admin',
        email: 'admin@example.com',
        status: 10, // STATUS_ACTIVE
        auth_key: require('crypto').randomBytes(16).toString('hex'),
        created_at: Math.floor(Date.now() / 1000),
        updated_at: Math.floor(Date.now() / 1000)
      });
      
      await adminUser.setPassword('admin123');
      await adminUser.save();
      
      console.log('Default admin user created:');
      console.log('Username: admin');
      console.log('Password: admin123');
      console.log('Email: admin@example.com');
    }
    
    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
