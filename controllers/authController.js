const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { validationResult } = require('express-validator');

// Register new user
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

    const { email, password, role = 'parent', full_name, phone, address } = req.body;

    // Check if user already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'User with this email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Create user
      const userResult = await client.query(
        'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING id, email, role',
        [email, passwordHash, role]
      );

      const userId = userResult.rows[0].id;

      // If role is parent, create parent record
      let parentId = null;
      if (role === 'parent') {
        const parentResult = await client.query(
          'INSERT INTO parents (user_id, full_name, phone, address) VALUES ($1, $2, $3, $4) RETURNING id',
          [userId, full_name, phone || null, address || null]
        );
        parentId = parentResult.rows[0].id;
      }

      await client.query('COMMIT');

      // Generate JWT token
      const token = jwt.sign(
        { userId: userId, role: role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: {
          user: userResult.rows[0],
          parentId: parentId,
          token
        }
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
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
    const userResult = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const user = userResult.rows[0];

    // Verify password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Get parent info if role is parent
    let parentInfo = null;
    if (user.role === 'parent') {
      const parentResult = await pool.query(
        'SELECT id, full_name, phone, address FROM parents WHERE user_id = $1',
        [user.id]
      );
      if (parentResult.rows.length > 0) {
        parentInfo = parentResult.rows[0];
      }
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
        parent: parentInfo,
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

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const userResult = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    let parentInfo = null;
    if (req.user.role === 'parent') {
      const parentResult = await pool.query(
        'SELECT id, full_name, phone, address FROM parents WHERE user_id = $1',
        [userId]
      );
      if (parentResult.rows.length > 0) {
        parentInfo = parentResult.rows[0];
      }
    }

    res.json({
      success: true,
      data: {
        user: userResult.rows[0],
        parent: parentInfo
      }
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

module.exports = {
  register,
  login,
  getProfile
};

