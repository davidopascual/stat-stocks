import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

// JWT Secret - In production, use environment variable
const JWT_SECRET = process.env.JWT_SECRET || 'nba-stock-market-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7 days

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  displayName: string;
  avatar?: string;
  createdAt: Date;
  lastLogin: Date;
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string;
  };
}

// In-memory user storage (will be replaced with database)
const users = new Map<string, User>();

/**
 * Hash password with bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare password with hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * Generate JWT token
 */
export function generateToken(userId: string, username: string, email: string): string {
  return jwt.sign(
    { id: userId, username, email },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify JWT token
 */
export function verifyToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to protect routes
 */
export function authenticateToken(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

/**
 * Register new user
 */
export async function registerUser(
  username: string,
  email: string,
  password: string,
  displayName: string
): Promise<{ success: boolean; message: string; user?: Omit<User, 'passwordHash'>; token?: string }> {
  // Validate input
  if (!username || username.length < 3) {
    return { success: false, message: 'Username must be at least 3 characters' };
  }

  if (!email || !email.includes('@')) {
    return { success: false, message: 'Valid email required' };
  }

  if (!password || password.length < 6) {
    return { success: false, message: 'Password must be at least 6 characters' };
  }

  // Check if username or email already exists
  for (const user of users.values()) {
    if (user.username.toLowerCase() === username.toLowerCase()) {
      return { success: false, message: 'Username already taken' };
    }
    if (user.email.toLowerCase() === email.toLowerCase()) {
      return { success: false, message: 'Email already registered' };
    }
  }

  // Create user
  const userId = Date.now().toString();
  const passwordHash = await hashPassword(password);

  const user: User = {
    id: userId,
    username,
    email: email.toLowerCase(),
    passwordHash,
    displayName: displayName || username,
    createdAt: new Date(),
    lastLogin: new Date()
  };

  users.set(userId, user);

  // Generate token
  const token = generateToken(userId, username, email);

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    success: true,
    message: 'Registration successful',
    user: userWithoutPassword,
    token
  };
}

/**
 * Login user
 */
export async function loginUser(
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; message: string; user?: Omit<User, 'passwordHash'>; token?: string }> {
  // Find user by username or email
  let foundUser: User | undefined;

  for (const user of users.values()) {
    if (
      user.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
      user.email.toLowerCase() === usernameOrEmail.toLowerCase()
    ) {
      foundUser = user;
      break;
    }
  }

  if (!foundUser) {
    return { success: false, message: 'Invalid credentials' };
  }

  // Verify password
  const isValidPassword = await comparePassword(password, foundUser.passwordHash);

  if (!isValidPassword) {
    return { success: false, message: 'Invalid credentials' };
  }

  // Update last login
  foundUser.lastLogin = new Date();

  // Generate token
  const token = generateToken(foundUser.id, foundUser.username, foundUser.email);

  // Return user without password
  const { passwordHash: _, ...userWithoutPassword } = foundUser;

  return {
    success: true,
    message: 'Login successful',
    user: userWithoutPassword,
    token
  };
}

/**
 * Get user by ID
 */
export function getUserById(userId: string): Omit<User, 'passwordHash'> | null {
  const user = users.get(userId);
  if (!user) return null;

  const { passwordHash: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

/**
 * Get all users (admin)
 */
export function getAllUsers(): Omit<User, 'passwordHash'>[] {
  return Array.from(users.values()).map(user => {
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  });
}

/**
 * Update user profile
 */
export function updateUserProfile(
  userId: string,
  updates: { displayName?: string; avatar?: string }
): { success: boolean; message: string; user?: Omit<User, 'passwordHash'> } {
  const user = users.get(userId);

  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (updates.displayName) {
    user.displayName = updates.displayName;
  }

  if (updates.avatar) {
    user.avatar = updates.avatar;
  }

  const { passwordHash: _, ...userWithoutPassword } = user;

  return {
    success: true,
    message: 'Profile updated',
    user: userWithoutPassword
  };
}

/**
 * Export users map for database migration
 */
export function getUsersMap(): Map<string, User> {
  return users;
}
