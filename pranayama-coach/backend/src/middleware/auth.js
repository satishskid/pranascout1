/**
 * Authentication Middleware
 * JWT-based authentication with security features
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.header('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access denied. No valid token provided.',
        code: 'NO_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is blacklisted (optional implementation)
    // const isBlacklisted = await checkTokenBlacklist(token);
    // if (isBlacklisted) {
    //   return res.status(401).json({
    //     error: 'Token has been revoked',
    //     code: 'TOKEN_REVOKED'
    //   });
    // }

    // Fetch user and verify account status
    const user = await User.findById(decoded.userId).select('-password -encryptionKey');
    if (!user) {
      return res.status(401).json({
        error: 'Invalid token. User not found.',
        code: 'USER_NOT_FOUND'
      });
    }

    // Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account is deactivated.',
        code: 'ACCOUNT_DEACTIVATED'
      });
    }

    // Check if account is locked
    if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
      return res.status(423).json({
        error: 'Account is temporarily locked.',
        code: 'ACCOUNT_LOCKED',
        lockedUntil: user.security.lockedUntil
      });
    }

    // Check if password was changed after token was issued
    const tokenIssuedAt = new Date(decoded.iat * 1000);
    if (user.security.passwordChangedAt && user.security.passwordChangedAt > tokenIssuedAt) {
      return res.status(401).json({
        error: 'Token invalid due to password change. Please login again.',
        code: 'PASSWORD_CHANGED'
      });
    }

    // Update last active timestamp
    user.updateLastActive();

    // Attach user to request object
    req.user = user;
    req.tokenIat = decoded.iat;

    next();
  } catch (error) {
    console.error('Authentication error:', error);

    // Handle specific JWT errors
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token format.',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token has expired.',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'NotBeforeError') {
      return res.status(401).json({
        error: 'Token not yet valid.',
        code: 'TOKEN_NOT_ACTIVE'
      });
    }

    // Generic error response
    res.status(500).json({
      error: 'Authentication service error.',
      code: 'AUTH_SERVICE_ERROR'
    });
  }
};

/**
 * Optional middleware for checking specific permissions/roles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userRole = req.user.role || 'user';
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        error: 'Insufficient permissions.',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: roles,
        current: userRole
      });
    }

    next();
  };
};

/**
 * Optional middleware for checking subscription level
 */
const requireSubscription = (requiredPlans) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required.',
        code: 'NOT_AUTHENTICATED'
      });
    }

    const userPlan = req.user.subscription.plan;
    if (!requiredPlans.includes(userPlan)) {
      return res.status(402).json({
        error: 'Subscription upgrade required.',
        code: 'SUBSCRIPTION_REQUIRED',
        required: requiredPlans,
        current: userPlan
      });
    }

    // Check if subscription is still valid
    if (req.user.subscription.expiresAt && req.user.subscription.expiresAt < new Date()) {
      return res.status(402).json({
        error: 'Subscription has expired.',
        code: 'SUBSCRIPTION_EXPIRED',
        expiredAt: req.user.subscription.expiresAt
      });
    }

    next();
  };
};

/**
 * Rate limiting middleware for sensitive operations
 */
const rateLimitSensitive = (maxAttempts = 5, windowMinutes = 15) => {
  const attempts = new Map();

  return (req, res, next) => {
    const key = `${req.user.id}:${req.route.path}`;
    const now = Date.now();
    const windowMs = windowMinutes * 60 * 1000;

    // Clean up old entries
    for (const [k, v] of attempts.entries()) {
      if (now - v.timestamp > windowMs) {
        attempts.delete(k);
      }
    }

    // Check current attempts
    const userAttempts = attempts.get(key) || { count: 0, timestamp: now };
    
    if (userAttempts.count >= maxAttempts) {
      const resetTime = new Date(userAttempts.timestamp + windowMs);
      return res.status(429).json({
        error: 'Too many attempts. Please try again later.',
        code: 'RATE_LIMITED',
        resetTime: resetTime,
        attemptsRemaining: 0
      });
    }

    // Increment attempts
    attempts.set(key, {
      count: userAttempts.count + 1,
      timestamp: userAttempts.timestamp
    });

    next();
  };
};

/**
 * Middleware to validate session ownership
 */
const validateSessionOwnership = async (req, res, next) => {
  try {
    const sessionId = req.params.sessionId || req.body.sessionId;
    if (!sessionId) {
      return res.status(400).json({
        error: 'Session ID is required.',
        code: 'MISSING_SESSION_ID'
      });
    }

    const Session = require('../models/Session');
    const session = await Session.findById(sessionId);
    
    if (!session) {
      return res.status(404).json({
        error: 'Session not found.',
        code: 'SESSION_NOT_FOUND'
      });
    }

    if (session.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        error: 'Access denied. Session belongs to another user.',
        code: 'SESSION_ACCESS_DENIED'
      });
    }

    req.session = session;
    next();
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      error: 'Session validation failed.',
      code: 'SESSION_VALIDATION_ERROR'
    });
  }
};

module.exports = {
  authMiddleware,
  requireRole,
  requireSubscription,
  rateLimitSensitive,
  validateSessionOwnership
};