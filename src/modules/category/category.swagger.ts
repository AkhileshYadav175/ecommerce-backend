/**
 * @openapi
 * components:
 *   schemas:
 *     CreateCategoryInput:
 *       type: object
 *       required:
 *         - name
 *       properties:
 *         name:
 *           type: string
 *           example: Laptops
 *         description:
 *           type: string
 *           example: High performance laptop computers
 *         image:
 *           type: string
 *           example: https://res.cloudinary.com/mock/image/upload/laptops.jpg
 *         parent_id:
 *           type: string
 *           format: uuid
 *           example: d3b07384-d113-4956-a5db-2b1689280f12
 *         sort_order:
 *           type: integer
 *           default: 0
 *           example: 5
 *         is_featured:
 *           type: boolean
 *           default: false
 *         is_active:
 *           type: boolean
 *           default: true
 *         meta_title:
 *           type: string
 *           example: Buy Gaming Laptops Online | Store
 *         meta_description:
 *           type: string
 *           example: Shop the latest high-performance laptops and notebook computers with standard warranty.
 *         meta_keywords:
 *           type: string
 *           example: laptops, computers, notebooks, store
 *     UpdateCategoryInput:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           example: Premium Laptops
 *         description:
 *           type: string
 *           example: High performance premium laptop computers
 *         image:
 *           type: string
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         sort_order:
 *           type: integer
 *         is_featured:
 *           type: boolean
 *         is_active:
 *           type: boolean
 *         meta_title:
 *           type: string
 *         meta_description:
 *           type: string
 *         meta_keywords:
 *           type: string
 *     CategoryResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: d3b07384-d113-4956-a5db-2b1689280f12
 *         name:
 *           type: string
 *           example: Laptops
 *         slug:
 *           type: string
 *           example: laptops
 *         description:
 *           type: string
 *           example: High performance laptop computers
 *         image:
 *           type: string
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         level:
 *           type: integer
 *           example: 2
 *         sort_order:
 *           type: integer
 *           example: 5
 *         is_featured:
 *           type: boolean
 *         is_active:
 *           type: boolean
 *         meta_title:
 *           type: string
 *         meta_description:
 *           type: string
 *         meta_keywords:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *     CategoryTreeNodeResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         name:
 *           type: string
 *         slug:
 *           type: string
 *         description:
 *           type: string
 *         image:
 *           type: string
 *         parent_id:
 *           type: string
 *           format: uuid
 *           nullable: true
 *         level:
 *           type: integer
 *         sort_order:
 *           type: integer
 *         is_featured:
 *           type: boolean
 *         is_active:
 *           type: boolean
 *         meta_title:
 *           type: string
 *         meta_description:
 *           type: string
 *         meta_keywords:
 *           type: string
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 *         deleted_at:
 *           type: string
 *           format: date-time
 *           nullable: true
 *         children:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryTreeNodeResponse'
 *     PaginatedCategoriesResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 50
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalPages:
 *           type: integer
 *           example: 5
 *         categories:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/CategoryResponse'
 * 
 * /categories:
 *   post:
 *     summary: Create a category
 *     description: Creates a new catalog category. Recomputes levels and automatically handles slug generation (checks duplicates). Restricted to Admins.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCategoryInput'
 *     responses:
 *       201:
 *         description: Category created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category created successfully
 *                 data:
 *                   $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         description: Validation failed or parent category not found.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *   get:
 *     summary: Get paginated list of categories
 *     description: Returns a paginated list of categories. Allows search, filter by active/featured, filter by parent category, sort, and soft-delete toggle. Public access.
 *     tags:
 *       - Category
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: parent_id
 *         schema:
 *           type: string
 *         description: Category UUID or 'null' for root categories only
 *       - in: query
 *         name: is_featured
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *       - in: query
 *         name: showDeleted
 *         schema:
 *           type: string
 *           enum: [true, false, only]
 *           default: false
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, name, sort_order]
 *           default: sort_order
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc, ASC, DESC]
 *           default: asc
 *     responses:
 *       200:
 *         description: Categories retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedCategoriesResponse'
 *       400:
 *         description: Invalid parameters.
 * 
 * /categories/tree:
 *   get:
 *     summary: Retrieve category tree
 *     description: Returns the active, non-deleted categories structured as a parent-child hierarchical tree. Public access.
 *     tags:
 *       - Category
 *     responses:
 *       200:
 *         description: Tree retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CategoryTreeNodeResponse'
 * 
 * /categories/{id}:
 *   get:
 *     summary: Retrieve category by ID
 *     description: Fetches complete category details by category UUID. Public access.
 *     tags:
 *       - Category
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category details retrieved.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/CategoryResponse'
 *       404:
 *         description: Category not found.
 *   patch:
 *     summary: Update category by ID
 *     description: Updates properties of an active category. Detects circular loops and updates levels of subcategories if parent changes. Restricted to Admins.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCategoryInput'
 *     responses:
 *       200:
 *         description: Category updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Category updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/CategoryResponse'
 *       400:
 *         description: Circular loops or invalid updates.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Category not found.
 *   delete:
 *     summary: Soft-delete category
 *     description: Soft-deletes a category and recursively soft-deletes all its subcategories (descendants). Restricted to Admins.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category and subcategories deleted.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Category not found.
 * 
 * /categories/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted category
 *     description: Restores a soft-deleted category and recursively restores all parent categories along its path to the root. Restricted to Admins.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category restored.
 *       400:
 *         description: Category is not soft-deleted.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Category not found.
 * 
 * /categories/{id}/feature:
 *   patch:
 *     summary: Mark category as featured
 *     description: Sets `is_featured = true` for the active category. Restricted to Admins.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category featured successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Category not found.
 * 
 * /categories/{id}/unfeature:
 *   patch:
 *     summary: Mark category as unfeatured
 *     description: Sets `is_featured = false` for the active category. Restricted to Admins.
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Category unfeatured successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: Category not found.
 */
export const swaggerCategorySnippet = true;
