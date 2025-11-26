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

module.exports = {
  createStudent,
  getStudentById
};
