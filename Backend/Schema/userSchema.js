const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  age: {
    type: Number,
    required: true,
    min: 1,
  },
  phone: {
    type: String,
    required: true,
    match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'],
  },
  role: {
    type: String,
    required: true,
    enum: ['Children', 'Parent'],
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other'],
  },
  password: {
    type: String,
    required: function () {
      return this.role === 'Parent';
    },
    minlength: 6,
  },
}, {
  timestamps: true,
});



const User = mongoose.model('User', userSchema);


module.exports = User;
