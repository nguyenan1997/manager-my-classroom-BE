const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');

// Validation rules
const studentValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('parent_id').isInt().withMessage('Parent ID is required and must be an integer'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')
];

/**
 * @swagger
 * /api/students:
 *   post:
 *     summary: Create a new student
 *     tags: [Students]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - parent_id
 *             properties:
 *               name:
 *                 type: string
 *                 example: Nguyễn Văn B
 *               parent_id:
 *                 type: integer
 *                 example: 1
 *               dob:
 *                 type: string
 *                 format: date
 *                 example: "2010-05-15"
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *               current_grade:
 *                 type: string
 *                 example: "5"
 *     responses:
 *       201:
 *         description: Student created successfully
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
 *                   example: Student created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Student'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Parent not found
 */
router.post('/', studentValidation, studentController.createStudent);

/**
 * @swagger
 * /api/students/{id}:
 *   get:
 *     summary: Get student by ID with parent information
 *     tags: [Students]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Student ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Student retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: Nguyễn Văn B
 *                     dob:
 *                       type: string
 *                       format: date
 *                     gender:
 *                       type: string
 *                     current_grade:
 *                       type: string
 *                     parent_id:
 *                       type: integer
 *                     parent:
 *                       $ref: '#/components/schemas/Parent'
 *       404:
 *         description: Student not found
 */
router.get('/:id', studentController.getStudentById);

module.exports = router;
