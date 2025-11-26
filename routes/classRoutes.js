const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/classController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation rules
const classValidation = [
  body('name').notEmpty().withMessage('Class name is required'),
  body('max_students').optional().isInt({ min: 1 }).withMessage('Max students must be a positive integer')
];

const registrationValidation = [
  body('student_id').isUUID().withMessage('Student ID is required and must be a valid UUID')
];

/**
 * @swagger
 * /api/classes:
 *   post:
 *     summary: Create a new class (Admin/Staff only)
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: Lớp Toán 5
 *               subject:
 *                 type: string
 *                 example: Toán
 *               day_of_week:
 *                 type: string
 *                 example: Monday
 *               time_slot:
 *                 type: string
 *                 example: "18:00-19:30"
 *               teacher_name:
 *                 type: string
 *                 example: Cô Lan
 *               max_students:
 *                 type: integer
 *                 default: 20
 *                 example: 20
 *     responses:
 *       201:
 *         description: Class created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Class created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Class'
 *       400:
 *         description: Validation error
 */
router.post('/', authenticate, authorize('admin', 'staff'), classValidation, classController.createClass);

/**
 * @swagger
 * /api/classes:
 *   get:
 *     summary: Get list of classes, optionally filtered by day of week
 *     tags: [Classes]
 *     parameters:
 *       - in: query
 *         name: day
 *         schema:
 *           type: string
 *         description: Filter classes by day of week (e.g., Monday, Tuesday)
 *         example: Monday
 *     responses:
 *       200:
 *         description: List of classes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 5
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 */
router.get('/', classController.getClassesByDay);

/**
 * @swagger
 * /api/classes/{class_id}/register:
 *   post:
 *     summary: Register a student to a class
 *     description: |
 *       Register a student to a class. The system will check:
 *       - If student is already registered in this class
 *       - If student has schedule conflict (same day_of_week and time_slot)
 *       - If class is full (max_students reached)
 *     tags: [Classes]
 *     parameters:
 *       - in: path
 *         name: class_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *             properties:
 *               student_id:
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       201:
 *         description: Student registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Student registered successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     class_id:
 *                       type: string
 *                       format: uuid
 *                     student_id:
 *                       type: string
 *                       format: uuid
 *       400:
 *         description: |
 *           Bad request - Possible reasons:
 *           - Student already registered in this class
 *           - Student has schedule conflict
 *           - Class is full
 *       404:
 *         description: Class or student not found
 */
router.post('/:class_id/register', registrationValidation, classController.registerStudent);

module.exports = router;
