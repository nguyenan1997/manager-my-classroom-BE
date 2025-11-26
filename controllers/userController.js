const { User } = require('../models');
const { validationResult } = require('express-validator');
const bcrypt = require('bcryptjs');

// Get all users (admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: ['id', 'email', 'role', 'created_at'],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: users.length,
      data: users.map(u => u.toJSON())
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get user by ID (admin only)
const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
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
    console.error('Get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create staff (admin only)
const createStaff = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password, role = 'staff' } = req.body;

    // Only allow creating staff, not admin
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot create admin account. Only one admin allowed.'
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

    // Create user
    const user = await User.create({
      email,
      password_hash: passwordHash,
      role: 'staff' // Force to staff
    });

    res.status(201).json({
      success: true,
      message: 'Staff created successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Create staff error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update user (admin only - can update staff)
const updateUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params;
    const { email, password, role } = req.body;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot update admin account (except by admin themselves)
    if (user.role === 'admin' && id !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Cannot update admin account'
      });
    }

    // Cannot change role to admin
    if (role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change role to admin'
      });
    }

    // Update email if provided
    if (email && email !== user.email) {
      // Check if new email already exists
      const existingUser = await User.findOne({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'Email already exists'
        });
      }

      user.email = email;
    }

    // Update password if provided
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password_hash = await bcrypt.hash(password, salt);
    }

    // Update role (only if changing to staff)
    if (role && role === 'staff') {
      user.role = 'staff';
    }

    await user.save();

    res.json({
      success: true,
      message: 'User updated successfully',
      data: {
        id: user.id,
        email: user.email,
        role: user.role,
        created_at: user.created_at
      }
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete user (admin only - can delete staff)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Cannot delete admin
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete admin account'
      });
    }

    // Cannot delete yourself
    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete your own account'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  createStaff,
  updateUser,
  deleteUser
};

