const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../Schema/userSchema');
const verifyToken = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET;

router.post('/signup', async (req, res) => {
  try {
    const { name, age, phone, role, gender, password } = req.body;

    if (!name || !age || !phone || !role || !gender) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (role === 'Parent' && !password) {
      return res.status(400).json({ message: 'Password is required for Parent role' });
    }

    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(409).json({ message: 'Phone number already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      age,
      phone,
      role,
      gender,
      password: hashedPassword
    });

    await newUser.save();
    res.status(201).json({ message: 'Parent registered successfully', data: newUser });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});






router.post('/login', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    const user = await User.findOne({ name, phone });
    if (!user || user.role !== 'Parent') {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });

    res.status(200).json({ message: 'Login successful', token });

  } catch (error) {
    res.status(500).json({ message: 'Login error', error: error.message });
  }
});




router.get('/user/:phone', verifyToken, async (req, res) => {
  try {
    const user = await User.findOne({ phone: req.params.phone }).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.status(200).json({ message: 'User fetched', data: user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});




router.put('/update/:phone', verifyToken, async (req, res) => {
  try {
    const { name, age, gender, role, newPhone } = req.body;
    const user = await User.findOne({ phone: req.params.phone });

    if (!user || user.role !== 'Parent') {
      return res.status(403).json({ message: 'Only Parent data can be updated here' });
    }

    if (newPhone && newPhone !== user.phone) {
      const existing = await User.findOne({ phone: newPhone });
      if (existing) return res.status(409).json({ message: 'New phone number already in use' });
      user.phone = newPhone;
    }

    if (name) user.name = name;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (role) user.role = role;

    await user.save();
    res.status(200).json({ message: 'Updated successfully', data: user });

  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
