const pool = require('../config/database');
const { validationResult } = require('express-validator');

// Get all parents (admin only)
const getAllParents = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only'
      });
    }

    const result = await pool.query(
      `SELECT p.*, u.email, u.created_at as user_created_at,
              (SELECT COUNT(*) FROM students WHERE parent_id = p.id) as student_count
       FROM parents p
       JOIN users u ON p.user_id = u.id
       ORDER BY p.created_at DESC`
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get parents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get parent by ID
const getParentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let query, params;

    if (req.user.role === 'admin') {
      query = `
        SELECT p.*, u.email, u.created_at as user_created_at
        FROM parents p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;
      params = [id];
    } else {
      query = `
        SELECT p.*, u.email, u.created_at as user_created_at
        FROM parents p
        JOIN users u ON p.user_id = u.id
        WHERE p.id = $1 AND p.user_id = $2
      `;
      params = [id, userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Get students for this parent
    const studentsResult = await pool.query(
      'SELECT * FROM students WHERE parent_id = $1 ORDER BY created_at DESC',
      [id]
    );

    res.json({
      success: true,
      data: {
        ...result.rows[0],
        students: studentsResult.rows
      }
    });
  } catch (error) {
    console.error('Get parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update parent
const updateParent = async (req, res) => {
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
    const { full_name, phone, address } = req.body;
    const userId = req.user.id;

    // Verify ownership (unless admin)
    if (req.user.role !== 'admin') {
      const verifyResult = await pool.query(
        'SELECT id FROM parents WHERE id = $1 AND user_id = $2',
        [id, userId]
      );

      if (verifyResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const result = await pool.query(
      `UPDATE parents
       SET full_name = COALESCE($1, full_name),
           phone = COALESCE($2, phone),
           address = COALESCE($3, address),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $4
       RETURNING *`,
      [full_name, phone, address, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    res.json({
      success: true,
      message: 'Parent updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllParents,
  getParentById,
  updateParent
};

