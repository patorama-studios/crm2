const jwt = require('jsonwebtoken');
const db = require('../config/database');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const [users] = await db.query(
      'SELECT id, name, email, role, status FROM users WHERE id = ? AND status = ?',
      [decoded.userId, 'active']
    );

    if (users.length === 0) {
      return res.status(401).json({ error: 'User not found or inactive' });
    }

    req.user = users[0];
    req.token = token;
    next();
  } catch (error) {
    console.error('Auth error:', error.message);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied - insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticate, authorize };