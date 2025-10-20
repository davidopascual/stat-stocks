import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import {
  registerUser,
  loginUser,
  authenticateToken,
  getUserById,
  updateUserProfile,
  AuthRequest
} from './auth.js';

const router = Router();

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('displayName').optional().trim()
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { username, email, password, displayName } = req.body;

    const result = await registerUser(username, email, password, displayName || username);

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.status(201).json({
      message: result.message,
      user: result.user,
      token: result.token
    });
  }
);

/**
 * POST /api/auth/login
 * Login user
 */
router.post(
  '/login',
  [
    body('usernameOrEmail').trim().notEmpty().withMessage('Username or email required'),
    body('password').notEmpty().withMessage('Password required')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { usernameOrEmail, password } = req.body;

    const result = await loginUser(usernameOrEmail, password);

    if (!result.success) {
      return res.status(401).json({ error: result.message });
    }

    res.json({
      message: result.message,
      user: result.user,
      token: result.token
    });
  }
);

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
router.get('/me', authenticateToken, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = getUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

/**
 * PUT /api/auth/profile
 * Update user profile (protected)
 */
router.put(
  '/profile',
  authenticateToken,
  [
    body('displayName').optional().trim().isLength({ min: 1 }),
    body('avatar').optional().trim().isURL()
  ],
  (req: AuthRequest, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    if (!req.user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    const { displayName, avatar } = req.body;

    const result = updateUserProfile(req.user.id, { displayName, avatar });

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({
      message: result.message,
      user: result.user
    });
  }
);

/**
 * POST /api/auth/verify
 * Verify token is still valid
 */
router.post('/verify', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ valid: true, user: req.user });
});

export default router;
