const express = require('express');
const router = express.Router();
const Feeling = require('../models/Feeling');

// Get all feelings
router.get('/', async (req, res) => {
  try {
    const feelings = await Feeling.find()
      .sort({ createdAt: -1 })
      .populate('likes', 'userId userRole timestamp')
      .populate('comments', 'text author authorRole timestamp');
    
    res.status(200).json({
      success: true,
      data: feelings,
      message: 'Feelings retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching feelings:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feelings',
      error: error.message
    });
  }
});

// Create a new feeling
router.post('/', async (req, res) => {
  try {
    const { text, author, authorRole } = req.body;

    if (!text || !author || !authorRole) {
      return res.status(400).json({
        success: false,
        message: 'Text, author, and authorRole are required'
      });
    }

    const newFeeling = new Feeling({
      text,
      author,
      authorRole,
      likes: [],
      comments: []
    });

    await newFeeling.save();

    res.status(201).json({
      success: true,
      data: newFeeling,
      message: 'Feeling posted successfully'
    });
  } catch (error) {
    console.error('Error creating feeling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create feeling',
      error: error.message
    });
  }
});

// Toggle like on a feeling
router.post('/:id/like', async (req, res) => {
  try {
    const { userId, userRole } = req.body;
    const feelingId = req.params.id;

    if (!userId || !userRole) {
      return res.status(400).json({
        success: false,
        message: 'userId and userRole are required'
      });
    }

    const feeling = await Feeling.findById(feelingId);
    if (!feeling) {
      return res.status(404).json({
        success: false,
        message: 'Feeling not found'
      });
    }

    const wasLiked = feeling.toggleLike(userId, userRole);
    await feeling.save();

    res.status(200).json({
      success: true,
      data: {
        feelingId,
        wasLiked,
        likesCount: feeling.likesCount
      },
      message: wasLiked ? 'Feeling liked' : 'Feeling unliked'
    });
  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to toggle like',
      error: error.message
    });
  }
});

// Add comment to a feeling
router.post('/:id/comment', async (req, res) => {
  try {
    const { text, author, authorRole } = req.body;
    const feelingId = req.params.id;

    if (!text || !author || !authorRole) {
      return res.status(400).json({
        success: false,
        message: 'Text, author, and authorRole are required'
      });
    }

    const feeling = await Feeling.findById(feelingId);
    if (!feeling) {
      return res.status(404).json({
        success: false,
        message: 'Feeling not found'
      });
    }

    const newComment = {
      text,
      author,
      authorRole,
      timestamp: new Date()
    };

    feeling.comments.push(newComment);
    await feeling.save();

    res.status(201).json({
      success: true,
      data: {
        feelingId,
        comment: newComment
      },
      message: 'Comment added successfully'
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add comment',
      error: error.message
    });
  }
});

// Get a specific feeling with all details
router.get('/:id', async (req, res) => {
  try {
    const feeling = await Feeling.findById(req.params.id);
    
    if (!feeling) {
      return res.status(404).json({
        success: false,
        message: 'Feeling not found'
      });
    }

    res.status(200).json({
      success: true,
      data: feeling,
      message: 'Feeling retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching feeling:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve feeling',
      error: error.message
    });
  }
});

module.exports = router;
