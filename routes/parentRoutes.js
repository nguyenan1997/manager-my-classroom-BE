const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const parentController = require('../controllers/parentController');
const { authenticate, authorize } = require('../middleware/auth');

// Validation rules
const parentValidation = [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Valid email is required for parent login'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
];

const parentUpdateValidation = [
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('email').optional().isEmail().withMessage('Valid email is required'),
  body('phone').optional().isMobilePhone().withMessage('Invalid phone number')
];

/**
 * @swagger
 * /api/parents:
 *   get:
 *     summary: Get all parents (Admin/Staff only)
 *     description: |
 *       - Admin: Can see all parents
 *       - Staff: Can only see parents they created
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of parents retrieved successfully
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
 *                     $ref: '#/components/schemas/Parent'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions (not admin/staff)
 *   post:
 *     summary: Create a new parent (Admin/Staff only)
 *     description: The parent will be assigned to the authenticated staff/admin who creates it
 *     tags: [Parents]
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
 *                 example: Nguyễn Văn A
 *               phone:
 *                 type: string
 *                 example: "0123456789"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: parent@example.com
 *     responses:
 *       201:
 *         description: Parent created successfully
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
 *                   example: Parent created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Parent'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 *       403:
 *         description: Forbidden - Insufficient permissions (not admin/staff)
 */
router.get('/', authenticate, authorize('admin', 'staff'), parentController.getAllParents);
router.post('/', authenticate, authorize('admin', 'staff'), parentValidation, parentController.createParent);

/**
 * @swagger
 * /api/parents/{id}:
 *   get:
 *     summary: Get parent by ID (Admin/Staff only)
 *     description: |
 *       - Admin: Can view any parent
 *       - Staff: Can only view parents they created
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parent ID
 *         example: "550e8400-e29b-41d4-a716-446655440000"
 *     responses:
 *       200:
 *         description: Parent retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Parent'
 *       403:
 *         description: Forbidden - Staff can only view parents they created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Parent not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Missing or invalid token
 */
/**
 * @swagger
 * /api/parents/my-children:
 *   get:
 *     summary: Get all children for logged-in parent (Parent only)
 *     tags: [Parents]
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
router.get('/my-children', authenticate, authorize('parent'), parentController.getMyChildren);

/**
 * @swagger
 * /api/parents/{id}:
 *   put:
 *     summary: Update a parent (Admin/Staff only)
 *     description: |
 *       - Admin: Can update any parent
 *       - Staff: Can only update parents they created
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parent ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: Parent updated successfully
 *       400:
 *         description: Validation error or email already exists
 *       403:
 *         description: Forbidden - Staff can only update parents they created
 *       404:
 *         description: Parent not found
 *   delete:
 *     summary: Delete a parent (Admin/Staff only)
 *     description: |
 *       - Admin: Can delete any parent
 *       - Staff: Can only delete parents they created
 *       - Cannot delete if parent has students
 *     tags: [Parents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Parent ID
 *     responses:
 *       200:
 *         description: Parent deleted successfully
 *       400:
 *         description: Cannot delete - has students
 *       403:
 *         description: Forbidden - Staff can only delete parents they created
 *       404:
 *         description: Parent not found
 */
router.get('/:id', authenticate, authorize('admin', 'staff'), parentController.getParentById);
router.put('/:id', authenticate, authorize('admin', 'staff'), parentUpdateValidation, parentController.updateParent);
router.delete('/:id', authenticate, authorize('admin', 'staff'), parentController.deleteParent);

module.exports = router;
