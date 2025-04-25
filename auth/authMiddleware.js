const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  console.log('Request Headers:', req.headers);
  const authHeader = req.header('Authorization');
  console.log('Authorization Header:', authHeader);

  if (!authHeader) {
    console.log('No Authorization header provided');
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '') : authHeader;
  if (!token) {
    console.log('Token is empty or malformed');
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('Decoded Token:', decoded);
    req.user = { userID: decoded.userID };
    next();
  } catch (error) {
    console.error('Token Verification Error:', error.message);
    return res.status(401).json({ message: 'Invalid or expired token' });
  }
};