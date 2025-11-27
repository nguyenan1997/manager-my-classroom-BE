const { Subscription, Student } = require('../models');
const { validationResult } = require('express-validator');

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

    const { student_id, package_name, start_date, end_date, total_sessions } = req.body;

    // Verify student exists
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    const subscription = await Subscription.create({
      student_id,
      package_name,
      start_date: start_date || new Date().toISOString().split('T')[0],
      end_date: end_date || null,
      total_sessions: total_sessions || 0,
      used_sessions: 0
    });

    const subData = subscription.toJSON();
    subData.remaining_sessions = subscription.remaining_sessions;

    res.status(201).json({
      success: true,
      message: 'Subscription created successfully',
      data: subData
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

// Use a session (mark as used)
const useSession = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Check if there are remaining sessions
    if (subscription.used_sessions >= subscription.total_sessions) {
      return res.status(400).json({
        success: false,
        message: 'No remaining sessions available'
      });
    }

    // Increment used_sessions
    await subscription.update({
      used_sessions: subscription.used_sessions + 1
    });

    const subData = subscription.toJSON();
    subData.remaining_sessions = subscription.remaining_sessions;

    res.json({
      success: true,
      message: 'Session marked as used',
      data: subData
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

// Get subscription by ID
const getSubscriptionById = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id, {
      include: [{
        model: Student,
        attributes: ['id', 'name', 'current_grade']
      }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    const subData = subscription.toJSON();
    subData.remaining_sessions = subscription.remaining_sessions;
    subData.student = subData.Student;
    delete subData.Student;

    res.json({
      success: true,
      data: subData
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
    const { package_name, start_date, end_date, total_sessions, used_sessions } = req.body;

    const subscription = await Subscription.findByPk(id, {
      include: [{
        model: Student,
        attributes: ['id', 'name']
      }]
    });

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    // Validate used_sessions doesn't exceed total_sessions
    const newTotalSessions = total_sessions !== undefined ? total_sessions : subscription.total_sessions;
    const newUsedSessions = used_sessions !== undefined ? used_sessions : subscription.used_sessions;

    if (newUsedSessions > newTotalSessions) {
      return res.status(400).json({
        success: false,
        message: 'Used sessions cannot exceed total sessions'
      });
    }

    // Update only provided fields
    const updateData = {};
    if (package_name !== undefined) updateData.package_name = package_name;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (end_date !== undefined) updateData.end_date = end_date;
    if (total_sessions !== undefined) updateData.total_sessions = total_sessions;
    if (used_sessions !== undefined) updateData.used_sessions = used_sessions;

    await subscription.update(updateData);

    // Refresh to get updated data
    const updatedSubscription = await Subscription.findByPk(id, {
      include: [{
        model: Student,
        attributes: ['id', 'name', 'current_grade']
      }]
    });

    const subData = updatedSubscription.toJSON();
    subData.remaining_sessions = updatedSubscription.remaining_sessions;
    subData.student = subData.Student;
    delete subData.Student;

    res.json({
      success: true,
      message: 'Subscription updated successfully',
      data: subData
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

// Delete subscription
const deleteSubscription = async (req, res) => {
  try {
    const { id } = req.params;

    const subscription = await Subscription.findByPk(id);

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Subscription not found'
      });
    }

    await subscription.destroy();

    res.json({
      success: true,
      message: 'Subscription deleted successfully'
    });
  } catch (error) {
    console.error('Delete subscription error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createSubscription,
  useSession,
  getSubscriptionById,
  updateSubscription,
  deleteSubscription
};
