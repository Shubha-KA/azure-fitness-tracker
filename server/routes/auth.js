const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

// User schema for MongoDB
const userSchema = new mongoose.Schema({
  fullname: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['client', 'trainer'], default: 'client' },

  goal: {
    type: String,
    required: function () {
      return this.role === 'client';
    }
  },

  specialization: {
    type: String,
    required: function () {
      return this.role === 'trainer';
    }
  },

  experience: {
    type: String,
    required: function () {
      return this.role === 'trainer';
    }
  },

  certification: {
    type: String,
    default: ''
  }
});

const User = mongoose.model('User', userSchema);

// Register
router.post('/register', async (req, res) => {

  console.log('REGISTER API HIT');

  const {
    fullname,
    email,
    password,
    role,
    goal,
    specialization,
    experience,
    certification
  } = req.body;

  if (!fullname || !email || !password || !role) {
    return res.status(400).json({
      msg: 'Full name, email, password and role are required'
    });
  }

  try {

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        msg: 'User already exists'
      });
    }

    const userData = {
      fullname,
      email,
      password,
      role
    };

    if (role === 'client') {
      userData.goal = goal;
    }

    if (role === 'trainer') {
      userData.specialization = specialization;
      userData.experience = experience;
      userData.certification = certification || '';
    }

    const newUser = new User(userData);

    await newUser.save();

    console.log('✅ User registered:', email);

    res.status(201).json({
      success: true,
      msg: 'Registered successfully'
    });

  } catch (err) {

    console.error('❌ Registration Error:', err.message);

    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

// Login
router.post('/login', async (req, res) => {

  const { email, password, role } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({
      msg: 'All fields are required'
    });
  }

  try {

    const user = await User.findOne({
      email,
      password,
      role
    });

    if (!user) {
      return res.status(400).json({
        msg: 'Invalid credentials or role'
      });
    }

    console.log('✅ User login:', email);

    res.json({
      success: true,
      fullname: user.fullname,
      email: user.email,
      role: user.role,
      goal: user.goal,
      specialization: user.specialization,
      experience: user.experience,
      certification: user.certification
    });

  } catch (err) {

    console.error('❌ Login Error:', err.message);

    res.status(500).json({
      msg: 'Server error',
      error: err.message
    });
  }
});

module.exports = router;
