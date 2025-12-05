const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('../config/swagger');
const v1Routes = require('./v1');

const router = express.Router();

// Swagger documentation
router.use('/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'Daily Diet API - Documentation',
}));

// Swagger JSON endpoint
router.get('/v1/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// API v1 routes
router.use('/v1', v1Routes);

module.exports = router;
