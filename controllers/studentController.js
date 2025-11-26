const { Student, Parent } = require('../models');
const { validationResult } = require('express-validator');

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

    const { name, dob, gender, current_grade, parent_id } = req.body;

    // Verify parent exists
    const parent = await Parent.findByPk(parent_id);
    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
      });
    }

    const student = await Student.create({
      name,
      dob: dob || null,
      gender: gender || null,
      current_grade: current_grade || null,
      parent_id
    });

    res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: student.toJSON()
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

// Get student by ID with parent info
const getStudentById = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, parentId } = req.user || {};

    const student = await Student.findByPk(id, {
      include: [{
        model: Parent,
        attributes: ['id', 'name', 'phone', 'email']
      }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Permission check: parent can only view their own children
    if (role === 'parent' && student.parent_id !== parentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view your own children.'
      });
    }

    const studentData = student.toJSON();
    studentData.parent = studentData.Parent;
    delete studentData.Parent;

    res.json({
      success: true,
      data: studentData
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

// Get all students for a parent (parent can only see their own children)
const getMyStudents = async (req, res) => {
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
    console.error('Get my students error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createStudent,
  getStudentById,
  getMyStudents
};
