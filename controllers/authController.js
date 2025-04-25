const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (name, userID, email, password, branch) => {
  try {
    if (!name || !userID || !email || !password || !branch) {
      throw new Error('All fields are required');
    }

    const branches = [
      'Risk Management and Compliance',
      'Corporate Finance',
      'Payroll Management',
      'Financial Planning and Analysis',
      'Accounting and Bookkeeping',
      'Treasury and Cash Management',
      'Taxation'
    ];

    if (!branches.includes(branch)) {
      throw new Error('Invalid branch selected');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      throw new Error('Password must be at least 8 characters long, include an uppercase letter, a lowercase letter, a number, and a special character');
    }

    const existingUser = await User.findOne({ $or: [{ name }, { userID }, { email }] });
    if (existingUser) {
      if (existingUser.name === name) throw new Error('User name already exists');
      if (existingUser.userID === userID) throw new Error('User ID already exists');
      if (existingUser.email === email) throw new Error('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      userID,
      email,
      password: hashedPassword,
      branch
    });

    await user.save();
    return {
      success: true,
      message: 'Registration successful',
      user: {
        name: user.name,
        userID: user.userID,
        email: user.email,
        branch: user.branch
      }
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.login = async (userID, password) => {
  try {
    if (!userID || !password) {
      throw new Error('Please provide both userID and password');
    }

    const user = await User.findOne({ userID });
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
      { userID: user.userID },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return {
      success: true,
      message: 'Login successful',
      token,
      user: {
        name: user.name,
        userID: user.userID,
        email: user.email,
        branch: user.branch
      }
    };
  } catch (error) {
    throw new Error(error.message);
  }
};