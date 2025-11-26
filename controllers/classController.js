const { Class, ClassRegistration, Student } = require('../models');
const { validationResult } = require('express-validator');
const { Op } = require('sequelize');

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

    const { name, subject, day_of_week, time_slot, teacher_name, max_students } = req.body;

    const classItem = await Class.create({
      name,
      subject: subject || null,
      day_of_week: day_of_week || null,
      time_slot: time_slot || null,
      teacher_name: teacher_name || null,
      max_students: max_students || 20
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classItem.toJSON()
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

// Get classes by day of week
const getClassesByDay = async (req, res) => {
  try {
    const { day } = req.query;
    const whereCondition = {};

    if (day) {
      whereCondition.day_of_week = day;
    }

    const classes = await Class.findAll({
      where: whereCondition,
      order: [['created_at', 'DESC']]
    });

    res.json({
      success: true,
      count: classes.length,
      data: classes.map(c => c.toJSON())
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

// Register student to class
const registerStudent = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { class_id } = req.params;
    const { student_id } = req.body;

    // Check if class exists
    const classItem = await Class.findByPk(class_id);
    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Check if student exists
    const student = await Student.findByPk(student_id);
    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Check if already registered
    const existingRegistration = await ClassRegistration.findOne({
      where: {
        student_id,
        class_id
      }
    });

    if (existingRegistration) {
      return res.status(400).json({
        success: false,
        message: 'Student is already registered in this class'
      });
    }

    // Check for schedule conflict (same day_of_week and time_slot)
    if (classItem.day_of_week && classItem.time_slot) {
      // Get all classes the student is registered in with same day and time
      const conflictingRegistrations = await ClassRegistration.findAll({
        where: { student_id },
        include: [{
          model: Class,
          where: {
            day_of_week: classItem.day_of_week,
            time_slot: classItem.time_slot,
            id: { [Op.ne]: class_id }
          },
          attributes: ['id', 'day_of_week', 'time_slot']
        }]
      });

      if (conflictingRegistrations.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Student already has a class at this time slot'
        });
      }
    }

    // Check if class is full
    const enrollmentCount = await ClassRegistration.count({
      where: { class_id }
    });

    if (enrollmentCount >= classItem.max_students) {
      return res.status(400).json({
        success: false,
        message: 'Class is full'
      });
    }

    // Register student
    const registration = await ClassRegistration.create({
      student_id,
      class_id
    });

    res.status(201).json({
      success: true,
      message: 'Student registered successfully',
      data: registration.toJSON()
    });
  } catch (error) {
    console.error('Register student error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

module.exports = {
  createClass,
  getClassesByDay,
  registerStudent
};
