const { Class, ClassRegistration, Student, User, Parent } = require('../models');
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
    const { id: userId } = req.user; // Get user ID from authenticated request

    const classItem = await Class.create({
      name,
      subject: subject || null,
      day_of_week: day_of_week || null,
      time_slot: time_slot || null,
      teacher_name: teacher_name || null,
      max_students: max_students || 20,
      created_by: userId
    });

    // Include creator info in response
    const classWithCreator = await Class.findByPk(classItem.id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'role']
      }]
    });

    res.status(201).json({
      success: true,
      message: 'Class created successfully',
      data: classWithCreator.toJSON()
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

// Get classes by day of week (with permission check if authenticated)
const getClassesByDay = async (req, res) => {
  try {
    const { day } = req.query;
    const whereCondition = {};

    if (day) {
      whereCondition.day_of_week = day;
    }

    // Check if user is authenticated (admin/staff)
    const user = req.user;
    if (user && (user.role === 'admin' || user.role === 'staff')) {
      // Staff only sees classes they created, admin sees all
      if (user.role === 'staff') {
        whereCondition.created_by = user.id;
      }
    }
    // If not authenticated or parent, see all classes (public view)

    const classes = await Class.findAll({
      where: whereCondition,
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'role'],
        required: true
      }],
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
    const { name, subject, day_of_week, time_slot, teacher_name, max_students } = req.body;
    const { role, id: userId } = req.user;

    const classItem = await Class.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'role']
      }]
    });

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Permission check: staff can only update classes they created
    if (role === 'staff' && classItem.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update classes you created.'
      });
    }

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (subject !== undefined) updateData.subject = subject;
    if (day_of_week !== undefined) updateData.day_of_week = day_of_week;
    if (time_slot !== undefined) updateData.time_slot = time_slot;
    if (teacher_name !== undefined) updateData.teacher_name = teacher_name;
    if (max_students !== undefined) updateData.max_students = max_students;

    await classItem.update(updateData);

    // Refresh to get updated data with creator
    const updatedClass = await Class.findByPk(id, {
      include: [{
        model: User,
        as: 'creator',
        attributes: ['id', 'email', 'role']
      }]
    });

    res.json({
      success: true,
      message: 'Class updated successfully',
      data: updatedClass.toJSON()
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
    const { role, id: userId } = req.user;

    const classItem = await Class.findByPk(id);

    if (!classItem) {
      return res.status(404).json({
        success: false,
        message: 'Class not found'
      });
    }

    // Permission check: staff can only delete classes they created
    if (role === 'staff' && classItem.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete classes you created.'
      });
    }

    // Check if there are registered students
    const registrationCount = await ClassRegistration.count({
      where: { class_id: id }
    });

    if (registrationCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete class. There are ${registrationCount} student(s) registered in this class. Please remove all registrations first.`
      });
    }

    await classItem.destroy();

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

// Get classes for a student (parent can see classes their children are registered in)
const getStudentClasses = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { role, id: userId, parentId } = req.user || {};

    // Verify student exists
    const student = await Student.findByPk(student_id, {
      include: [{
        model: Parent,
        attributes: ['id', 'name', 'email']
      }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Permission check: parent can only see classes for their own children
    if (role === 'parent' && student.parent_id !== parentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only view classes for your own children.'
      });
    }

    // Get all classes the student is registered in
    const registrations = await ClassRegistration.findAll({
      where: { student_id },
      include: [{
        model: Class,
        include: [{
          model: User,
          as: 'creator',
          attributes: ['id', 'email', 'role']
        }]
      }],
      order: [['created_at', 'DESC']]
    });

    const classes = registrations.map(reg => {
      const classData = reg.Class.toJSON();
      return {
        ...classData,
        registration_id: reg.id,
        registered_at: reg.created_at
      };
    });

    res.json({
      success: true,
      count: classes.length,
      student: {
        id: student.id,
        name: student.name,
        parent: student.Parent
      },
      data: classes
    });
  } catch (error) {
    console.error('Get student classes error:', error);
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
  registerStudent,
  updateClass,
  deleteClass,
  getStudentClasses
};
