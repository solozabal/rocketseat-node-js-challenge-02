/**
 * User Service
 * Business logic for user operations
 */

const bcrypt = require('bcrypt');
const { prisma } = require('../config/database');
const { AppError } = require('../errors');
const logger = require('../config/logger');

const BCRYPT_ROUNDS = 12;

/**
 * Create a new user
 * @param {Object} data - User data
 * @param {string} data.name - User name
 * @param {string} data.email - User email
 * @param {string} data.password - Plain text password
 * @param {string} [requestId] - Request ID for logging
 * @returns {Promise<Object>} Created user (without password)
 */
const createUser = async ({ name, email, password }, requestId) => {
  // Check if email already exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    logger.warn({
      request_id: requestId,
      type: 'user_service',
      message: 'Email already exists',
      email,
    });
    throw AppError.conflict('Email already exists');
  }

  // Hash password with bcrypt (12 rounds)
  const password_hash = await bcrypt.hash(password, BCRYPT_ROUNDS);

  // Create user
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password_hash,
    },
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true,
      updated_at: true,
    },
  });

  logger.info({
    request_id: requestId,
    type: 'user_service',
    message: 'User created successfully',
    userId: user.id,
  });

  return user;
};

/**
 * Find user by email
 * @param {string} email - User email
 * @returns {Promise<Object|null>} User or null
 */
const findByEmail = async (email) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

/**
 * Find user by ID
 * @param {string} id - User ID
 * @returns {Promise<Object|null>} User or null
 */
const findById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      created_at: true,
      updated_at: true,
    },
  });
};

module.exports = {
  createUser,
  findByEmail,
  findById,
  BCRYPT_ROUNDS,
};
