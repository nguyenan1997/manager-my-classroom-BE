const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Parent } = require('../models');
const { validationResult } = require('express-validator');
const { sequelize } = require('../models');

// Register initial admin (only for first time setup)
const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, role = 'admin' } = req.body;

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { role: 'admin' }
    });

    if (existingAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Admin account already exists. Please use /api/users to create staff accounts.'
      });
    }

    // Only allow creating admin in register endpoint
    if (role !== 'admin') {
      return res.status(400).json({
        success: false,
        message: 'This endpoint is only for creating initial admin. Use /api/users to create staff.'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: { email }
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create admin user
    const user = await User.create({
      email,
      password_hash: passwordHash,
      role: 'admin'
    });

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'email', 'password_hash', 'role']
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Get current user profile (supports both user and parent)
const getProfile = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    if (role === 'parent') {
      return getParentProfile(req, res);
    }

    const user = await User.findByPk(userId, {
      attributes: ['id', 'email', 'role', 'created_at']
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Parent login
const parentLogin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find parent by email
    const parent = await Parent.findOne({
      where: { email },
      attributes: ['id', 'name', 'email', 'phone', 'password_hash']
    });

    if (!parent) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Check if parent has password set
    if (!parent.password_hash) {
      return res.status(401).json({
        success: false,
        message: 'Account not activated. Please contact staff to set up your account.'
      });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, parent.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token with parent role
    const token = jwt.sign(
      { 
        userId: parent.id, 
        role: 'parent',
        parentId: parent.id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        parent: {
          id: parent.id,
          name: parent.name,
          email: parent.email,
          phone: parent.phone,
          role: 'parent'
        },
        token
      }
    });
  } catch (error) {
    console.error('Parent login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// Helper function: Auto-assign staff to parent (choose staff with least parents)
const assignStaffToParent = async () => {
  try {
    // Get all staff users (admin and staff)
    const staffUsers = await User.findAll({
      where: {
        role: ['admin', 'staff']
      },
      attributes: ['id', 'email', 'role']
    });

    if (staffUsers.length === 0) {
      throw new Error('No staff available to assign parent');
    }

    // Count parents for each staff
    const staffWithCounts = await Promise.all(
      staffUsers.map(async (staff) => {
        const parentCount = await Parent.count({
          where: { created_by: staff.id }
        });
        return {
          id: staff.id,
          email: staff.email,
          role: staff.role,
          parentCount
        };
      })
    );

    // Sort by parent count (ascending) and return staff with least parents
    staffWithCounts.sort((a, b) => a.parentCount - b.parentCount);
    return staffWithCounts[0].id;
  } catch (error) {
    console.error('Error assigning staff to parent:', error);
    // Fallback: return first admin or staff
    const fallbackStaff = await User.findOne({
      where: {
        role: ['admin', 'staff']
      },
      order: [['created_at', 'ASC']]
    });
    return fallbackStaff ? fallbackStaff.id : null;
  }
};

// Parent register (self-registration or activate existing account)
const parentRegister = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, email, password, phone } = req.body;

    // Check if parent already exists
    const existingParent = await Parent.findOne({
      where: { email }
    });

    if (existingParent) {
      // If parent exists but no password, allow activation
      if (!existingParent.password_hash) {
        // Hash password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Update parent with password (and optionally update name/phone if provided)
        const updateData = { password_hash: passwordHash };
        if (name) updateData.name = name;
        if (phone) updateData.phone = phone;

        await existingParent.update(updateData);

        // Get assigned staff info
        const assignedStaff = await User.findByPk(existingParent.created_by, {
          attributes: ['id', 'email', 'role']
        });

        // Generate JWT token
        const token = jwt.sign(
          { 
            userId: existingParent.id, 
            role: 'parent',
            parentId: existingParent.id 
          },
          process.env.JWT_SECRET,
          { expiresIn: process.env.JWT_EXPIRE || '7d' }
        );

        return res.status(201).json({
          success: true,
          message: 'Account activated successfully',
          data: {
            parent: {
              id: existingParent.id,
              name: existingParent.name,
              email: existingParent.email,
              phone: existingParent.phone,
              role: 'parent'
            },
            assigned_staff: assignedStaff ? {
              id: assignedStaff.id,
              email: assignedStaff.email,
              role: assignedStaff.role
            } : null,
            token
          }
        });
      } else {
        // Parent exists and has password
        return res.status(400).json({
          success: false,
          message: 'Account already exists. Please use login instead.'
        });
      }
    }

    // Create new parent account (self-registration)
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Auto-assign staff to parent
    const assignedStaffId = await assignStaffToParent();
    if (!assignedStaffId) {
      return res.status(500).json({
        success: false,
        message: 'No staff available to assign. Please contact administrator.'
      });
    }

    // Create parent with assigned staff
    const parent = await Parent.create({
      name,
      email,
      phone: phone || null,
      password_hash: passwordHash,
      created_by: assignedStaffId // Auto-assigned to staff
    });

    // Get assigned staff info
    const assignedStaff = await User.findByPk(assignedStaffId, {
      attributes: ['id', 'email', 'role']
    });

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: parent.id, 
        role: 'parent',
        parentId: parent.id 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );

    res.status(201).json({
      success: true,
      message: 'Account registered successfully',
      data: {
        parent: {
          id: parent.id,
          name: parent.name,
          email: parent.email,
          phone: parent.phone,
          role: 'parent'
        },
        assigned_staff: assignedStaff ? {
          id: assignedStaff.id,
          email: assignedStaff.email,
          role: assignedStaff.role
        } : null,
        token
      }
    });
  } catch (error) {
    console.error('Parent register error:', error);
    
    // Handle unique constraint violation
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Email already registered. Please use login instead.'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// Get parent profile
const getParentProfile = async (req, res) => {
  try {
    const parentId = req.user.parentId || req.user.id;

    const parent = await Parent.findByPk(parentId, {
      attributes: ['id', 'name', 'email', 'phone', 'created_at']
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    res.json({
      success: true,
      data: {
        ...parent.toJSON(),
        role: 'parent'
      }
    });
  } catch (error) {
    console.error('Get parent profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  register,
  login,
  getProfile,
  parentLogin,
  parentRegister,
  getParentProfile
};

