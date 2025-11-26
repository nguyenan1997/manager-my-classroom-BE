const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const studentValidation = [
  body('full_name').notEmpty().withMessage('Full name is required'),
  body('date_of_birth').optional().isISO8601().withMessage('Invalid date format'),
  body('parent_id').optional().isInt().withMessage('Parent ID must be an integer')
];

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', studentController.getAllStudents);
router.get('/:id', studentController.getStudentById);
router.post('/', studentValidation, studentController.createStudent);
router.put('/:id', studentValidation, studentController.updateStudent);
router.delete('/:id', studentController.deleteStudent);

module.exports = router;

