const express = require('express');
const healthRoutes = require('./health');
const userRoutes = require('./users');

const router = express.Router();

// Health check routes
router.use('/', healthRoutes);

// User routes
router.use('/users', userRoutes);

module.exports = router;
