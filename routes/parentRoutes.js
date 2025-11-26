const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const parentController = require('../controllers/parentController');
const { authenticate } = require('../middleware/auth');

// Validation rules
const parentValidation = [
  body('full_name').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
];

// All routes require authentication
router.use(authenticate);

// Routes
router.get('/', parentController.getAllParents);
router.get('/:id', parentController.getParentById);
router.put('/:id', parentValidation, parentController.updateParent);

module.exports = router;

