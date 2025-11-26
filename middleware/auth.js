const jwt = require('jsonwebtoken');
const { User, Parent } = require('../models');

const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'No token provided, authorization denied'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if it's a parent or user
    if (decoded.role === 'parent') {
      // Verify parent still exists
      const parent = await Parent.findByPk(decoded.userId, {
        attributes: ['id', 'name', 'email', 'phone']
      });

      if (!parent) {
        return res.status(401).json({
          success: false,
          message: 'Parent account not found'
        });
      }

      req.user = {
        id: parent.id,
        parentId: parent.id,
        email: parent.email,
        name: parent.name,
        role: 'parent'
      };
    } else {
      // Verify user (admin/staff) still exists
      const user = await User.findByPk(decoded.userId, {
        attributes: ['id', 'email', 'role']
      });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'User not found'
        });
      }

      req.user = user.toJSON();
    }

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    res.status(500).json({
      success: false,
      message: 'Server error during authentication'
    });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Insufficient permissions'
      });
    }

    next();
  };
};

module.exports = { authenticate, authorize };

