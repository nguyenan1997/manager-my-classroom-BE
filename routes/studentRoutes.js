const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation rules
const studentValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('parent_id').isUUID().withMessage('Parent ID is required and must be a valid UUID'),
  body('dob').optional().isISO8601().withMessage('Invalid date format'),
  body('gender').optional().isIn(['male', 'female', 'other']).withMessage('Invalid gender')
];

const studentUpdateValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('parent_id').optional().isUUID().withMessage('Parent ID must be a valid UUID'),
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
 *                 type: string
 *                 format: uuid
 *                 example: "550e8400-e29b-41d4-a716-446655440000"
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
 *           type: string
 *           format: uuid
 *         description: Student ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
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
 *                       type: string
 *                       format: uuid
 *                       example: "550e8400-e29b-41d4-a716-446655440000"
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
 *                       type: string
 *                       format: uuid
 *                     parent:
 *                       $ref: '#/components/schemas/Parent'
 *       404:
 *         description: Student not found
 */
/**
 * @swagger
 * /api/students/my-children:
 *   get:
 *     summary: Get all children for logged-in parent (Parent only)
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of children retrieved successfully
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
 *                   example: 2
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                         format: uuid
 *                       name:
 *                         type: string
 *                       dob:
 *                         type: string
 *                         format: date
 *                       gender:
 *                         type: string
 *                       current_grade:
 *                         type: string
 *                       parent_id:
 *                         type: string
 *                         format: uuid
 *                       parent:
 *                         $ref: '#/components/schemas/Parent'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Not a parent account
 */
router.get('/my-children', authenticate, authorize('parent'), studentController.getMyStudents);

/**
 * @swagger
 * /api/students/{id}:
 *   put:
 *     summary: Update a student (Admin/Staff/Parent)
 *     description: |
 *       - Admin: Can update any student
 *       - Staff: Can only update students whose parents they manage
 *       - Parent: Can only update their own children
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               dob:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *               current_grade:
 *                 type: string
 *               parent_id:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Student updated successfully
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Student not found
 *   delete:
 *     summary: Delete a student (Admin/Staff/Parent)
 *     description: |
 *       - Admin: Can delete any student
 *       - Staff: Can only delete students whose parents they manage
 *       - Parent: Can only delete their own children
 *       - Cannot delete if student has subscriptions or class registrations
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student ID
 *     responses:
 *       200:
 *         description: Student deleted successfully
 *       400:
 *         description: Cannot delete - has subscriptions or registrations
 *       403:
 *         description: Forbidden - Insufficient permissions
 *       404:
 *         description: Student not found
 */
router.get('/:id', authenticate, studentController.getStudentById);
router.put('/:id', authenticate, authorize('admin', 'staff', 'parent'), studentUpdateValidation, studentController.updateStudent);
router.delete('/:id', authenticate, authorize('admin', 'staff', 'parent'), studentController.deleteStudent);

/**
 * @swagger
 * /api/students/{student_id}/classes:
 *   get:
 *     summary: Get all classes a student is registered in
 *     description: |
 *       - Parent: Can only see classes for their own children
 *       - Admin/Staff: Can see classes for any student
 *     tags: [Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: student_id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Student ID
 *     responses:
 *       200:
 *         description: List of classes retrieved successfully
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
 *                   example: 3
 *                 student:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       format: uuid
 *                     name:
 *                       type: string
 *                     parent:
 *                       $ref: '#/components/schemas/Parent'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Class'
 *       403:
 *         description: Forbidden - Parent can only view classes for their own children
 *       404:
 *         description: Student not found
 */
const classController = require('../controllers/classController');
router.get('/:student_id/classes', authenticate, classController.getStudentClasses);

module.exports = router;
