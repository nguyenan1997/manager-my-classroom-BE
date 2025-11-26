const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation rules
const subscriptionValidation = [
  body('student_id').isInt().withMessage('Student ID is required and must be an integer'),
  body('class_id').isInt().withMessage('Class ID is required and must be an integer'),
  body('total_sessions').isInt({ min: 1 }).withMessage('Total sessions must be a positive integer'),
  body('start_date').optional().isISO8601().withMessage('Invalid date format'),
  body('end_date').optional().isISO8601().withMessage('Invalid date format')
];

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', subscriptionController.getAllSubscriptions);
router.get('/student/:student_id', subscriptionController.getSubscriptionsByStudent);
router.get('/:id', subscriptionController.getSubscriptionById);
router.post('/', subscriptionValidation, subscriptionController.createSubscription);
router.put('/:id', authenticate, authorize('admin'), subscriptionController.updateSubscription);
router.post('/:id/use-session', body('sessions_to_use').optional().isInt({ min: 1 }), subscriptionController.useSession);

module.exports = router;

