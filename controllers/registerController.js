const authController = require('./authController');

exports.registerUser = async (req, res) => {
  try {
    const { name, userID, email, password, branch } = req.body;
    const result = await authController.register(name, userID, email, password, branch);
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};