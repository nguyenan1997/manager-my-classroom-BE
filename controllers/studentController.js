const pool = require('../config/database');
const { validationResult } = require('express-validator');

// Get all students (for parent - only their children)
const getAllStudents = async (req, res) => {
  try {
    const userId = req.user.id;
    let query, params;

    if (req.user.role === 'admin') {
      // Admin can see all students
      query = `
        SELECT s.*, p.full_name as parent_name, p.phone as parent_phone
        FROM students s
        LEFT JOIN parents p ON s.parent_id = p.id
        ORDER BY s.created_at DESC
      `;
      params = [];
    } else {
      // Parent can only see their own children
      query = `
        SELECT s.*, p.full_name as parent_name, p.phone as parent_phone
        FROM students s
        JOIN parents p ON s.parent_id = p.id
        WHERE p.user_id = $1
        ORDER BY s.created_at DESC
      `;
      params = [userId];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get student by ID
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let query, params;

    if (req.user.role === 'admin') {
      query = `
        SELECT s.*, p.full_name as parent_name, p.phone as parent_phone, p.address as parent_address
        FROM students s
        LEFT JOIN parents p ON s.parent_id = p.id
        WHERE s.id = $1
      `;
      params = [id];
    } else {
      query = `
        SELECT s.*, p.full_name as parent_name, p.phone as parent_phone, p.address as parent_address
        FROM students s
        JOIN parents p ON s.parent_id = p.id
        WHERE s.id = $1 AND p.user_id = $2
      `;
      params = [id, userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new student
const createStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { full_name, date_of_birth, grade, school, notes } = req.body;
    const userId = req.user.id;

    // Get parent_id for the current user
    let parentId;
    if (req.user.role === 'admin' && req.body.parent_id) {
      parentId = req.body.parent_id;
    } else {
      const parentResult = await pool.query(
        'SELECT id FROM parents WHERE user_id = $1',
        [userId]
      );

      if (parentResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Parent record not found'
        });
      }
      parentId = parentResult.rows[0].id;
    }

    const result = await pool.query(
      `INSERT INTO students (parent_id, full_name, date_of_birth, grade, school, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [parentId, full_name, date_of_birth || null, grade || null, school || null, notes || null]
    );

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update student
const updateStudent = async (req, res) => {
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
    const { full_name, date_of_birth, grade, school, notes } = req.body;
    const userId = req.user.id;

    // Verify ownership (unless admin)
    if (req.user.role !== 'admin') {
      const verifyResult = await pool.query(
        `SELECT s.id FROM students s
         JOIN parents p ON s.parent_id = p.id
         WHERE s.id = $1 AND p.user_id = $2`,
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
      `UPDATE students
       SET full_name = COALESCE($1, full_name),
           date_of_birth = COALESCE($2, date_of_birth),
           grade = COALESCE($3, grade),
           school = COALESCE($4, school),
           notes = COALESCE($5, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $6
       RETURNING *`,
      [full_name, date_of_birth, grade, school, notes, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete student
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verify ownership (unless admin)
    if (req.user.role !== 'admin') {
      const verifyResult = await pool.query(
        `SELECT s.id FROM students s
         JOIN parents p ON s.parent_id = p.id
         WHERE s.id = $1 AND p.user_id = $2`,
        [id, userId]
      );

      if (verifyResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const result = await pool.query('DELETE FROM students WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    res.json({
      success: true,
      message: 'Student deleted successfully'
    });
  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};

