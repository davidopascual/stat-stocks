import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from './supabase.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nba-stocks-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  username: string;
  email: string;
}

export class AuthService {
  // Register new user
  static async register(username: string, email: string, password: string): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
    try {
      // Validate input
      if (!username || !email || !password) {
        return { success: false, error: 'All fields are required' };
      }

      if (password.length < 6) {
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      console.log('🔍 Checking for existing user:', email);

      // Check if user already exists
      const existingEmail = await db.getUserByEmail(email);
      if (existingEmail) {
        return { success: false, error: 'Email already registered' };
      }

      const existingUsername = await db.getUserByUsername(username);
      if (existingUsername) {
        return { success: false, error: 'Username already taken' };
      }

      console.log('🔐 Hashing password...');

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('💾 Creating user in database:', userId);

      // Create user in database
      await db.createUser(userId, username, email, passwordHash, 100000);

      console.log('✅ User created successfully');

      // Generate JWT token
      const token = jwt.sign({ userId, username, email }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

      const user: AuthUser = { id: userId, username, email };

      return { success: true, user, token };
    } catch (error: any) {
      console.error('Registration error:', {
        message: error.message,
        details: error.stack,
        hint: error.hint || '',
        code: error.code || ''
      });
      return { success: false, error: 'Registration failed' };
    }
  }

  // Login user (supports both email and username)
  static async login(emailOrUsername: string, password: string): Promise<{ success: boolean; user?: AuthUser; token?: string; error?: string }> {
    try {
      // Validate input
      if (!emailOrUsername || !password) {
        return { success: false, error: 'Email/username and password are required' };
      }

      // Try to get user by email first, then by username
      let dbUser: any = null;
      
      if (emailOrUsername.includes('@')) {
        // If it contains @, treat as email
        dbUser = await db.getUserByEmail(emailOrUsername);
      } else {
        // Otherwise, try as username
        dbUser = await db.getUserByUsername(emailOrUsername);
      }
      
      // If still not found and input doesn't have @, try as email too (in case they entered email without @)
      if (!dbUser && !emailOrUsername.includes('@')) {
        dbUser = await db.getUserByEmail(emailOrUsername);
      }
      
      if (!dbUser) {
        return { success: false, error: 'Invalid email/username or password' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, dbUser.password_hash);
      if (!isValidPassword) {
        return { success: false, error: 'Invalid email/username or password' };
      }

      // Update last login
      await db.updateUserLastLogin(dbUser.id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: dbUser.id, username: dbUser.username, email: dbUser.email },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      const user: AuthUser = {
        id: dbUser.id,
        username: dbUser.username,
        email: dbUser.email
      };

      return { success: true, user, token };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Login failed' };
    }
  }

  // Verify JWT token
  static verifyToken(token: string): { valid: boolean; userId?: string; username?: string; email?: string; error?: string } {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      return {
        valid: true,
        userId: decoded.userId,
        username: decoded.username,
        email: decoded.email
      };
    } catch (error) {
      return { valid: false, error: 'Invalid or expired token' };
    }
  }

  // Get user by ID
  static async getUserById(userId: string): Promise<AuthUser | null> {
    const dbUser: any = await db.getUserById(userId);
    if (!dbUser) return null;

    return {
      id: dbUser.id,
      username: dbUser.username,
      email: dbUser.email
    };
  }
}
