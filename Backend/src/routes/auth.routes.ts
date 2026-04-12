import { Router } from 'express';
import * as ctrl from '../controllers/auth.controller';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import { registerSchema, loginSchema, refreshSchema } from '../schemas/auth.schema';

const router = Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string, format: email }
 *               password: { type: string, minLength: 6 }
 *               role: { type: string, enum: [admin, manager, cashier] }
 *     responses:
 *       201: { description: Account created }
 *       409: { description: Email already registered }
 */
router.post('/register', validate(registerSchema), ctrl.register);

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login and receive JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       200: { description: Login successful, returns accessToken + refreshToken }
 *       401: { description: Invalid credentials }
 */
router.post('/login', validate(loginSchema), ctrl.login);

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Rotate refresh token and get new access token
 *     security: []
 */
router.post('/refresh', validate(refreshSchema), ctrl.refresh);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get authenticated user profile
 *     security: [{ BearerAuth: [] }]
 */
router.get('/me', protect, ctrl.getMe);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout and revoke refresh token
 */
router.post('/logout', protect, ctrl.logout);

/**
 * @swagger
 * /api/auth/gdpr/erase:
 *   delete:
 *     tags: [Auth]
 *     summary: GDPR Right to be Forgotten — erase user PII
 */
router.delete('/gdpr/erase', protect, ctrl.gdprErase);

export default router;
