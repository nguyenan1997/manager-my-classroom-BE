const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation rules
const classValidation = [
  body('name').notEmpty().withMessage('Class name is required'),
  body('max_students').optional().isInt({ min: 1 }).withMessage('Max students must be a positive integer'),
  body('start_date').optional().isISO8601().withMessage('Invalid date format'),
  body('end_date').optional().isISO8601().withMessage('Invalid date format'),
  body('status').optional().isIn(['active', 'completed', 'cancelled']).withMessage('Invalid status')
];

const enrollmentValidation = [
  body('student_id').isInt().withMessage('Student ID is required and must be an integer')
];

// Public routes (no auth required)
router.get('/', classController.getAllClasses);
router.get('/:id', classController.getClassById);

// Protected routes
router.post('/', authenticate, authorize('admin'), classValidation, classController.createClass);
router.put('/:id', authenticate, authorize('admin'), classValidation, classController.updateClass);
router.delete('/:id', authenticate, authorize('admin'), classController.deleteClass);
router.post('/:id/enroll', authenticate, enrollmentValidation, classController.enrollStudent);
router.post('/:id/unenroll', authenticate, enrollmentValidation, classController.unenrollStudent);

module.exports = router;

