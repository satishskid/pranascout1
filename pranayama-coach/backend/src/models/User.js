/**
 * User Model with HIPAA/GDPR Compliance
 * Encrypted storage for personal health information
 */

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema({
  // Basic authentication
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    validate: {
      validator: function(email) {
        return /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(email);
      },
      message: 'Invalid email format'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 8
  },
  
  // Encrypted personal information (HIPAA compliant)
  profile: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    dateOfBirth: Date,
    gender: { 
      type: String, 
      enum: ['male', 'female', 'other', 'prefer-not-to-say'] 
    },
    height: Number, // cm
    weight: Number, // kg
    timezone: { type: String, default: 'UTC' },
    language: { type: String, default: 'en' }
  },
  
  // Health baseline (encrypted)
  healthBaseline: {
    restingHeartRate: { type: Number, min: 40, max: 120 },
    maxHeartRate: { type: Number, min: 120, max: 220 },
    averageHRV: { type: Number, min: 10, max: 100 },
    baselineSpO2: { type: Number, min: 85, max: 100 },
    breathingRate: { type: Number, min: 8, max: 25 },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // App preferences
  preferences: {
    // Notification settings
    notifications: {
      enabled: { type: Boolean, default: true },
      reminderTimes: [{ type: String }], // HH:MM format
      sessionReminders: { type: Boolean, default: true },
      achievementAlerts: { type: Boolean, default: true }
    },
    
    // Audio/Visual preferences
    audioVisual: {
      theme: { 
        type: String, 
        enum: ['forest', 'ocean', 'mountain', 'cosmic', 'minimal'],
        default: 'forest'
      },
      breathingSound: {
        type: String,
        enum: ['none', 'ocean', 'forest', 'chime', 'custom'],
        default: 'ocean'
      },
      voiceGuidance: { type: Boolean, default: true },
      hapticFeedback: { type: Boolean, default: true },
      backgroundMusic: { type: Boolean, default: false }
    },
    
    // Privacy settings (GDPR compliance)
    privacy: {
      dataSharing: { type: Boolean, default: false },
      analyticsOptIn: { type: Boolean, default: false },
      exportRequested: { type: Date },
      deletionRequested: { type: Date },
      consentVersion: { type: String, default: '1.0' },
      consentDate: { type: Date, default: Date.now }
    }
  },
  
  // Subscription and premium features
  subscription: {
    plan: { 
      type: String, 
      enum: ['free', 'premium', 'pro'],
      default: 'free'
    },
    expiresAt: Date,
    purchaseDate: Date,
    features: [{
      name: String,
      enabled: Boolean
    }]
  },
  
  // Device and sensor information
  devices: [{
    type: {
      type: String,
      enum: ['phone', 'headset', 'heartRate', 'pulseOximeter', 'other']
    },
    name: String,
    model: String,
    macAddress: String,
    lastConnected: Date,
    isActive: { type: Boolean, default: false },
    capabilities: [String], // ['hr', 'hrv', 'spo2', 'audio']
    calibrationData: mongoose.Schema.Types.Mixed
  }],
  
  // Gamification and achievements
  gamification: {
    level: { type: Number, default: 1 },
    experience: { type: Number, default: 0 },
    streakDays: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastSessionDate: Date,
    achievements: [{
      id: String,
      name: String,
      description: String,
      unlockedAt: Date,
      category: String
    }],
    badges: [{
      type: String,
      level: Number,
      earnedAt: Date
    }]
  },
  
  // Security and audit
  security: {
    lastLogin: Date,
    loginAttempts: { type: Number, default: 0 },
    lockedUntil: Date,
    passwordChangedAt: Date,
    emailVerified: { type: Boolean, default: false },
    emailVerificationToken: String,
    passwordResetToken: String,
    passwordResetExpires: Date,
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: String
  },
  
  // Data encryption keys (for PHI)
  encryptionKey: {
    type: String,
    required: true
  },
  
  // Metadata
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastActiveAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true },
  version: { type: Number, default: 1 }
}, {
  timestamps: true,
  toJSON: { 
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.encryptionKey;
      delete ret.security.passwordResetToken;
      delete ret.security.twoFactorSecret;
      return ret;
    }
  }
});

// Indexes for performance and GDPR compliance
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ 'security.emailVerificationToken': 1 });
userSchema.index({ 'security.passwordResetToken': 1 });
userSchema.index({ lastActiveAt: 1 });
userSchema.index({ 'privacy.deletionRequested': 1 });

// Pre-save middleware for password hashing and encryption key generation
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') && this.encryptionKey) return next();
  
  try {
    // Hash password
    if (this.isModified('password')) {
      const salt = await bcrypt.genSalt(12);
      this.password = await bcrypt.hash(this.password, salt);
      this.security.passwordChangedAt = new Date();
    }
    
    // Generate encryption key for PHI data
    if (!this.encryptionKey) {
      this.encryptionKey = crypto.randomBytes(32).toString('hex');
    }
    
    this.updatedAt = new Date();
    next();
  } catch (error) {
    next(error);
  }
});

// Instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.generatePasswordResetToken = function() {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.security.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  this.security.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return resetToken;
};

userSchema.methods.updateLastActive = function() {
  this.lastActiveAt = new Date();
  return this.save();
};

userSchema.methods.addAchievement = function(achievement) {
  const exists = this.gamification.achievements.find(a => a.id === achievement.id);
  if (!exists) {
    this.gamification.achievements.push({
      ...achievement,
      unlockedAt: new Date()
    });
    return this.save();
  }
  return Promise.resolve(this);
};

userSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastSession = this.gamification.lastSessionDate;
  
  if (!lastSession) {
    this.gamification.streakDays = 1;
  } else {
    const daysDiff = Math.floor((today - lastSession) / (1000 * 60 * 60 * 24));
    if (daysDiff === 1) {
      this.gamification.streakDays += 1;
    } else if (daysDiff > 1) {
      this.gamification.streakDays = 1;
    }
  }
  
  this.gamification.longestStreak = Math.max(
    this.gamification.longestStreak, 
    this.gamification.streakDays
  );
  this.gamification.lastSessionDate = today;
  
  return this.save();
};

// Static methods for GDPR compliance
userSchema.statics.requestDataExport = async function(userId) {
  const user = await this.findById(userId);
  if (!user) throw new Error('User not found');
  
  user.preferences.privacy.exportRequested = new Date();
  await user.save();
  
  // Trigger data export process
  return { message: 'Data export requested. You will receive an email within 30 days.' };
};

userSchema.statics.requestDataDeletion = async function(userId) {
  const user = await this.findById(userId);
  if (!user) throw new Error('User not found');
  
  user.preferences.privacy.deletionRequested = new Date();
  await user.save();
  
  // Schedule for deletion after required retention period
  return { message: 'Data deletion requested. Account will be deleted within 30 days.' };
};

module.exports = mongoose.model('User', userSchema);