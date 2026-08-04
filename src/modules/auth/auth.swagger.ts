/**
 * @openapi
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     RegisterInput:
 *       type: object
 *       required:
 *         - full_name
 *         - email
 *         - password
 *       properties:
 *         full_name:
 *           type: string
 *           example: Akhilesh Yadav
 *         email:
 *           type: string
 *           format: email
 *           example: akhilesh@example.com
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         password:
 *           type: string
 *           format: password
 *           example: SecurePass123!
 *     LoginInput:
 *       type: object
 *       required:
 *         - email
 *         - password
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: akhilesh@example.com
 *         password:
 *           type: string
 *           format: password
 *           example: SecurePass123!
 *     ChangePasswordInput:
 *       type: object
 *       required:
 *         - old_password
 *         - new_password
 *       properties:
 *         old_password:
 *           type: string
 *           format: password
 *           example: SecurePass123!
 *         new_password:
 *           type: string
 *           format: password
 *           example: NewSecurePass123!
 *     ForgotPasswordInput:
 *       type: object
 *       required:
 *         - email
 *       properties:
 *         email:
 *           type: string
 *           format: email
 *           example: akhilesh@example.com
 *     ResetPasswordInput:
 *       type: object
 *       required:
 *         - token
 *         - password
 *       properties:
 *         token:
 *           type: string
 *           example: d3b07384-d113-4956-a5db-2b1689280f12
 *         password:
 *           type: string
 *           format: password
 *           example: NewSecurePass123!
 *     VerifyEmailInput:
 *       type: object
 *       required:
 *         - token
 *       properties:
 *         token:
 *           type: string
 *           example: d3b07384-d113-4956-a5db-2b1689280f12
 *     UserResponse:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           example: d3b07384-d113-4956-a5db-2b1689280f12
 *         full_name:
 *           type: string
 *           example: Akhilesh Yadav
 *         email:
 *           type: string
 *           example: akhilesh@example.com
 *         phone:
 *           type: string
 *           example: "+919876543210"
 *         role:
 *           type: string
 *           example: user
 *         is_verified:
 *           type: boolean
 *           example: false
 *         is_active:
 *           type: boolean
 *           example: true
 *         created_at:
 *           type: string
 *           format: date-time
 *         updated_at:
 *           type: string
 *           format: date-time
 * 
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user record in the database after validating fields, checking for duplicate email addresses, and hashing the password.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterInput'
 *     responses:
 *       201:
 *         description: User registered successfully.
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
 *                   example: User registered successfully
 *                 data:
 *                   $ref: '#/components/schemas/UserResponse'
 *       400:
 *         description: Validation failed.
 *       409:
 *         description: Email already registered.
 * 
 * /auth/login:
 *   post:
 *     summary: Log in user
 *     description: Authenticates user credentials, generates JWT access token, and sets long-lived HTTP-Only refresh token cookie.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginInput'
 *     responses:
 *       200:
 *         description: Login successful.
 *         headers:
 *           Set-Cookie:
 *             schema:
 *               type: string
 *               example: refresh_token=abc123xyz...; Path=/; HttpOnly; SameSite=Strict
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/UserResponse'
 *                     accessToken:
 *                       type: string
 *                       example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: Invalid credentials.
 *       403:
 *         description: Account deactivated.
 * 
 * /auth/logout:
 *   post:
 *     summary: Log out from the current device
 *     description: Deletes the active session from Redis and blacklists the current Access Token.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out successfully.
 *       401:
 *         description: Unauthorized.
 * 
 * /auth/logout-all:
 *   post:
 *     summary: Log out from all devices
 *     description: Invalidates all active refresh token sessions in Redis for the user.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully.
 *       401:
 *         description: Unauthorized.
 * 
 * /auth/refresh:
 *   post:
 *     summary: Refresh Access Token
 *     description: Rotates the refresh token (validates incoming token cookie, checks for reuse/replay attack, issues new Access Token and rotating Refresh Token).
 *     tags:
 *       - Auth
 *     responses:
 *       200:
 *         description: Tokens rotated successfully.
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
 *                   example: Tokens refreshed successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *       401:
 *         description: Invalid, expired, or reused refresh token.
 * 
 * /auth/profile:
 *   get:
 *     summary: Get profile details
 *     description: Retrieves the current authenticated user's profile details.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved.
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
 * 
 * /auth/change-password:
 *   post:
 *     summary: Change password
 *     description: Updates the user's password in the database and revokes all active sessions.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordInput'
 *     responses:
 *       200:
 *         description: Password updated successfully.
 *       400:
 *         description: Validation failed.
 *       401:
 *         description: Incorrect old password / Unauthorized.
 * 
 * /auth/forgot-password:
 *   post:
 *     summary: Forgot password request
 *     description: Generates a short-lived password reset token and logs it (simulated email dispatch).
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ForgotPasswordInput'
 *     responses:
 *       200:
 *         description: Reset link generated.
 *       404:
 *         description: Email not found.
 * 
 * /auth/reset-password:
 *   post:
 *     summary: Reset password
 *     description: Uses the reset token to apply a new password and revokes all previous active sessions.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ResetPasswordInput'
 *     responses:
 *       200:
 *         description: Password reset successfully.
 *       400:
 *         description: Invalid/expired token or validation failure.
 * 
 * /auth/verify-email:
 *   post:
 *     summary: Verify email address
 *     description: Consumes the verification token to set the user's `is_verified` status to true in the database.
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/VerifyEmailInput'
 *     responses:
 *       200:
 *         description: Email verified successfully.
 *       400:
 *         description: Invalid or expired token.
 * 
 * /auth/resend-verification:
 *   post:
 *     summary: Resend verification token
 *     description: Generates and logs a new email verification link for the authenticated user.
 *     tags:
 *       - Auth
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Verification link generated and logged.
 *       400:
 *         description: Email already verified.
 *       401:
 *         description: Unauthorized.
 */
export const swaggerAuthSnippet = true;
