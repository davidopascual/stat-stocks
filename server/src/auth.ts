import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { supabase } from './supabase.js';

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

// No longer using in-memory storage - all data is in Supabase
// However, we'll use a hybrid approach for resilience

// Temporary in-memory fallback if Supabase isn't ready
const inMemoryUsers = new Map<string, any>();

// Check if Supabase is available
let useSupabase = true;

async function checkSupabaseConnection() {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error && error.message.includes('Invalid API key')) {
      console.warn('⚠️  Supabase not configured - using in-memory storage');
      useSupabase = false;
    }
  } catch (err) {
    console.warn('⚠️  Supabase connection failed - using in-memory storage');
    useSupabase = false;
  }
}

// Check connection on startup
checkSupabaseConnection();

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
  if (useSupabase) {
    // Check in Supabase
    const { data: existingByUsername } = await supabase
      .from('users')
      .select('username')
      .eq('username', username)
      .single();

    if (existingByUsername) {
      return { success: false, message: 'Username already taken' };
    }

    const { data: existingByEmail } = await supabase
      .from('users')
      .select('email')
      .eq('email', email.toLowerCase())
      .single();

    if (existingByEmail) {
      return { success: false, message: 'Email already registered' };
    }
  } else {
    // Check in-memory
    for (const user of inMemoryUsers.values()) {
      if (user.username.toLowerCase() === username.toLowerCase()) {
        return { success: false, message: 'Username already taken' };
      }
      if (user.email.toLowerCase() === email.toLowerCase()) {
        return { success: false, message: 'Email already registered' };
      }
    }
  }

  // Create user
  const userId = Date.now().toString();
  const passwordHash = await hashPassword(password);

  const newUser = {
    id: userId,
    username,
    email: email.toLowerCase(),
    password_hash: passwordHash,
    display_name: displayName || username,
    cash: 10000, // Starting balance
    starting_balance: 10000,
    league_ids: [],
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString()
  };

  if (useSupabase) {
    // Store in Supabase
    const { data: insertedUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (insertError || !insertedUser) {
      console.error('Error inserting user:', insertError);
      console.error('User data attempted:', newUser);
      // Fall back to in-memory
      console.warn('⚠️  Falling back to in-memory storage for this user');
      inMemoryUsers.set(userId, newUser);
    }
  } else {
    // Store in-memory
    inMemoryUsers.set(userId, newUser);
  }

  // Generate token
  const token = generateToken(userId, username, email);

  // Return user without password
  const userResponse = {
    id: userId,
    username: username,
    email: email.toLowerCase(),
    displayName: displayName || username,
    createdAt: new Date(),
    lastLogin: new Date()
  };

  return {
    success: true,
    message: 'Registration successful',
    user: userResponse,
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
  let foundUser: any = null;

  if (useSupabase) {
    // Try to find user by username first in Supabase
    let { data, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('username', usernameOrEmail)
      .single();

    // If not found by username, try by email
    if (!data || fetchError) {
      const result = await supabase
        .from('users')
        .select('*')
        .eq('email', usernameOrEmail.toLowerCase())
        .single();
      
      data = result.data;
    }

    foundUser = data;
  }
  
  // If not found in Supabase or not using Supabase, check in-memory
  if (!foundUser) {
    for (const user of inMemoryUsers.values()) {
      if (
        user.username.toLowerCase() === usernameOrEmail.toLowerCase() ||
        user.email.toLowerCase() === usernameOrEmail.toLowerCase()
      ) {
        foundUser = user;
        break;
      }
    }
  }

  if (!foundUser) {
    return { success: false, message: 'Invalid credentials' };
  }

  // Verify password
  const isValidPassword = await comparePassword(password, foundUser.password_hash);

  if (!isValidPassword) {
    return { success: false, message: 'Invalid credentials' };
  }

  // Update last login
  foundUser.last_login = new Date().toISOString();
  
  if (useSupabase) {
    await supabase
      .from('users')
      .update({ last_login: foundUser.last_login })
      .eq('id', foundUser.id);
  }

  // Generate token
  const token = generateToken(foundUser.id, foundUser.username, foundUser.email);

  // Return user without password
  const userResponse = {
    id: foundUser.id,
    username: foundUser.username,
    email: foundUser.email,
    displayName: foundUser.display_name,
    createdAt: new Date(foundUser.created_at),
    lastLogin: new Date()
  };

  return {
    success: true,
    message: 'Login successful',
    user: userResponse,
    token
  };
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<Omit<User, 'passwordHash'> | null> {
  let user: any = null;

  if (useSupabase) {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    user = data;
  }

  // Check in-memory if not found
  if (!user) {
    user = inMemoryUsers.get(userId);
  }

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    avatar: user.avatar,
    createdAt: new Date(user.created_at || user.createdAt),
    lastLogin: new Date(user.last_login || user.lastLogin)
  } as Omit<User, 'passwordHash'>;
}

// Export the in-memory users for use by other services
export function getInMemoryUsers(): Map<string, any> {
  return inMemoryUsers;
}

export function isUsingSupabase(): boolean {
  return useSupabase;
}

/**
 * Get all users (admin)
 */
export async function getAllUsers(): Promise<Omit<User, 'passwordHash'>[]> {
  const { data: users, error } = await supabase
    .from('users')
    .select('*');

  if (error || !users) {
    console.error('Error fetching all users:', error);
    return [];
  }

  return users.map(user => ({
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    avatar: user.avatar,
    createdAt: new Date(user.created_at),
    lastLogin: new Date(user.last_login)
  } as Omit<User, 'passwordHash'>));
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: { displayName?: string; avatar?: string }
): Promise<{ success: boolean; message: string; user?: Omit<User, 'passwordHash'> }> {
  const updateData: Record<string, string> = {};
  
  if (updates.displayName) {
    updateData.display_name = updates.displayName;
  }

  if (updates.avatar) {
    updateData.avatar = updates.avatar;
  }

  const { data: user, error } = await supabase
    .from('users')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error || !user) {
    console.error('Error updating user profile:', error);
    return { success: false, message: 'User not found' };
  }

  const userResponse = {
    id: user.id,
    username: user.username,
    email: user.email,
    displayName: user.display_name,
    avatar: user.avatar,
    createdAt: new Date(user.created_at),
    lastLogin: new Date(user.last_login)
  } as Omit<User, 'passwordHash'>;

  return {
    success: true,
    message: 'Profile updated',
    user: userResponse
  };
}

/**
 * Export users map for database migration (deprecated - now using Supabase)
 */
export async function getUsersMap(): Promise<Map<string, User>> {
  console.warn('getUsersMap is deprecated - data is now in Supabase');
  return new Map();
}
