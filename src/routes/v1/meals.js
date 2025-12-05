/**
 * Meals Routes (Protected)
 * Requires authentication
 */

const express = require('express');
const { mealController } = require('../../controllers');
const { validateBody, validateParams, validateQuery } = require('../../middlewares');
const {
  createMealSchema,
  updateMealSchema,
  mealIdSchema,
  listMealsQuerySchema,
} = require('../../schemas');

const router = express.Router();

/**
 * @swagger
 * /v1/meals:
 *   get:
 *     summary: List all meals
 *     tags: [Meals]
 *     description: Get all meals for the authenticated user with pagination and filters
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter meals from this date (inclusive)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter meals until this date (inclusive)
 *       - in: query
 *         name: is_on_diet
 *         schema:
 *           type: boolean
 *         description: Filter by diet status
 *     responses:
 *       200:
 *         description: List of meals
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Meal'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.get('/', validateQuery(listMealsQuerySchema), mealController.list);

/**
 * @swagger
 * /v1/meals:
 *   post:
 *     summary: Create a new meal
 *     tags: [Meals]
 *     description: Create a new meal for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - datetime
 *               - is_on_diet
 *             properties:
 *               name:
 *                 type: string
 *                 example: Breakfast
 *               description:
 *                 type: string
 *                 example: Eggs and toast
 *               datetime:
 *                 type: string
 *                 format: date-time
 *                 example: 2025-12-05T08:00:00Z
 *               is_on_diet:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Meal created
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Meal created successfully
 *                 meal:
 *                   $ref: '#/components/schemas/Meal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.post('/', validateBody(createMealSchema), mealController.create);

/**
 * @swagger
 * /v1/meals/{id}:
 *   get:
 *     summary: Get meal by ID
 *     tags: [Meals]
 *     description: Get a specific meal by its ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Meal ID
 *     responses:
 *       200:
 *         description: Meal found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meal:
 *                   $ref: '#/components/schemas/Meal'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.get('/:id', validateParams(mealIdSchema), mealController.getById);

/**
 * @swagger
 * /v1/meals/{id}:
 *   put:
 *     summary: Update a meal
 *     tags: [Meals]
 *     description: Update an existing meal
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Meal ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               datetime:
 *                 type: string
 *                 format: date-time
 *               is_on_diet:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Meal updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Meal updated successfully
 *                 meal:
 *                   $ref: '#/components/schemas/Meal'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.put(
  '/:id',
  validateParams(mealIdSchema),
  validateBody(updateMealSchema),
  mealController.update
);

/**
 * @swagger
 * /v1/meals/{id}:
 *   delete:
 *     summary: Delete a meal
 *     tags: [Meals]
 *     description: Soft delete a meal (can be restored)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Meal ID
 *     responses:
 *       204:
 *         description: Meal deleted (no content)
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       429:
 *         $ref: '#/components/responses/RateLimited'
 */
router.delete('/:id', validateParams(mealIdSchema), mealController.remove);

module.exports = router;
