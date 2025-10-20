import { Request, Response, NextFunction } from 'express';
import { ValidationError } from './errorHandler.js';

/**
 * PROFESSIONAL REQUEST VALIDATION MIDDLEWARE
 *
 * Industry-standard validation for:
 * - Trade requests
 * - Options transactions
 * - Order placement
 * - User input sanitization
 */

// Validate trade request
export const validateTradeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, playerId, type, shares } = req.body;

  // Check required fields
  if (!userId || !playerId || !type || shares === undefined) {
    throw new ValidationError('Missing required fields: userId, playerId, type, shares');
  }

  // Validate trade type
  if (!['BUY', 'SELL'].includes(type)) {
    throw new ValidationError('Invalid trade type. Must be BUY or SELL');
  }

  // Validate shares
  if (typeof shares !== 'number' || shares <= 0 || !Number.isInteger(shares)) {
    throw new ValidationError('Shares must be a positive integer');
  }

  // Validate shares limit
  if (shares > 10000) {
    throw new ValidationError('Maximum 10,000 shares per trade');
  }

  // Sanitize strings
  req.body.userId = String(userId).trim();
  req.body.playerId = String(playerId).trim();
  req.body.type = String(type).toUpperCase();

  next();
};

// Validate limit order request
export const validateLimitOrder = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, playerId, type, shares, limitPrice } = req.body;

  // Check required fields
  if (!userId || !playerId || !type || shares === undefined || limitPrice === undefined) {
    throw new ValidationError('Missing required fields for limit order');
  }

  // Validate trade type
  if (!['BUY', 'SELL'].includes(type)) {
    throw new ValidationError('Invalid order type. Must be BUY or SELL');
  }

  // Validate shares
  if (typeof shares !== 'number' || shares <= 0 || !Number.isInteger(shares)) {
    throw new ValidationError('Shares must be a positive integer');
  }

  // Validate price
  if (typeof limitPrice !== 'number' || limitPrice <= 0) {
    throw new ValidationError('Limit price must be a positive number');
  }

  // Validate price range (prevent extreme values)
  if (limitPrice > 10000 || limitPrice < 0.01) {
    throw new ValidationError('Limit price must be between $0.01 and $10,000');
  }

  next();
};

// Validate options buy request
export const validateOptionsBuy = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, optionId, contracts } = req.body;

  // Check required fields
  if (!userId || !optionId || contracts === undefined) {
    throw new ValidationError('Missing required fields: userId, optionId, contracts');
  }

  // Validate contracts
  if (typeof contracts !== 'number' || contracts <= 0 || !Number.isInteger(contracts)) {
    throw new ValidationError('Contracts must be a positive integer');
  }

  // Validate contracts limit
  if (contracts > 100) {
    throw new ValidationError('Maximum 100 contracts per transaction');
  }

  // Validate option ID format
  if (typeof optionId !== 'string' || !optionId.startsWith('opt_')) {
    throw new ValidationError('Invalid option ID format');
  }

  next();
};

// Validate options exercise request
export const validateOptionsExercise = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { userId, positionId } = req.body;

  // Check required fields
  if (!userId || !positionId) {
    throw new ValidationError('Missing required fields: userId, positionId');
  }

  // Validate position ID format
  if (typeof positionId !== 'string' || !positionId.startsWith('pos_')) {
    throw new ValidationError('Invalid position ID format');
  }

  next();
};

// Validate league creation
export const validateLeagueCreation = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { name, creatorId, startingBalance } = req.body;

  // Check required fields
  if (!name || !creatorId) {
    throw new ValidationError('Missing required fields: name, creatorId');
  }

  // Validate name length
  if (typeof name !== 'string' || name.trim().length < 3 || name.trim().length > 50) {
    throw new ValidationError('League name must be between 3 and 50 characters');
  }

  // Validate starting balance
  if (startingBalance !== undefined) {
    if (typeof startingBalance !== 'number' || startingBalance < 1000 || startingBalance > 10000000) {
      throw new ValidationError('Starting balance must be between $1,000 and $10,000,000');
    }
  }

  // Sanitize name
  req.body.name = String(name).trim();

  next();
};

// General request sanitization
export const sanitizeRequest = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Remove any potentially dangerous characters from query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      if (typeof req.query[key] === 'string') {
        // Basic XSS prevention
        req.query[key] = (req.query[key] as string).replace(/<script>/gi, '').trim();
      }
    });
  }

  next();
};

// Rate limiting helper
interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

const rateLimitStore: RateLimitStore = {};

export const createRateLimiter = (maxRequests: number, windowMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const identifier = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    if (!rateLimitStore[identifier]) {
      rateLimitStore[identifier] = {
        count: 1,
        resetTime: now + windowMs
      };
      return next();
    }

    const record = rateLimitStore[identifier];

    // Reset if window expired
    if (now > record.resetTime) {
      record.count = 1;
      record.resetTime = now + windowMs;
      return next();
    }

    // Check limit
    if (record.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        error: {
          message: 'Too many requests. Please try again later.',
          retryAfter: Math.ceil((record.resetTime - now) / 1000)
        }
      });
    }

    record.count++;
    next();
  };
};

// Cleanup rate limit store periodically
setInterval(() => {
  const now = Date.now();
  Object.keys(rateLimitStore).forEach(key => {
    if (now > rateLimitStore[key].resetTime + 60000) {
      delete rateLimitStore[key];
    }
  });
}, 60000); // Clean every minute
