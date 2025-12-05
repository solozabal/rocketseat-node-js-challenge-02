/**
 * Swagger/OpenAPI Configuration
 */

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Daily Diet API',
      version: '1.0.0',
      description: `
API para controle de dieta diária - Rocketseat Node.js Challenge 02.

## Autenticação
A API utiliza JWT Bearer Token para autenticação. Após fazer login, inclua o token no header:
\`\`\`
Authorization: Bearer <seu_token>
\`\`\`

## Rate Limiting
A API possui limite de **100 requisições por 15 minutos** por IP.
Quando o limite é excedido, retorna status 429.

## Códigos de Erro
| Code | HTTP Status | Descrição |
|------|-------------|-----------|
| VALIDATION_ERROR | 400 | Dados inválidos |
| AUTH_ERROR | 401 | Autenticação necessária |
| FORBIDDEN | 403 | Acesso negado |
| NOT_FOUND | 404 | Recurso não encontrado |
| RATE_LIMITED | 429 | Limite de requisições excedido |
| INTERNAL_ERROR | 500 | Erro interno |
      `,
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR',
                },
                message: {
                  type: 'string',
                  example: 'Validation failed',
                },
                request_id: {
                  type: 'string',
                  format: 'uuid',
                  example: '550e8400-e29b-41d4-a716-446655440000',
                },
                details: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      field: { type: 'string' },
                      message: { type: 'string' },
                      code: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        RateLimitError: {
          type: 'object',
          properties: {
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'RATE_LIMITED',
                },
                message: {
                  type: 'string',
                  example: 'Too many requests',
                },
                request_id: {
                  type: 'string',
                  format: 'uuid',
                },
              },
            },
          },
        },
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'John Doe',
            },
            email: {
              type: 'string',
              format: 'email',
              example: 'john@example.com',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Meal: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
            },
            name: {
              type: 'string',
              example: 'Breakfast',
            },
            description: {
              type: 'string',
              example: 'Eggs and toast',
            },
            datetime: {
              type: 'string',
              format: 'date-time',
            },
            is_on_diet: {
              type: 'boolean',
              example: true,
            },
            created_at: {
              type: 'string',
              format: 'date-time',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
            },
          },
        },
        Metrics: {
          type: 'object',
          properties: {
            total_meals: {
              type: 'integer',
              example: 10,
            },
            total_on_diet: {
              type: 'integer',
              example: 7,
            },
            total_off_diet: {
              type: 'integer',
              example: 3,
            },
            best_streak: {
              type: 'integer',
              example: 4,
              description: 'Best consecutive on-diet meals streak',
            },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Authentication required',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
              example: {
                error: {
                  code: 'AUTH_ERROR',
                  message: 'Authentication required',
                  request_id: '550e8400-e29b-41d4-a716-446655440000',
                },
              },
            },
          },
        },
        RateLimited: {
          description: 'Rate limit exceeded - 100 requests per 15 minutes',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RateLimitError',
              },
              example: {
                error: {
                  code: 'RATE_LIMITED',
                  message: 'Too many requests',
                  request_id: '550e8400-e29b-41d4-a716-446655440000',
                },
              },
            },
          },
        },
        ValidationError: {
          description: 'Validation failed',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error',
              },
            },
          },
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Health check endpoint' },
      { name: 'Users', description: 'User registration' },
      { name: 'Auth', description: 'Authentication endpoints' },
      { name: 'Meals', description: 'Meal management' },
      { name: 'Metrics', description: 'Diet metrics' },
    ],
  },
  apis: ['./src/routes/**/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
