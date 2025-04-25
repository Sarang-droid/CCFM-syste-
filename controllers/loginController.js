const authController = require('./authController');

exports.loginUser = async (req, res) => {
  try {
    const { userID, password } = req.body;
    const result = await authController.login(userID, password);
    res.status(200).json({
      message: 'Login successful',
      token: result.token,
      user: result.user
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};