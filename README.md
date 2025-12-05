# Daily Diet API

API para controle de dieta diária - Rocketseat Node.js Challenge 02.

## 🚀 Features

- **User Management**: Registro de usuários com validação de senha forte
- **Authentication**: JWT com access token (15min) e refresh token (7 dias)
- **Token Rotation**: Refresh tokens são rotacionados a cada uso
- **Meals CRUD**: Gerenciamento completo de refeições
- **Diet Metrics**: Estatísticas de dieta incluindo melhor sequência (streak)
- **Rate Limiting**: 100 requisições por 15 minutos por IP
- **API Documentation**: Swagger/OpenAPI disponível em `/v1/docs`

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL 16+ (ou Docker)
- npm ou yarn

## 🔧 Installation

### Local Development

1. Clone o repositório:
```bash
git clone https://github.com/solozabal/rocketseat-node-js-challenge-02.git
cd rocketseat-node-js-challenge-02
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
```

4. Execute as migrations:
```bash
npm run prisma:migrate
```

5. Inicie o servidor:
```bash
npm run dev
```

### Docker

```bash
# Iniciar API + PostgreSQL
docker-compose up -d

# Verificar logs
docker-compose logs -f api

# Parar containers
docker-compose down
```

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Porta do servidor | `3000` |
| `NODE_ENV` | Ambiente (development/production/test) | `development` |
| `DATABASE_URL` | URL de conexão PostgreSQL | - |
| `JWT_SECRET` | Chave secreta para JWT | - |
| `JWT_EXPIRES_IN` | Tempo de expiração do access token | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Tempo de expiração do refresh token | `7d` |
| `CORS_ORIGIN` | Origens permitidas (separadas por vírgula) | `http://localhost:3000` |

## 📚 API Endpoints

### Health Check
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/v1/health` | Health check (não limitado por rate limit) |

### Users
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/users` | Registrar novo usuário | ❌ |

### Authentication
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/v1/sessions` | Login | ❌ |
| POST | `/v1/refresh-token` | Renovar tokens | ❌ |
| POST | `/v1/logout` | Logout (revogar tokens) | ✅ |

### Meals
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/v1/meals` | Listar refeições (com paginação e filtros) | ✅ |
| POST | `/v1/meals` | Criar refeição | ✅ |
| GET | `/v1/meals/:id` | Obter refeição por ID | ✅ |
| PUT | `/v1/meals/:id` | Atualizar refeição | ✅ |
| DELETE | `/v1/meals/:id` | Deletar refeição | ✅ |

### Metrics
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/v1/metrics` | Obter métricas de dieta | ✅ |

## 🔒 Authentication

A API usa JWT Bearer Token. Após login, inclua o token no header:

```
Authorization: Bearer <seu_token>
```

## 📊 Response Format

### Success Response
```json
{
  "message": "Operation successful",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Error description",
    "request_id": "uuid",
    "details": [ ... ]  // opcional
  }
}
```

### Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Dados inválidos |
| `AUTH_ERROR` | 401 | Autenticação necessária ou inválida |
| `FORBIDDEN` | 403 | Acesso negado |
| `NOT_FOUND` | 404 | Recurso não encontrado |
| `EMAIL_EXISTS` | 409 | Email já registrado |
| `RATE_LIMITED` | 429 | Limite de requisições excedido |
| `INTERNAL_ERROR` | 500 | Erro interno do servidor |

## ⚡ Rate Limiting

- **Limite**: 100 requisições por 15 minutos por IP
- **Exceção**: `/v1/health` não é limitado
- **Headers**: `RateLimit-Limit`, `RateLimit-Remaining`, `RateLimit-Reset`

Quando o limite é excedido:
```json
{
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests",
    "request_id": "uuid"
  }
}
```

## 📖 API Documentation

Swagger/OpenAPI disponível em:
- **UI**: `http://localhost:3000/v1/docs`
- **JSON**: `http://localhost:3000/v1/docs.json`

## 🧪 Testing

```bash
# Testes unitários e de integração
npm test

# Com cobertura
npm run test:coverage

# Apenas testes unitários
npm run test:unit

# Apenas testes de integração (requer servidor rodando)
npm run test:integration
```

## 📁 Project Structure

```
src/
├── app.js              # Express app configuration
├── server.js           # Server entry point
├── config/
│   ├── database.js     # Prisma client
│   ├── logger.js       # Pino logger
│   └── swagger.js      # Swagger configuration
├── controllers/        # HTTP request handlers
├── errors/             # Custom error classes
├── middlewares/        # Express middlewares
├── routes/             # Route definitions
│   └── v1/             # API v1 routes
├── schemas/            # Zod validation schemas
├── services/           # Business logic
├── utils/              # Utility functions
└── validators/         # Input validators

tests/
├── setup.js            # Test setup
├── unit/               # Unit tests
└── integration/        # Integration tests

prisma/
├── schema.prisma       # Database schema
└── migrations/         # Database migrations
```

## 📝 License

ISC

## 👤 Author

Developed for Rocketseat Node.js Challenge 02
