const express = require('express');
const healthRoutes = require('./health');
const userRoutes = require('./users');
const sessionRoutes = require('./sessions');
const mealRoutes = require('./meals');
const metricsRoutes = require('./metrics');
const { authenticate } = require('../../middlewares/auth');

const router = express.Router();

// Health check routes
router.use('/', healthRoutes);

// User routes
router.use('/users', userRoutes);

// Session routes (authentication)
router.use('/sessions', sessionRoutes);

// Protected routes (require authentication)
router.use('/meals', authenticate, mealRoutes);
router.use('/metrics', authenticate, metricsRoutes);

module.exports = router;
