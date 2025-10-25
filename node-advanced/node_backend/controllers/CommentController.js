const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Comment = require('../models/Comment');
const Post = require('../models/Post');
const User = require('../models/User');

// Middleware to check if user is authenticated
const requireAuth = (req, res, next) => {
  if (req.session.user) {
    next();
  } else {
    res.redirect('/login');
  }
};

// Create comment
router.post('/create', requireAuth, [
  body('post_id').notEmpty().withMessage('Post ID is required.'),
  body('body').notEmpty().withMessage('Comment cannot be blank.')
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    req.flash('error', 'Please fill in all required fields.');
    return res.redirect(`/post/${req.body.post_id}`);
  }

  try {
    const { post_id, body } = req.body;
    
    // Check if post exists
    const post = await Post.findByPk(post_id);
    if (!post) {
      req.flash('error', 'Post not found.');
      return res.redirect('/post');
    }

    const comment = await Comment.create({
      post_id,
      body,
      created_by: req.session.user.id
    });

    req.flash('success', 'Comment added successfully.');
    res.redirect(`/post/${post_id}`);
  } catch (error) {
    console.error('Error creating comment:', error);
    req.flash('error', 'Error adding comment.');
    res.redirect(`/post/${req.body.post_id}`);
  }
});

// Edit comment form
router.get('/:id/edit', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id, {
      include: [{
        model: Post,
        as: 'post',
        attributes: ['id', 'title']
      }]
    });
    
    if (!comment) {
      req.flash('error', 'Comment not found.');
      return res.redirect('/post');
    }

    // Check if user owns the comment
    if (comment.created_by !== req.session.user.id) {
      req.flash('error', 'You can only edit your own comments.');
      return res.redirect(`/post/${comment.post_id}`);
    }

    res.render('comment/edit', {
      title: 'Edit Comment',
      comment
    });
  } catch (error) {
    console.error('Error fetching comment for edit:', error);
    req.flash('error', 'Error loading comment.');
    res.redirect('/post');
  }
});

// Update comment
router.post('/:id/edit', requireAuth, [
  body('body').notEmpty().withMessage('Comment cannot be blank.')
], async (req, res) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.render('comment/edit', {
      title: 'Edit Comment',
      comment: await Comment.findByPk(req.params.id),
      errors: errors.array()
    });
  }

  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      req.flash('error', 'Comment not found.');
      return res.redirect('/post');
    }

    // Check if user owns the comment
    if (comment.created_by !== req.session.user.id) {
      req.flash('error', 'You can only edit your own comments.');
      return res.redirect(`/post/${comment.post_id}`);
    }

    const { body } = req.body;
    
    await comment.update({
      body
    });

    req.flash('success', 'Comment updated successfully.');
    res.redirect(`/post/${comment.post_id}`);
  } catch (error) {
    console.error('Error updating comment:', error);
    req.flash('error', 'Error updating comment.');
    res.redirect(`/comment/${req.params.id}/edit`);
  }
});

// Delete comment
router.post('/:id/delete', requireAuth, async (req, res) => {
  try {
    const comment = await Comment.findByPk(req.params.id);
    
    if (!comment) {
      req.flash('error', 'Comment not found.');
      return res.redirect('/post');
    }

    // Check if user owns the comment
    if (comment.created_by !== req.session.user.id) {
      req.flash('error', 'You can only delete your own comments.');
      return res.redirect(`/post/${comment.post_id}`);
    }

    const postId = comment.post_id;
    await comment.destroy();

    req.flash('success', 'Comment deleted successfully.');
    res.redirect(`/post/${postId}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    req.flash('error', 'Error deleting comment.');
    res.redirect('/post');
  }
});

module.exports = router;
