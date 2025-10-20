import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { AuthService } from './authService.js';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// Middleware to protect routes
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const result = AuthService.verifyToken(token);

  if (!result.valid) {
    return res.status(403).json({ error: result.error || 'Invalid or expired token' });
  }

  req.user = {
    id: result.userId!,
    username: result.username!,
    email: result.email!
  };
  next();
}

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

    const { username, email, password } = req.body;

    const result = await AuthService.register(username, email, password);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.status(201).json({
      message: 'Registration successful',
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

    const result = await AuthService.login(usernameOrEmail, password);

    if (!result.success) {
      return res.status(401).json({ error: result.error });
    }

    res.json({
      message: 'Login successful',
      user: result.user,
      token: result.token
    });
  }
);

/**
 * GET /api/auth/me
 * Get current user profile (protected)
 */
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  const user = await AuthService.getUserById(req.user.id);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json({ user });
});

/**
 * POST /api/auth/verify
 * Verify token is still valid
 */
router.post('/verify', authenticateToken, (req: AuthRequest, res: Response) => {
  res.json({ valid: true, user: req.user });
});

export default router;
