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
 * @route   POST /v1/users
 * @desc    Register a new user
 * @access  Public
 */
router.post('/', validateBody(createUserSchema), userController.create);

module.exports = router;
