/**
 * User Controller
 * HTTP request handlers for user operations
 */

const { userService } = require('../services');
const logger = require('../config/logger');

/**
 * Create a new user
 * POST /v1/users
 */
const create = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    logger.info({
      request_id: req.id,
      type: 'user_controller',
      message: 'Creating new user',
      email,
    });

    const user = await userService.createUser(
      { name, email, password },
      req.id
    );

    res.status(201).json({
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  create,
};
