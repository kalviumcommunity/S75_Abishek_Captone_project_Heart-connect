const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Children = require('../Schema/childSchema');
const verifyToken = require('../middleware/auth');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET ;

router.post('/signup', async (req, res) => {
  try {
    const { randomId, childPassword, name } = req.body;

    if (!randomId || !childPassword || !name) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingChild = await Children.findOne({ randomId });
    if (existingChild) return res.status(409).json({ message: 'Random ID already in use' });

    const hashedPassword = await bcrypt.hash(childPassword, 10);
    const newChild = new Children({ randomId, childPassword: hashedPassword, name });
    await newChild.save();

    res.status(201).json({ message: 'Child registered successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});




router.post('/login', async (req, res) => {
  try {
    const { randomId, childPassword } = req.body;

    const child = await Children.findOne({ randomId });
    if (!child) return res.status(404).json({ message: 'Child not found' });

    const isMatch = await bcrypt.compare(childPassword, child.childPassword);
    if (!isMatch) return res.status(401).json({ message: 'Invalid password' });

    const token = jwt.sign({ id: child._id, role: 'Child' }, JWT_SECRET, { expiresIn: '2h' });
    res.status(200).json({ message: 'Login Successful', token });
  } catch (err) {
    res.status(500).json({ message: 'Login Error', error: err.message });
  }
});

router.get('/child/:randomId', verifyToken, async (req, res) => {
  const child = await Children.findOne({ randomId: req.params.randomId }).select('-childPassword');
  if (!child) return res.status(404).json({ message: 'Child not found' });
  res.status(200).json({ child });
});

module.exports = router;
