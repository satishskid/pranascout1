/**
 * Authentication Routes
 * Secure user authentication with comprehensive security features
 */

const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');

const User = require('../models/User');
const { generateEncryptionKey } = require('../middleware/encryption');

const router = express.Router();

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    error: 'Too many authentication attempts, please try again later.',
    code: 'AUTH_RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const strictAuthLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // limit each IP to 3 requests per hour for sensitive operations
  message: {
    error: 'Too many attempts, please try again in an hour.',
    code: 'STRICT_RATE_LIMITED'
  }
});

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', 
  authLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
    body('firstName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('First name is required and must be less than 50 characters'),
    body('lastName')
      .trim()
      .isLength({ min: 1, max: 50 })
      .withMessage('Last name is required and must be less than 50 characters'),
    body('acceptTerms')
      .equals('true')
      .withMessage('Terms and conditions must be accepted'),
    body('acceptPrivacy')
      .equals('true')
      .withMessage('Privacy policy must be accepted')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { email, password, firstName, lastName, dateOfBirth, acceptTerms, acceptPrivacy } = req.body;

      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        return res.status(409).json({
          error: 'User already exists with this email address',
          code: 'USER_EXISTS'
        });
      }

      // Generate encryption key for PHI data
      const encryptionKey = generateEncryptionKey();

      // Create new user
      const user = new User({
        email: email.toLowerCase(),
        password,
        profile: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined
        },
        preferences: {
          privacy: {
            consentVersion: '1.0',
            consentDate: new Date(),
            dataSharing: false,
            analyticsOptIn: false
          }
        },
        encryptionKey,
        security: {
          emailVerificationToken: crypto.randomBytes(32).toString('hex'),
          emailVerified: false
        }
      });

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user._id,
          email: user.email,
          role: 'user'
        },
        process.env.JWT_SECRET,
        { 
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
          issuer: 'pranayama-coach',
          audience: 'mobile-app'
        }
      );

      // Send verification email (implement email service)
      // await sendVerificationEmail(user.email, user.security.emailVerificationToken);

      res.status(201).json({
        message: 'User registered successfully',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          emailVerified: user.security.emailVerified,
          createdAt: user.createdAt
        },
        token,
        expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)) // 7 days
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
        code: 'REGISTRATION_ERROR'
      });
    }
  }
);

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user and return token
 * @access  Public
 */
router.post('/login',
  authLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required'),
    body('password')
      .notEmpty()
      .withMessage('Password is required')
  ],
  async (req, res) => {
    try {
      // Check validation errors
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { email, password, deviceInfo } = req.body;

      // Find user by email
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS'
        });
      }

      // Check if account is locked
      if (user.security.lockedUntil && user.security.lockedUntil > new Date()) {
        return res.status(423).json({
          error: 'Account is temporarily locked due to failed login attempts',
          code: 'ACCOUNT_LOCKED',
          lockedUntil: user.security.lockedUntil
        });
      }

      // Verify password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Increment failed login attempts
        user.security.loginAttempts = (user.security.loginAttempts || 0) + 1;
        
        // Lock account after 5 failed attempts
        if (user.security.loginAttempts >= 5) {
          user.security.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // Lock for 30 minutes
        }
        
        await user.save();

        return res.status(401).json({
          error: 'Invalid email or password',
          code: 'INVALID_CREDENTIALS',
          attemptsRemaining: Math.max(0, 5 - user.security.loginAttempts)
        });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(401).json({
          error: 'Account is deactivated',
          code: 'ACCOUNT_DEACTIVATED'
        });
      }

      // Reset failed login attempts on successful login
      user.security.loginAttempts = 0;
      user.security.lockedUntil = undefined;
      user.security.lastLogin = new Date();
      
      // Update last active timestamp
      user.lastActiveAt = new Date();

      await user.save();

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role || 'user',
          subscription: user.subscription.plan
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
          issuer: 'pranayama-coach',
          audience: 'mobile-app'
        }
      );

      // Log successful login
      console.log(`User ${user.email} logged in successfully`, {
        userId: user._id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date()
      });

      res.json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          firstName: user.profile.firstName,
          lastName: user.profile.lastName,
          emailVerified: user.security.emailVerified,
          subscription: user.subscription,
          preferences: user.preferences,
          lastLogin: user.security.lastLogin
        },
        token,
        expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
        code: 'LOGIN_ERROR'
      });
    }
  }
);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email
 * @access  Public
 */
router.post('/forgot-password',
  strictAuthLimiter,
  [
    body('email')
      .isEmail()
      .normalizeEmail()
      .withMessage('Valid email is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Valid email is required',
          code: 'VALIDATION_ERROR'
        });
      }

      const { email } = req.body;

      // Find user (always return success to prevent email enumeration)
      const user = await User.findOne({ email: email.toLowerCase() });
      
      if (user) {
        // Generate password reset token
        const resetToken = user.generatePasswordResetToken();
        await user.save();

        // Send password reset email (implement email service)
        // await sendPasswordResetEmail(user.email, resetToken);

        console.log(`Password reset requested for ${email}`, {
          userId: user._id,
          resetToken, // Log for development - remove in production
          ip: req.ip,
          timestamp: new Date()
        });
      }

      // Always return success to prevent email enumeration
      res.json({
        message: 'If an account with that email exists, a password reset link has been sent',
        code: 'RESET_EMAIL_SENT'
      });

    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({
        error: 'Password reset request failed',
        code: 'RESET_REQUEST_ERROR'
      });
    }
  }
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password using token
 * @access  Public
 */
router.post('/reset-password',
  strictAuthLimiter,
  [
    body('token')
      .notEmpty()
      .withMessage('Reset token is required'),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters long')
      .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: errors.array()
        });
      }

      const { token, password } = req.body;

      // Hash the token to match stored version
      const hashedToken = crypto
        .createHash('sha256')
        .update(token)
        .digest('hex');

      // Find user with valid reset token
      const user = await User.findOne({
        'security.passwordResetToken': hashedToken,
        'security.passwordResetExpires': { $gt: Date.now() }
      });

      if (!user) {
        return res.status(400).json({
          error: 'Invalid or expired reset token',
          code: 'INVALID_RESET_TOKEN'
        });
      }

      // Update password
      user.password = password;
      user.security.passwordResetToken = undefined;
      user.security.passwordResetExpires = undefined;
      user.security.passwordChangedAt = new Date();
      
      // Reset login attempts and unlock account
      user.security.loginAttempts = 0;
      user.security.lockedUntil = undefined;

      await user.save();

      console.log(`Password reset successful for user ${user.email}`, {
        userId: user._id,
        ip: req.ip,
        timestamp: new Date()
      });

      res.json({
        message: 'Password reset successful',
        code: 'PASSWORD_RESET_SUCCESS'
      });

    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({
        error: 'Password reset failed',
        code: 'PASSWORD_RESET_ERROR'
      });
    }
  }
);

/**
 * @route   POST /api/auth/verify-email
 * @desc    Verify email address
 * @access  Public
 */
router.post('/verify-email',
  [
    body('token')
      .notEmpty()
      .withMessage('Verification token is required')
  ],
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          error: 'Verification token is required',
          code: 'VALIDATION_ERROR'
        });
      }

      const { token } = req.body;

      // Find user with verification token
      const user = await User.findOne({
        'security.emailVerificationToken': token
      });

      if (!user) {
        return res.status(400).json({
          error: 'Invalid verification token',
          code: 'INVALID_VERIFICATION_TOKEN'
        });
      }

      if (user.security.emailVerified) {
        return res.status(400).json({
          error: 'Email is already verified',
          code: 'EMAIL_ALREADY_VERIFIED'
        });
      }

      // Verify email
      user.security.emailVerified = true;
      user.security.emailVerificationToken = undefined;
      await user.save();

      res.json({
        message: 'Email verified successfully',
        code: 'EMAIL_VERIFIED'
      });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({
        error: 'Email verification failed',
        code: 'VERIFICATION_ERROR'
      });
    }
  }
);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh-token',
  async (req, res) => {
    try {
      const authHeader = req.header('Authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          error: 'No token provided',
          code: 'NO_TOKEN'
        });
      }

      const token = authHeader.substring(7);

      // Verify existing token (even if expired)
      const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });

      // Find user
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          error: 'Invalid user',
          code: 'INVALID_USER'
        });
      }

      // Check if token was issued before password change
      const tokenIssuedAt = new Date(decoded.iat * 1000);
      if (user.security.passwordChangedAt && user.security.passwordChangedAt > tokenIssuedAt) {
        return res.status(401).json({
          error: 'Token invalid due to password change',
          code: 'PASSWORD_CHANGED'
        });
      }

      // Generate new token
      const newToken = jwt.sign(
        {
          userId: user._id,
          email: user.email,
          role: user.role || 'user',
          subscription: user.subscription.plan
        },
        process.env.JWT_SECRET,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
          issuer: 'pranayama-coach',
          audience: 'mobile-app'
        }
      );

      res.json({
        token: newToken,
        expiresAt: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000))
      });

    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(401).json({
        error: 'Token refresh failed',
        code: 'TOKEN_REFRESH_ERROR'
      });
    }
  }
);

module.exports = router;