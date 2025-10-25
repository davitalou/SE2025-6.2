const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Post = require('../models/Post');
const User = require('../models/User');
const Comment = require('../models/Comment');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// List all posts
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const offset = (page - 1) * limit;

    const { count, rows: posts } = await Post.findAndCountAll({
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }],
      order: [['created_at', 'DESC']],
      limit,
      offset
    });

    const totalPages = Math.ceil(count / limit);

    res.render('post/index', {
      title: 'Posts',
      posts,
      currentPage: page,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
      nextPage: page + 1,
      prevPage: page - 1
    });
  } catch (error) {
    console.error('Error fetching posts:', error);
    req.flash('error', 'Error loading posts.');
    res.redirect('/');
  }
});

// View single post
router.get('/:id', async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id, {
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }]
    });

    if (!post) {
      req.flash('error', 'Post not found.');
      return res.redirect('/post');
    }

    // Get comments for this post
    const comments = await Comment.findAll({
      where: { post_id: req.params.id },
      include: [{
        model: User,
        as: 'author',
        attributes: ['id', 'username']
      }],
      order: [['created_at', 'ASC']]
    });

    res.render('post/view', {
      title: post.title,
      post,
      comments
    });
  } catch (error) {
    console.error('Error fetching post:', error);
    req.flash('error', 'Error loading post.');
    res.redirect('/post');
  }
});

// Create post form
router.get('/create', requireAuth, (req, res) => {
  res.render('post/create', {
    title: 'Create Post',
    post: new Post()
  });
});

// Create post
router.post('/create', requireAuth, [
  body('title').notEmpty().withMessage('Title cannot be blank.'),
  body('body').notEmpty().withMessage('Body cannot be blank.')
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('post/create', {
      title: 'Create Post',
      post: new Post(),
      errors: errors.array()
    });
  }

  try {
    const { title, body } = req.body;
    
    const post = await Post.create({
      title,
      body,
      created_by: req.session.user.id
    });

    req.flash('success', 'Post created successfully.');
    res.redirect(`/post/${post.id}`);
  } catch (error) {
    console.error('Error creating post:', error);
    req.flash('error', 'Error creating post.');
    res.redirect('/post/create');
  }
});

// Edit post form
router.get('/:id/edit', requireAuth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      req.flash('error', 'Post not found.');
      return res.redirect('/post');
    }

    // Check if user owns the post
    if (post.created_by !== req.session.user.id) {
      req.flash('error', 'You can only edit your own posts.');
      return res.redirect('/post');
    }

    res.render('post/edit', {
      title: 'Edit Post',
      post
    });
  } catch (error) {
    console.error('Error fetching post for edit:', error);
    req.flash('error', 'Error loading post.');
    res.redirect('/post');
  }
});

// Update post
router.post('/:id/edit', requireAuth, [
  body('title').notEmpty().withMessage('Title cannot be blank.'),
  body('body').notEmpty().withMessage('Body cannot be blank.')
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('post/edit', {
      title: 'Edit Post',
      post: await Post.findByPk(req.params.id),
      errors: errors.array()
    });
  }

  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      req.flash('error', 'Post not found.');
      return res.redirect('/post');
    }

    // Check if user owns the post
    if (post.created_by !== req.session.user.id) {
      req.flash('error', 'You can only edit your own posts.');
      return res.redirect('/post');
    }

    const { title, body } = req.body;
    
    await post.update({
      title,
      body
    });

    req.flash('success', 'Post updated successfully.');
    res.redirect(`/post/${post.id}`);
  } catch (error) {
    console.error('Error updating post:', error);
    req.flash('error', 'Error updating post.');
    res.redirect(`/post/${req.params.id}/edit`);
  }
});

// Delete post
router.post('/:id/delete', requireAuth, async (req, res) => {
  try {
    const post = await Post.findByPk(req.params.id);
    
    if (!post) {
      req.flash('error', 'Post not found.');
      return res.redirect('/post');
    }

    // Check if user owns the post
    if (post.created_by !== req.session.user.id) {
      req.flash('error', 'You can only delete your own posts.');
      return res.redirect('/post');
    }

    await post.destroy();

    req.flash('success', 'Post deleted successfully.');
    res.redirect('/post');
  } catch (error) {
    console.error('Error deleting post:', error);
    req.flash('error', 'Error deleting post.');
    res.redirect('/post');
  }
});

module.exports = router;
