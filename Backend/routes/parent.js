const express = require('express');
const router=express.Router()
const bcrypt = require('bcrypt');
const User = require('../schema/userSchema'); 


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
    const userData = {
      name,
      age,
      phone,
      role,
      gender,
    };
    if (role === 'Parent') {
      
      const hashedPassword = await bcrypt.hash(password, 10);
      userData.password = hashedPassword; 
    const newUser = new User(userData);
    await newUser.save();

    res.status(201).json({ message: 'Parent  registered successfully',data:newUser });

  }} catch (error) {
    
    console.error('Parent Signup error:', error);
    res.status(500).json({ message: 'Server error',error:error.message });
  }
});



router.get('/user/:phone', async (req, res) => {
  try {
    const phone = req.params.phone;
    const user = await User.findOne({ phone });

    if (!user) {
      return res.status(404).json({ message: 'User not found with that mobile number' });
    }

    res.status(200).json({ message: 'User fetched successfully', data: user });
  } catch (error) {
    console.error('Error fetching user by mobile:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});








router.post('/parent/login', async (req, res) => {
  try {
    const { name, phone, password } = req.body;

    if (!name || !phone || !password) {
      return res.status(400).json({ message: 'Name, phone number, and password are required' });
    }
    const user = await User.findOne({ name, phone });
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials - user not found' });
    }
    if (user.role !== 'Parent') {
      return res.status(403).json({ message: 'Access denied. Only parents can login here.' });
    }

   
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials - incorrect password' });
    }

    
    res.status(200).json({ message: 'Login successful', user });

  } catch (error) {
    console.error('Parent Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});





router.put('/update/:phone', async (req, res) => {
  try {
    const { phone } = req.params;
    const { name, age, gender, role, newPhone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ message: 'Parent not found' });
    }

    if (user.role !== 'Parent') {
      return res.status(403).json({ message: 'Only Parent data can be updated here' });
    }

    if (newPhone && newPhone !== phone) {
      const phoneExists = await User.findOne({ phone: newPhone });
      if (phoneExists) {
        return res.status(409).json({ message: 'New phone number already in use' });
      }
      user.phone = newPhone;
    }

    if (name) user.name = name;
    if (age) user.age = age;
    if (gender) user.gender = gender;
    if (role) user.role = role;

    await user.save();
    res.status(200).json({ message: 'Parent updated successfully', data: user });

  } catch (error) {
    console.error('Error updating parent:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});







module.exports = router;
