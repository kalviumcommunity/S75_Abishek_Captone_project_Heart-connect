const express = require('express');
const router=express.Router()
const bcrypt = require('bcryptjs');
const {Children}=require('../schema/childSchema')



router.post('/children/signup', async (req, res) => {
  try {
    const { randomId, childPassword, name } = req.body;  

    if (!randomId || !childPassword || !name) {
      return res.status(400).json({ message: 'Random ID, Password, and Name are required' });
    }

    const existingChild = await Children.findOne({ randomId });
    if (existingChild) {
      return res.status(409).json({ message: 'Random ID already taken' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(childPassword, salt);

    const childData = {
      randomId,
      childPassword: hashedPassword,
      name,  
    };

    const newChild = new Children(childData);
    await newChild.save();

    res.status(201).json({ message: 'Child user registered successfully' });

  } catch (error) {
    console.error('Children Signup error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});





router.post('/children/login', async (req, res) => {
  try {
    const { randomId, childPassword } = req.body;

    if (!randomId || !childPassword) {
      return res.status(400).json({ message: 'Random ID and password are required' });
    }

    const child = await Children.findOne({ randomId });
    if (!child) {
      return res.status(404).json({ message: 'Child not found' });
    }

    const isMatch = await bcrypt.compare(childPassword, child.childPassword);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid password' });
    }

    res.status(200).json({ message: 'Login successful' });

  } catch (error) {
    console.error('Child Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = router;
