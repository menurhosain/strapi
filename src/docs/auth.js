'use strict';

/**
 * @openapi
 * tags:
 *   - name: Auth
 *     description: Authentication via users-permissions plugin
 *
 * /api/auth/local:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [identifier, password]
 *             properties:
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 example: MyPassword123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jwt:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid credentials
 *
 * /api/auth/local/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     description: |
 *       Creates a new user account. The `type` field determines the role assigned
 *       (`applicant` or `contractor`). Fields `role`, `confirmed`, and `provider`
 *       are set automatically by the server and must not be sent.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [username, email, password, type, first_name, phone]
 *             properties:
 *               username:
 *                 type: string
 *                 minLength: 3
 *                 example: johndoe
 *               email:
 *                 type: string
 *                 format: email
 *                 minLength: 6
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: MyPassword123
 *               type:
 *                 type: string
 *                 enum: [applicant, contractor]
 *                 example: applicant
 *               first_name:
 *                 type: string
 *                 example: John
 *               last_name:
 *                 type: string
 *                 example: Doe
 *               phone:
 *                 type: string
 *                 example: "+1234567890"
 *               location:
 *                 type: string
 *                 example: "New York, USA"
 *     responses:
 *       200:
 *         description: Registration successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 jwt:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Validation error, email/username already taken, or invalid type
 *
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *         username:
 *           type: string
 *         email:
 *           type: string
 *           format: email
 *         first_name:
 *           type: string
 *         last_name:
 *           type: string
 *         phone:
 *           type: string
 *         location:
 *           type: string
 *         type:
 *           type: string
 *           enum: [applicant, contractor]
 *         profile_picture:
 *           type: object
 *           description: Uploaded image media object
 *           properties:
 *             id:
 *               type: integer
 *             url:
 *               type: string
 *             mime:
 *               type: string
 *             name:
 *               type: string
 *         confirmed:
 *           type: boolean
 *         blocked:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */
