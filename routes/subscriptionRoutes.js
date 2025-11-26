const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const subscriptionController = require('../controllers/subscriptionController');

// Validation rules
const subscriptionValidation = [
  body('student_id').isInt().withMessage('Student ID is required and must be an integer'),
  body('package_name').notEmpty().withMessage('Package name is required'),
  body('total_sessions').isInt({ min: 1 }).withMessage('Total sessions must be a positive integer'),
  body('start_date').optional().isISO8601().withMessage('Invalid date format'),
  body('end_date').optional().isISO8601().withMessage('Invalid date format')
];

/**
 * @swagger
 * /api/subscriptions:
 *   post:
 *     summary: Create a new subscription package for a student
 *     tags: [Subscriptions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - student_id
 *               - package_name
 *               - total_sessions
 *             properties:
 *               student_id:
 *                 type: integer
 *                 example: 1
 *               package_name:
 *                 type: string
 *                 example: Gói 20 buổi
 *               start_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-01-01"
 *               end_date:
 *                 type: string
 *                 format: date
 *                 example: "2024-06-30"
 *               total_sessions:
 *                 type: integer
 *                 minimum: 1
 *                 example: 20
 *     responses:
 *       201:
 *         description: Subscription created successfully
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
 *                   example: Subscription created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: Validation error
 *       404:
 *         description: Student not found
 */
router.post('/', subscriptionValidation, subscriptionController.createSubscription);

/**
 * @swagger
 * /api/subscriptions/{id}/use:
 *   patch:
 *     summary: Mark a session as used (increment used_sessions)
 *     description: |
 *       Mark one session as used. This will increment used_sessions by 1.
 *       The remaining_sessions will be automatically calculated.
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Session marked as used successfully
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
 *                   example: Session marked as used
 *                 data:
 *                   $ref: '#/components/schemas/Subscription'
 *       400:
 *         description: No remaining sessions available
 *       404:
 *         description: Subscription not found
 */
router.patch('/:id/use', subscriptionController.useSession);

/**
 * @swagger
 * /api/subscriptions/{id}:
 *   get:
 *     summary: Get subscription details by ID
 *     description: Get subscription information including total sessions, used sessions, and remaining sessions
 *     tags: [Subscriptions]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Subscription ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Subscription retrieved successfully
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
 *                     student_id:
 *                       type: integer
 *                     package_name:
 *                       type: string
 *                     total_sessions:
 *                       type: integer
 *                     used_sessions:
 *                       type: integer
 *                     remaining_sessions:
 *                       type: integer
 *                     start_date:
 *                       type: string
 *                       format: date
 *                     end_date:
 *                       type: string
 *                       format: date
 *                     student:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: integer
 *                         name:
 *                           type: string
 *                         current_grade:
 *                           type: string
 *       404:
 *         description: Subscription not found
 */
router.get('/:id', subscriptionController.getSubscriptionById);

module.exports = router;
