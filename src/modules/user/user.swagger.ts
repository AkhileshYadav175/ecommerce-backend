/**
 * @openapi
 * components:
 *   schemas:
 *     UpdateUserInput:
 *       type: object
 *       properties:
 *         full_name:
 *           type: string
 *           example: Akhilesh Yadav Modified
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         role:
 *           type: string
 *           enum: [user, admin]
 *           example: user
 *         is_verified:
 *           type: boolean
 *           example: true
 *         is_active:
 *           type: boolean
 *           example: true
 *     UserStatsResponse:
 *       type: object
 *       properties:
 *         totalUsers:
 *           type: integer
 *           example: 10
 *         activeUsers:
 *           type: integer
 *           example: 8
 *         blockedUsers:
 *           type: integer
 *           example: 2
 *         verifiedUsers:
 *           type: integer
 *           example: 5
 *         softDeletedUsers:
 *           type: integer
 *           example: 1
 *     PaginatedUsersResponse:
 *       type: object
 *       properties:
 *         total:
 *           type: integer
 *           example: 25
 *         page:
 *           type: integer
 *           example: 1
 *         limit:
 *           type: integer
 *           example: 10
 *         totalPages:
 *           type: integer
 *           example: 3
 *         users:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/UserResponse'
 * 
 * /users:
 *   get:
 *     summary: Retrieve a paginated list of users
 *     description: Returns a paginated list of users. Allows filtering by role, status, verification, soft delete status, search queries, and custom sorting. Restricted to Admins.
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search query matching full name, email, or phone
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [user, admin]
 *         description: Filter users by role
 *       - in: query
 *         name: is_active
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter users by active state
 *       - in: query
 *         name: is_verified
 *         schema:
 *           type: string
 *           enum: [true, false]
 *         description: Filter users by email verification status
 *       - in: query
 *         name: showDeleted
 *         schema:
 *           type: string
 *           enum: [true, false, only]
 *           default: false
 *         description: Include, exclude, or only show soft-deleted users
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [created_at, updated_at, full_name, email, phone]
 *           default: created_at
 *         description: Field to sort results by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc, ASC, DESC]
 *           default: desc
 *         description: Sorting direction
 *     responses:
 *       200:
 *         description: Users list retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/PaginatedUsersResponse'
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 * 
 * /users/stats:
 *   get:
 *     summary: Retrieve user statistics
 *     description: Returns aggregated metrics about users (total, active, blocked, verified, soft-deleted). Restricted to Admins.
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Statistics retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserStatsResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 * 
 * /users/{id}:
 *   get:
 *     summary: Retrieve user details by ID
 *     description: Fetches complete user details by user UUID (includes soft-deleted records). Restricted to Admins.
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User retrieved successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found.
 *   patch:
 *     summary: Update user details by ID
 *     description: Updates editable properties of an active user. Revokes user sessions if role/status/verification changes. Restricted to Admins.
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateUserInput'
 *     responses:
 *       200:
 *         description: User updated successfully.
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
 *                   example: User updated successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found or soft-deleted.
 *   delete:
 *     summary: Soft delete user
 *     description: Marks user status as deleted by setting `deleted_at` column. Revokes all active user sessions in Redis. Restricted to Admins.
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User soft-deleted successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found or already deleted.
 * 
 * /users/{id}/block:
 *   patch:
 *     summary: Block a user
 *     description: Deactivates user account (sets `is_active = false`) and revokes all active login sessions in Redis. Restricted to Admins.
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User blocked successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found or is soft-deleted.
 * 
 * /users/{id}/unblock:
 *   patch:
 *     summary: Unblock a user
 *     description: Reactivates user account (sets `is_active = true`). Restricted to Admins.
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User unblocked successfully.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found or is soft-deleted.
 * 
 * /users/{id}/restore:
 *   patch:
 *     summary: Restore a soft-deleted user
 *     description: Recovers a soft-deleted user record by setting `deleted_at = NULL`. Restricted to Admins.
 *     tags:
 *       - User Management
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: User UUID
 *     responses:
 *       200:
 *         description: User restored successfully.
 *       400:
 *         description: User is not soft-deleted.
 *       401:
 *         description: Unauthorized.
 *       403:
 *         description: Forbidden.
 *       404:
 *         description: User not found.
 */
export const swaggerUserSnippet = true;
