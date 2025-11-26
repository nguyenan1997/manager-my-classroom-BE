const { Parent, User, Student } = require('../models');
const { validationResult } = require('express-validator');

// Get all parents (with permission check)
const getAllParents = async (req, res) => {
  try {
    const { role, id: userId } = req.user;

    // Build query: staff only sees parents they manage, admin sees all
    const whereClause = role === 'admin' ? {} : { created_by: userId };

    const parents = await Parent.findAll({
      where: whereClause,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'role'],
        required: true // All parents have a staff assigned
      }],
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: parents.length,
      data: parents.map(p => p.toJSON())
    });
  } catch (error) {
    console.error('Get all parents error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Create new parent
const createParent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { name, phone, email } = req.body;
    const { id: userId } = req.user; // Get user ID from authenticated request

    // Check if email already exists
    const existingParent = await Parent.findOne({ where: { email } });
    if (existingParent) {
      return res.status(400).json({
        success: false,
        message: 'Parent with this email already exists'
      });
    }

    const parent = await Parent.create({
      name,
      phone: phone || null,
      email, // Email is required
      created_by: userId
    });

    // Include creator info in response
    const parentWithCreator = await Parent.findByPk(parent.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      data: parentWithCreator.toJSON()
    });
  } catch (error) {
    console.error('Create parent error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Get parent by ID (with permission check)
const getParentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const parent = await Parent.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'role']
      }]
    });

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    // Permission check: staff can only view parents they created
    if (role === 'staff' && parent.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view parents you created.'
      });
    }

    res.json({
      success: true,
      data: parent.toJSON()
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

// Get my children (for parent)
const getMyChildren = async (req, res) => {
  try {
    const { role, parentId } = req.user;

    if (role !== 'parent') {
      return res.status(403).json({
        success: false,
        message: 'This endpoint is only for parents'
      });
    }

    const students = await Student.findAll({
      where: { parent_id: parentId },
      include: [{
        model: Parent,
        attributes: ['id', 'name', 'phone', 'email']
      }],
      order: [['created_at', 'DESC']]
    });

    const studentsData = students.map(student => {
      const data = student.toJSON();
      data.parent = data.Parent;
      delete data.Parent;
      return data;
    });

    res.json({
      success: true,
      count: studentsData.length,
      data: studentsData
    });
  } catch (error) {
    console.error('Get my children error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  getAllParents,
  createParent,
  getParentById,
  getMyChildren
};
