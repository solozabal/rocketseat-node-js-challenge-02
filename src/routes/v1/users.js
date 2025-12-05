/**
 * User Routes
 * POST /v1/users - Create new user
 */

const express = require('express');
const { userController } = require('../../controllers');
const { validateBody } = require('../../middlewares');
const { createUserSchema } = require('../../validators');

const router = express.Router();

/**
 * @swagger
 * /v1/users:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 description: Must contain uppercase, lowercase, number, and special character
 *                 example: Test123!@#
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User created successfully
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       409:
 *         description: Email already registered
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.post('/', validateBody(createUserSchema), userController.create);

module.exports = router;
