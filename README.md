<div align="center">
  <h1>🍽️ Daily Diet API</h1>
  <p><b>Daily diet control | Node.js | Prisma | PostgreSQL | JWT | Docker</b></p>
  <br>
  <a href="https://img.shields.io/badge/Node.js-20+-brightgreen"><img src="https://img.shields.io/badge/Node.js-20+-brightgreen" /></a>
  <a href="https://img.shields.io/badge/PostgreSQL-16+-blue"><img src="https://img.shields.io/badge/PostgreSQL-16+-blue" /></a>
  <a href="https://img.shields.io/badge/Prisma-ORM-orange"><img src="https://img.shields.io/badge/Prisma-ORM-orange" /></a>
  <a href="https://img.shields.io/badge/JWT-Auth-yellow" ><img src="https://img.shields.io/badge/JWT-Auth-yellow" /></a>
  <a href="https://img.shields.io/badge/Docker-ready-blue?logo=docker&logoColor=white"><img src="https://img.shields.io/badge/Docker-ready-blue?logo=docker&logoColor=white" /></a>
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
- **Ready for Docker deployment (API and PostgreSQL in containers)**

---

## 🧠 Logic & Implementation

### Modular Structure
The project is organized in well-defined layers:

- **Routing (`routes/`)**: Defines API entry points, split by version (e.g., `v1/`) and mapped to controller actions.
- **Controllers (`controllers/`)**: Receive HTTP requests, validate input, and delegate to services.
- **Services (`services/`)**: Contain business logic such as streak calculation, metrics aggregation, user authentication, and token rotation.
- **Schemas/Validators (`schemas/`, `validators/`)**: Input validation using Zod, ensuring type safety and preventing invalid data at the boundaries.
- **Middlewares (`middlewares/`)**: Implement authentication, rate limiting, error handling, request ID generation, and request validation.
- **Error Handling (`errors/`)**: Centralized custom error classes (`AppError`), error codes, and logic for standardized responses.
- **Utils (`utils/`)**: Utility functions for specific tasks (e.g., streakCalculator, helpers).
- **Database & ORM (`config/database.js`, `schema.prisma`)**: Connection and modeling via Prisma, targeting a PostgreSQL database.
- **Logger (`config/logger.js`)**: Centralized logging based on environment for monitoring and debugging.
- **Swagger/OpenAPI (`config/swagger.js`)**: Automated and interactive API documentation served at `/v1/docs`.
- **Scripts (`scripts/`)**: Utility scripts for local/manual testing and development automation.
- **Testing (`tests/`)**: Organized unit and integration tests, including setup and environment helpers.
- **Docker support**: Complete `Dockerfile` and `docker-compose.yml` to orchestrate API and database for easy deployment and testing.

### Security
- JWT authentication with rotating refresh tokens and configurable expiry.
- IP-based rate limiting to avoid abusive use.
- Passwords hashed and safely stored.

### Metrics & Streak
- Calculation of each user's best streak of compliant meals.
- Real-time and aggregated diet metrics per user.

### Testing
- Unit tests and integration tests using Vitest.
- Full coverage of business rules, service logic, and REST endpoints.
- Scripts and helpers for reproducible and reliable test environments.

### 📖 Documentation

- Interactive API documentation is available via **Swagger UI**.
- Once the API server is running, you can access documentation at the `/v1/docs` route.
    - **Example:** If running locally with default settings: `http://localhost:3000/v1/docs`
    - If running inside Docker or on another host/port, adjust the URL accordingly: `http://<your-server-host>:<your-server-port>/v1/docs`
- The actual Swagger URL may vary depending on your deployment, server settings, or reverse proxy.
- Use Swagger UI to explore, test, and understand the API endpoints, required fields, authentication flows, and responses.

---

## 📦 Installation

### Local (Node.js)

```bash
git clone https://github.com/solozabal/rocketseat-node-js-challenge-02.git
cd rocketseat-node-js-challenge-02
npm install
cp .env.example .env
# Edit your .env file with your local PostgreSQL and secrets
npm run prisma:migrate
npm run dev
```

### Docker (API + PostgreSQL)

```bash
docker-compose up -d
# To check API logs and confirm success
docker-compose logs -f api
# To stop and remove containers:
docker-compose down
```

---

## 🔐 Environment Variables

| Variable                  | Description               | Default                      |
|---------------------------|---------------------------|------------------------------|
| `PORT`                    | Server port               | `3000`                       |
| `NODE_ENV`                | Environment               | `development`                |
| `DATABASE_URL`            | PostgreSQL URL            | *(required)*                 |
| `JWT_SECRET`              | JWT secret                | *(required)*                 |
| `JWT_EXPIRES_IN`          | Access token expiry       | `15m`                        |
| `REFRESH_TOKEN_EXPIRES_IN`| Refresh token expiry      | `7d`                         |
| `CORS_ORIGIN`             | Allowed origins           | `http://localhost:3000`      |

**Tip:**  
Make sure your `.env` file is configured with valid database credentials, JWT secrets, and other required parameters before running the API or tests.  
For different environments (local, test, production), consider using separate `.env` files (`.env.test`, `.env.production`, etc).

## 📚 Main Endpoints

| Method | Endpoint           | Description         | Auth Required |
|--------|--------------------|---------------------|:------------:|
| GET    | `/v1/health`       | Health check        | ❌           |
| POST   | `/v1/users`        | Register user       | ❌           |
| POST   | `/v1/sessions`     | Login               | ❌           |
| POST   | `/v1/refresh-token`| Renew tokens        | ❌           |
| POST   | `/v1/logout`       | Logout              | ✅           |
| GET    | `/v1/meals`        | List meals          | ✅           |
| POST   | `/v1/meals`        | Create meal         | ✅           |
| GET    | `/v1/meals/:id`    | Get meal by id      | ✅           |
| PUT    | `/v1/meals/:id`    | Update meal         | ✅           |
| DELETE | `/v1/meals/:id`    | Delete meal         | ✅           |
| GET    | `/v1/metrics`      | Diet metrics        | ✅           |

- ✅ = Requires authentication (JWT Bearer token in header)
- ❌ = Public endpoint (no authentication required)

## 🛡️ Authentication

This API uses JWT (JSON Web Tokens) for secure authentication and authorization.

After a successful login, you will receive an access token.  
For any authenticated request, include this token in your request headers:

```http
Authorization: Bearer <your_jwt_token>
```

- Certain endpoints require authentication (see "Main Endpoints" for details).
- Access tokens have a limited lifespan—use the `/v1/refresh-token` endpoint to obtain a new token when needed.
- Logout (`/v1/logout`) invalidates your refresh token for extra session security.

**Tip:** Store your tokens securely and do not expose them publicly.


---

## 🧪 Tests & Coverage

Automated tests are a core part of the project, ensuring reliability and maintainability.

```bash
# Run all unit and integration tests
npm test

# Generate a coverage report
npm run test:coverage

# Run only unit tests
npm run test:unit

# Run only integration tests (requires API server and database running)
npm run test:integration
```

#### Integration Test Notes

- The API server and PostgreSQL database must be running before starting integration tests.
- Ensure your test environment variables (such as `DATABASE_URL`, JWT secrets, etc.) are properly configured.
- By default, integration tests may use a separate test database to prevent data loss.

**Example setup for integration testing:**
```bash
# Start database and API server (if using Docker)
docker-compose up -d

# Set up the test database and apply migrations if needed
npm run prisma:migrate

# Run integration tests
npm run test:integration
```

#### Coverage

- The coverage report demonstrates high reliability, with business logic, validation, and REST endpoints tested.
- Coverage output can be found in the `/coverage` directory as HTML and summarized statistics.

---

**Why This Matters?**  
Comprehensive testing and clear authentication flows demonstrate engineering excellence and reliability—making onboarding easier for developers and impressing recruiters with professional practices.

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

## 📖 Interactive Documentation

- **Swagger UI:** Available at `/v1/docs` after starting the server (`http://localhost:3000/v1/docs` by default).
- **Swagger JSON:** Available at `/v1/docs.json`.

Both endpoints provide interactive, automated API documentation for easy onboarding, exploration, and integration.

---

## 💡 Differentials

- **100% test coverage** with Vitest (unit & integration).
- **Ready for Docker**: Simple deployment using Docker and Docker Compose (API & DB).
- **Advanced rate limiting** middleware for production stability.
- **Secure JWT authentication** with refresh token rotation.
- **Modular, scalable and service-oriented architecture**.
- **Environment variable management** – easy configuration across stages (dev/test/prod).
- **Swagger/OpenAPI documentation** for fast developer/recruiter onboarding.
- **Standardized error handling** for great DX.
- **Automated database migrations** via Prisma.
- **Separation of unit and integration tests**; easy to execute in any environment.
- **Flexible setup**: Works locally or in containerized environments.

---

<div align="center">
  <sub>Developed by <b>solozabal</b> for Rocketseat Node.js Challenge 02</sub><br>
  <sub>Made with 💚 Node.js, Prisma, PostgreSQL, Express, JWT, Vitest, Docker</sub>
</div>