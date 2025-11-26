const { Parent } = require('../models');
const { validationResult } = require('express-validator');

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

    const parent = await Parent.create({
      name,
      phone: phone || null,
      email: email || null
    });

    res.status(201).json({
      success: true,
      message: 'Parent created successfully',
      data: parent.toJSON()
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

// Get parent by ID
const getParentById = async (req, res) => {
  try {
    const { id } = req.params;

    const parent = await Parent.findByPk(id);

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: 'Parent not found'
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

module.exports = {
  createParent,
  getParentById
};
