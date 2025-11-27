const { Student, Parent, Subscription, ClassRegistration } = require('../models');
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
    const { name, dob, gender, current_grade, parent_id } = req.body;
    const { role, id: userId, parentId } = req.user || {};

    const student = await Student.findByPk(id, {
      include: [{
        model: Parent,
        attributes: ['id', 'name', 'email', 'created_by']
      }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Permission checks
    if (role === 'parent' && student.parent_id !== parentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update your own children.'
      });
    }

    if (role === 'staff' && student.Parent && student.Parent.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only update students whose parents you manage.'
      });
    }

    // If parent_id is being changed, verify new parent exists
    if (parent_id && parent_id !== student.parent_id) {
      const newParent = await Parent.findByPk(parent_id);
      if (!newParent) {
        return res.status(404).json({
          success: false,
          message: 'New parent not found'
        });
      }

      // Staff can only reassign to parents they manage
      if (role === 'staff' && newParent.created_by !== userId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only reassign students to parents you manage.'
        });
      }
    }

    // Update only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (dob !== undefined) updateData.dob = dob;
    if (gender !== undefined) updateData.gender = gender;
    if (current_grade !== undefined) updateData.current_grade = current_grade;
    if (parent_id !== undefined) updateData.parent_id = parent_id;

    await student.update(updateData);

    // Refresh to get updated data
    const updatedStudent = await Student.findByPk(id, {
      include: [{
        model: Parent,
        attributes: ['id', 'name', 'phone', 'email']
      }]
    });

    const studentData = updatedStudent.toJSON();
    studentData.parent = studentData.Parent;
    delete studentData.Parent;

    res.json({
      success: true,
      message: 'Student updated successfully',
      data: studentData
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
    const { role, id: userId, parentId } = req.user || {};

    const student = await Student.findByPk(id, {
      include: [{
        model: Parent,
        attributes: ['id', 'name', 'email', 'created_by']
      }]
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found'
      });
    }

    // Permission checks
    if (role === 'parent' && student.parent_id !== parentId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete your own children.'
      });
    }

    if (role === 'staff' && student.Parent && student.Parent.created_by !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied. You can only delete students whose parents you manage.'
      });
    }

    // Check if student has subscriptions or class registrations
    const subscriptionCount = await Subscription.count({
      where: { student_id: id }
    });

    const registrationCount = await ClassRegistration.count({
      where: { student_id: id }
    });

    if (subscriptionCount > 0 || registrationCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete student. Student has ${subscriptionCount} subscription(s) and ${registrationCount} class registration(s). Please remove them first.`
      });
    }

    await student.destroy();

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
  createStudent,
  getStudentById,
  getMyStudents,
  updateStudent,
  deleteStudent
};
