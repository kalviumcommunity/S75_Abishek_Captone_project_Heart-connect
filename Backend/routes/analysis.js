const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth'); // Optional if you want to protect routes
const Analysis = require('../Schema/analysisSchema');

// ✅ Create new feedback
router.post('/feedback', async (req, res) => {
  try {
    const { name, graduation, interviewDate, feedback } = req.body;

    if (!name || !graduation || !interviewDate || !feedback) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const newFeedback = new Analysis({ name, graduation, interviewDate, feedback });
    await newFeedback.save();

    res.status(201).json({ message: 'Feedback saved successfully', feedback: newFeedback });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ✅ Get all feedback entries
router.get('/feedback', async (req, res) => {
  try {
    const allFeedback = await Analysis.find().sort({ createdAt: -1 });
    res.status(200).json(allFeedback);
  } catch (error) {
    res.status(500).json({ message: 'Failed to retrieve feedback', error: error.message });
  }
});

// ✅ Update feedback by ID
router.put('/feedback/:id', async (req, res) => {
  try {
    const { name, graduation, interviewDate, feedback } = req.body;

    const updated = await Analysis.findByIdAndUpdate(
      req.params.id,
      { name, graduation, interviewDate, feedback },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.status(200).json({ message: 'Feedback updated successfully', feedback: updated });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update feedback', error: error.message });
  }
});

// ✅ Delete feedback by ID
router.delete('/feedback/:id', async (req, res) => {
  try {
    const deleted = await Analysis.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete feedback', error: error.message });
  }
});

module.exports = router;