const express = require('express');
const healthRoutes = require('./health');
const userRoutes = require('./users');
const sessionRoutes = require('./sessions');

const router = express.Router();

// Health check routes
router.use('/', healthRoutes);

// User routes
router.use('/users', userRoutes);

// Session routes (authentication)
router.use('/sessions', sessionRoutes);

module.exports = router;
