const express = require('express');
const healthRoutes = require('./health');

const router = express.Router();

// Health check routes
router.use('/', healthRoutes);

module.exports = router;
