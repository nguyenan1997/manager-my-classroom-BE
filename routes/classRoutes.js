const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const classController = require('../controllers/classController');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');

// Validation rules
const classValidation = [
  body('name').notEmpty().withMessage('Class name is required'),
  body('max_students').optional().isInt({ min: 1 }).withMessage('Max students must be a positive integer')
];

const classUpdateValidation = [
  body('name').optional().notEmpty().withMessage('Class name cannot be empty'),
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
 *     description: |
 *       - Public: Can see all classes
 *       - Staff: Can only see classes they created
 *       - Admin: Can see all classes
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
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
router.get('/', optionalAuthenticate, classController.getClassesByDay);

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

/**
 * @swagger
 * /api/classes/{id}:
 *   put:
 *     summary: Update a class (Admin/Staff only)
 *     description: |
 *       - Admin: Can update any class
 *       - Staff: Can only update classes they created
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *                 example: 20
 *     responses:
 *       200:
 *         description: Class updated successfully
 *       403:
 *         description: Forbidden - Staff can only update classes they created
 *       404:
 *         description: Class not found
 *   delete:
 *     summary: Delete a class (Admin/Staff only)
 *     description: |
 *       - Admin: Can delete any class
 *       - Staff: Can only delete classes they created
 *       - Cannot delete if there are registered students
 *     tags: [Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Class ID
 *     responses:
 *       200:
 *         description: Class deleted successfully
 *       400:
 *         description: Cannot delete - has registered students
 *       403:
 *         description: Forbidden - Staff can only delete classes they created
 *       404:
 *         description: Class not found
 */
router.put('/:id', authenticate, authorize('admin', 'staff'), classUpdateValidation, classController.updateClass);
router.delete('/:id', authenticate, authorize('admin', 'staff'), classController.deleteClass);

module.exports = router;
