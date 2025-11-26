const pool = require('../config/database');
const { validationResult } = require('express-validator');

// Get all classes
const getAllClasses = async (req, res) => {
  try {
    const { status, grade_level, subject } = req.query;
    let query = `
      SELECT c.*,
             (SELECT COUNT(*) FROM class_enrollments WHERE class_id = c.id AND status = 'active') as enrolled_count
      FROM classes c
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (status) {
      query += ` AND c.status = $${paramCount}`;
      params.push(status);
      paramCount++;
    }

    if (grade_level) {
      query += ` AND c.grade_level = $${paramCount}`;
      params.push(grade_level);
      paramCount++;
    }

    if (subject) {
      query += ` AND c.subject = $${paramCount}`;
      params.push(subject);
      paramCount++;
    }

    query += ' ORDER BY c.created_at DESC';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get class by ID
const getClassById = async (req, res) => {
  try {
    const { id } = req.params;

    const classResult = await pool.query(
      'SELECT * FROM classes WHERE id = $1',
      [id]
    );

    if (classResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Get enrolled students
    const enrollmentsResult = await pool.query(
      `SELECT ce.*, s.full_name as student_name, s.grade
       FROM class_enrollments ce
       JOIN students s ON ce.student_id = s.id
       WHERE ce.class_id = $1
       ORDER BY ce.enrolled_at DESC`,
      [id]
    );

    res.json({
      success: true,
      data: {
        ...classResult.rows[0],
        enrollments: enrollmentsResult.rows
      }
    });
  } catch (error) {
    console.error('Get class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new class
const createClass = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      description,
      subject,
      grade_level,
      max_students,
      start_date,
      end_date,
      schedule_time,
      schedule_days,
      status
    } = req.body;

    const result = await pool.query(
      `INSERT INTO classes (name, description, subject, grade_level, max_students, 
                            start_date, end_date, schedule_time, schedule_days, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [
        name,
        description || null,
        subject || null,
        grade_level || null,
        max_students || 20,
        start_date || null,
        end_date || null,
        schedule_time || null,
        schedule_days || null,
        status || 'active'
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update class
const updateClass = async (req, res) => {
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
    const {
      name,
      description,
      subject,
      grade_level,
      max_students,
      start_date,
      end_date,
      schedule_time,
      schedule_days,
      status
    } = req.body;

    const result = await pool.query(
      `UPDATE classes
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           subject = COALESCE($3, subject),
           grade_level = COALESCE($4, grade_level),
           max_students = COALESCE($5, max_students),
           start_date = COALESCE($6, start_date),
           end_date = COALESCE($7, end_date),
           schedule_time = COALESCE($8, schedule_time),
           schedule_days = COALESCE($9, schedule_days),
           status = COALESCE($10, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $11
       RETURNING *`,
      [
        name,
        description,
        subject,
        grade_level,
        max_students,
        start_date,
        end_date,
        schedule_time,
        schedule_days,
        status,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Delete class
const deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM classes WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    res.json({
      success: true,
      message: 'Class deleted successfully'
    });
  } catch (error) {
    console.error('Delete class error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Enroll student in class
const enrollStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { id } = req.params; // class_id
    const { student_id } = req.body;
    const userId = req.user.id;

    // Verify student belongs to parent (unless admin)
    if (req.user.role !== 'admin') {
      const verifyResult = await pool.query(
        `SELECT s.id FROM students s
         JOIN parents p ON s.parent_id = p.id
         WHERE s.id = $1 AND p.user_id = $2`,
        [student_id, userId]
      );

      if (verifyResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Student not found or not yours'
        });
      }
    }

    // Check if class exists and has space
    const classResult = await pool.query('SELECT * FROM classes WHERE id = $1', [id]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    const classData = classResult.rows[0];
    if (classData.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Class is not active'
      });
    }

    // Check enrollment count
    const enrollmentCount = await pool.query(
      "SELECT COUNT(*) FROM class_enrollments WHERE class_id = $1 AND status = 'active'",
      [id]
    );

    if (parseInt(enrollmentCount.rows[0].count) >= classData.max_students) {
      return res.status(400).json({
        success: false,
        message: 'Class is full'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await pool.query(
      'SELECT * FROM class_enrollments WHERE student_id = $1 AND class_id = $2',
      [student_id, id]
    );

    if (existingEnrollment.rows.length > 0) {
      // Update existing enrollment to active
      const updateResult = await pool.query(
        `UPDATE class_enrollments
         SET status = 'active', enrolled_at = CURRENT_TIMESTAMP
         WHERE student_id = $1 AND class_id = $2
         RETURNING *`,
        [student_id, id]
      );

      return res.json({
        success: true,
        message: 'Student re-enrolled successfully',
        data: updateResult.rows[0]
      });
    }

    // Create new enrollment
    const result = await pool.query(
      `INSERT INTO class_enrollments (student_id, class_id, status)
       VALUES ($1, $2, 'active')
       RETURNING *`,
      [student_id, id]
    );

    res.status(201).json({
      success: true,
      message: 'Student enrolled successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Enroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Unenroll student from class
const unenrollStudent = async (req, res) => {
  try {
    const { id } = req.params; // class_id
    const { student_id } = req.body;
    const userId = req.user.id;

    // Verify student belongs to parent (unless admin)
    if (req.user.role !== 'admin') {
      const verifyResult = await pool.query(
        `SELECT s.id FROM students s
         JOIN parents p ON s.parent_id = p.id
         WHERE s.id = $1 AND p.user_id = $2`,
        [student_id, userId]
      );

      if (verifyResult.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }
    }

    const result = await pool.query(
      `UPDATE class_enrollments
       SET status = 'dropped'
       WHERE student_id = $1 AND class_id = $2
       RETURNING *`,
      [student_id, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    res.json({
      success: true,
      message: 'Student unenrolled successfully'
    });
  } catch (error) {
    console.error('Unenroll student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllClasses,
  getClassById,
  createClass,
  updateClass,
  deleteClass,
  enrollStudent,
  unenrollStudent
};

