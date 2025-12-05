<div align="center">
  <h1>🍽️ Daily Diet API</h1>
  <p><b>Daily diet control | Node.js | Prisma | PostgreSQL | JWT | Rocketseat Challenge</b></p>
  <br>
  <a href="https://img.shields.io/badge/Node.js-20+-brightgreen"><img src="https://img.shields.io/badge/Node.js-20+-brightgreen" /></a>
  <a href="https://img.shields.io/badge/PostgreSQL-16+-blue"><img src="https://img.shields.io/badge/PostgreSQL-16+-blue" /></a>
  <a href="https://img.shields.io/badge/Prisma-ORM-orange"><img src="https://img.shields.io/badge/Prisma-ORM-orange" /></a>
  <a href="https://img.shields.io/badge/JWT-Auth-yellow" ><img src="https://img.shields.io/badge/JWT-Auth-yellow" /></a>
  <a href="https://img.shields.io/badge/Coverage-100%25-success" ><img src="https://img.shields.io/badge/Coverage-100%25-success" /></a>
</div>

---

## ✨ About the Project

The <b>Daily Diet API</b> is a RESTful API for daily diet tracking, developed for Rocketseat Node.js Challenge 02. The project focuses on security, scalability, good architecture practices, and developer experience. The API allows full management of users, meals, and nutritional metrics, featuring JWT authentication, rate limiting, interactive documentation, and complete test coverage.

---

## 🚀 Features

- JWT authentication (Access/Refresh Token, secure rotation)
- User registration and login with strong validation
- Meals CRUD with filters, pagination, and metrics
- Diet metrics (best streak, totals, inside/outside diet)
- Smart Rate Limiting per IP
- Swagger/OpenAPI documentation
- Custom error handling and standardized responses

---

## 🧠 Logic & Implementation

### Modular Structure
The project is organized in well-defined layers:
- **Controllers**: Receive HTTP requests, validate data, and delegate to services.
- **Services**: Implement business logic (e.g.: streak rules, metrics, token rotation).
- **Schemas/Validators**: Input validation using Zod.
- **Middlewares**: Authentication, rate limiting, error handling, requestId, etc.
- **Prisma**: ORM for modelling and accessing PostgreSQL database.

### Security
- JWT authentication with rotating refresh token and configurable expiry.
- Rate limiting per IP to prevent abuse.
- Passwords validated and stored with secure hashing.

### Metrics & Streak
- Calculation of user's best streak of meals within the diet.
- Aggregated metrics per user.

### Testing
- Unit and integration tests with Vitest.
- Full coverage of main business flows and rules.

### Documentation
- Swagger available at `/v1/docs` for easy onboarding and integration.

---

## 📦 Installation

### Local (Node.js)
```bash
git clone https://github.com/solozabal/rocketseat-node-js-challenge-02.git
cd rocketseat-node-js-challenge-02
npm install
cp .env.example .env
# Edit your .env file
npm run prisma:migrate
npm run dev
```

### Docker (API + PostgreSQL)
```bash
docker-compose up -d
docker-compose logs -f api
docker-compose down
```

---

## 🔐 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL URL | - |
| `JWT_SECRET` | JWT secret | - |
| `JWT_EXPIRES_IN` | Access token expiry | `15m` |
| `REFRESH_TOKEN_EXPIRES_IN` | Refresh token expiry | `7d` |
| `CORS_ORIGIN` | Allowed origins | `http://localhost:3000` |

---

## 📚 Main Endpoints

| Method | Endpoint           | Description         | Auth |
|--------|--------------------|---------------------|------|
| GET    | `/v1/health`       | Health check        | ❌   |
| POST   | `/v1/users`        | Register user       | ❌   |
| POST   | `/v1/sessions`     | Login               | ❌   |
| POST   | `/v1/refresh-token`| Renew tokens        | ❌   |
| POST   | `/v1/logout`       | Logout              | ✅   |
| GET    | `/v1/meals`        | List meals          | ✅   |
| POST   | `/v1/meals`        | Create meal         | ✅   |
| GET    | `/v1/meals/:id`    | Get meal by id      | ✅   |
| PUT    | `/v1/meals/:id`    | Update meal         | ✅   |
| DELETE | `/v1/meals/:id`    | Delete meal         | ✅   |
| GET    | `/v1/metrics`      | Diet metrics        | ✅   |

---

## 🛡️ Authentication

After login, include the JWT token in header:
```http
Authorization: Bearer <your_token>
```

---

## 🧪 Tests & Coverage

```bash
# Run all unit and integration tests
npm test

# Check coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests (requires API and database running)
npm run test:integration
```

---

## 📁 Project Structure

```text
coverage/
  base.css
  block-navigation.js
  coverage-final.json
  index.html
  prettify.css
  prettify.js
  sorter.js
  src/
    config/
      database.js.html
      index.html
      logger.js.html
      swagger.js.html
    controllers/
      index.html
      mealController.js.html
      metricsController.js.html
      sessionController.js.html
      userController.js.html
    errors/
      AppError.js.html
      errorCodes.js.html
      index.html
    middlewares/
      auth.js.html
      errorHandler.js.html
      index.html
      rateLimiter.js.html
      requestId.js.html
      validate.js.html
    routes/
      v1/
        health.js.html
        index.html
        logout.js.html
        meals.js.html
        metrics.js.html
        refreshToken.js.html
        sessions.js.html
        users.js.html
    schemas/
      index.html
      mealSchemas.js.html
    services/
      authService.js.html
      index.html
      mealService.js.html
      metricsService.js.html
      userService.js.html
    utils/
      index.html
      streakCalculator.js.html
    validators/
      index.html
      mealValidator.js.html
      sessionValidator.js.html
      userValidator.js.html
    app.js.html
    index.html
  favicon.png

node_modules/
prisma/
  migrations/
    20251205090234_init_user_meal_refresh_token/
      migration.sql
    migration_lock.toml
  schema.prisma
src/
  config/
    database.js
    logger.js
    swagger.js
  controllers/
    index.js
    mealController.js
    metricsController.js
    sessionController.js
    userController.js
  errors/
    AppError.js
    errorCodes.js
    index.js
  middlewares/
    auth.js
    errorHandler.js
    index.js
    rateLimiter.js
    requestId.js
    validate.js
  routes/
    v1/
      health.js
      index.js
      logout.js
      meals.js
      metrics.js
      refreshToken.js
      sessions.js
      users.js
    index.js
  schemas/
    index.js
    mealSchemas.js
  scripts/
    testAuthMiddleware.js
    testAuthSessions.js
    testConnection.js
    testLogout.js
    testMeals.js
    testMealsFilters.js
    testMetrics.js
    testModels.js
    testRefreshToken.js
    testUserRegistration.js
    testValidation.js
  services/
    authService.js
    index.js
    mealService.js
    metricsService.js
    userService.js
  utils/
    index.js
    streakCalculator.js
  validators/
    index.js
    mealValidator.js
    sessionValidator.js
    userValidator.js
  app.js
  server.js
tests/
  setup.js
  integration/
    health.test.js
    helpers.js
    logout.test.js
    meals.test.js
    metrics.test.js
    rateLimiting.test.js
    refreshToken.test.js
    sessions.test.js
    users.test.js
  unit/
    errorHandler.test.js
    streakCalculator.test.js
    validators.test.js
.dockerignore
.env
.env.example
.gitignore
docker-compose.yml
Dockerfile
package-lock.json
package.json
README.md
vitest.config.js
```

---

## 📖 Interactive documentation

- <b>Swagger UI:</b> [`/v1/docs`](http://localhost:3000/v1/docs)
- <b>Swagger JSON:</b> [`/v1/docs.json`](http://localhost:3000/v1/docs.json)

---

## 💡 Differentials

- 100% test coverage with Vitest
- Advanced rate limiting
- Secure refresh token with rotation
- Scalable and modular architecture
- Swagger documentation ready for devs and recruiters
- Standardized error handling for dev experience

<div align="center">
  <sub>Developed by <b>solozabal</b> for Rocketseat Node.js Challenge 02</sub><br>
  <sub>Made with 💚 Node.js, Prisma, PostgreSQL, Express, JWT, Vitest</sub>
</div>