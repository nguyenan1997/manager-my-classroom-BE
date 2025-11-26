const pool = require('../config/database');
const { validationResult } = require('express-validator');

// Get all subscriptions
const getAllSubscriptions = async (req, res) => {
  try {
    const userId = req.user.id;
    let query, params;

    if (req.user.role === 'admin') {
      query = `
        SELECT s.*, 
               st.full_name as student_name,
               c.name as class_name,
               c.subject,
               c.grade_level
        FROM subscriptions s
        JOIN students st ON s.student_id = st.id
        JOIN classes c ON s.class_id = c.id
        ORDER BY s.created_at DESC
      `;
      params = [];
    } else {
      query = `
        SELECT s.*, 
               st.full_name as student_name,
               c.name as class_name,
               c.subject,
               c.grade_level
        FROM subscriptions s
        JOIN students st ON s.student_id = st.id
        JOIN parents p ON st.parent_id = p.id
        JOIN classes c ON s.class_id = c.id
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
    console.error('Get subscriptions error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    let query, params;

    if (req.user.role === 'admin') {
      query = `
        SELECT s.*, 
               st.full_name as student_name,
               st.grade as student_grade,
               c.name as class_name,
               c.subject,
               c.grade_level,
               c.schedule_time,
               c.schedule_days
        FROM subscriptions s
        JOIN students st ON s.student_id = st.id
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = $1
      `;
      params = [id];
    } else {
      query = `
        SELECT s.*, 
               st.full_name as student_name,
               st.grade as student_grade,
               c.name as class_name,
               c.subject,
               c.grade_level,
               c.schedule_time,
               c.schedule_days
        FROM subscriptions s
        JOIN students st ON s.student_id = st.id
        JOIN parents p ON st.parent_id = p.id
        JOIN classes c ON s.class_id = c.id
        WHERE s.id = $1 AND p.user_id = $2
      `;
      params = [id, userId];
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new subscription
const createSubscription = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { student_id, class_id, total_sessions, start_date, end_date } = req.body;
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

    // Check if class exists
    const classResult = await pool.query('SELECT * FROM classes WHERE id = $1', [class_id]);
    if (classResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if subscription already exists
    const existingSubscription = await pool.query(
      'SELECT * FROM subscriptions WHERE student_id = $1 AND class_id = $2 AND status = $3',
      [student_id, class_id, 'active']
    );

    if (existingSubscription.rows.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Active subscription already exists for this student and class'
      });
    }

    const result = await pool.query(
      `INSERT INTO subscriptions (student_id, class_id, total_sessions, used_sessions, start_date, end_date, status)
       VALUES ($1, $2, $3, 0, $4, $5, 'active')
       RETURNING *`,
      [
        student_id,
        class_id,
        total_sessions,
        start_date || new Date().toISOString().split('T')[0],
        end_date || null
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Create subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update subscription (use session)
const useSession = async (req, res) => {
  try {
    const { id } = req.params;
    const { sessions_to_use = 1 } = req.body;
    const userId = req.user.id;

    // Get subscription
    let query, params;

    if (req.user.role === 'admin') {
      query = 'SELECT * FROM subscriptions WHERE id = $1';
      params = [id];
    } else {
      query = `
        SELECT s.* FROM subscriptions s
        JOIN students st ON s.student_id = st.id
        JOIN parents p ON st.parent_id = p.id
        WHERE s.id = $1 AND p.user_id = $2
      `;
      params = [id, userId];
    }

    const subscriptionResult = await pool.query(query, params);

    if (subscriptionResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subscription = subscriptionResult.rows[0];

    if (subscription.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Subscription is not active'
      });
    }

    const newUsedSessions = subscription.used_sessions + sessions_to_use;

    if (newUsedSessions > subscription.total_sessions) {
      return res.status(400).json({
        success: false,
        message: 'Cannot use more sessions than available'
      });
    }

    // Update subscription
    const result = await pool.query(
      `UPDATE subscriptions
       SET used_sessions = $1,
           status = CASE 
             WHEN $1 >= total_sessions THEN 'expired'
             ELSE status
           END,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [newUsedSessions, id]
    );

    res.json({
      success: true,
      message: 'Session used successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Use session error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Update subscription
const updateSubscription = async (req, res) => {
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
    const { total_sessions, start_date, end_date, status } = req.body;

    // Only admin can update subscription details
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin only'
      });
    }

    const result = await pool.query(
      `UPDATE subscriptions
       SET total_sessions = COALESCE($1, total_sessions),
           start_date = COALESCE($2, start_date),
           end_date = COALESCE($3, end_date),
           status = COALESCE($4, status),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $5
       RETURNING *`,
      [total_sessions, start_date, end_date, status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Update subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get subscriptions by student
const getSubscriptionsByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
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
      `SELECT s.*, 
              c.name as class_name,
              c.subject,
              c.grade_level
       FROM subscriptions s
       JOIN classes c ON s.class_id = c.id
       WHERE s.student_id = $1
       ORDER BY s.created_at DESC`,
      [student_id]
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows
    });
  } catch (error) {
    console.error('Get subscriptions by student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllSubscriptions,
  getSubscriptionById,
  createSubscription,
  useSession,
  updateSubscription,
  getSubscriptionsByStudent
};

