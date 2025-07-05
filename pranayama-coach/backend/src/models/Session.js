/**
 * Session Model for Pranayama and Meditation Activities
 * Stores encrypted session data including vital signs and user interactions
 */

const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  // User reference
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  
  // Session basic information
  sessionType: {
    type: String,
    required: true,
    enum: [
      'pranayama',
      'meditation_walk',
      'meditation_stationary',
      'breathing_exercise',
      'stress_relief',
      'sleep_preparation',
      'energy_boost',
      'custom'
    ]
  },
  
  // Pranayama specific data
  pranayama: {
    technique: {
      type: String,
      enum: [
        'nadi_shodhana',     // Alternate nostril breathing
        'box_breathing',     // 4-4-4-4 pattern
        'ujjayi',           // Ocean breath
        'bhramari',         // Bee breath
        'kapalabhati',      // Skull shining breath
        'bhastrika',        // Bellows breath
        'surya_bhedana',    // Right nostril breathing
        'chandra_bhedana',  // Left nostril breathing
        'three_part',       // Three-part breath
        'custom'
      ]
    },
    pattern: {
      inhale: Number,      // seconds
      hold_after_inhale: Number,
      exhale: Number,
      hold_after_exhale: Number,
      ratio: String        // e.g., "4:4:4:4"
    },
    cycles: {
      planned: Number,
      completed: Number
    },
    nostrilPattern: String  // For alternate nostril techniques
  },
  
  // Meditation Zone activity data
  meditation: {
    activityType: {
      type: String,
      enum: [
        'morning_walk',
        'evening_walk',
        'nature_walk',
        'indoor_meditation',
        'stretching',
        'yoga',
        'mindfulness',
        'body_scan',
        'loving_kindness',
        'custom'
      ]
    },
    location: {
      type: { type: String, enum: ['indoor', 'outdoor', 'unknown'], default: 'unknown' },
      gpsData: {
        latitude: Number,
        longitude: Number,
        accuracy: Number
      },
      environment: String  // park, home, office, etc.
    },
    movement: {
      stepCount: Number,
      distance: Number,    // meters
      avgPace: Number,     // minutes per km
      route: [{
        timestamp: Date,
        latitude: Number,
        longitude: Number,
        elevation: Number
      }]
    }
  },
  
  // Session timing
  timing: {
    startTime: { type: Date, required: true },
    endTime: Date,
    plannedDuration: Number,  // seconds
    actualDuration: Number,   // seconds
    pausedDuration: Number,   // seconds
    timeZone: String
  },
  
  // Device and sensor information
  devices: [{
    deviceType: {
      type: String,
      enum: ['phone_camera', 'phone_microphone', 'bluetooth_headset', 'heart_rate_sensor', 'pulse_oximeter', 'other']
    },
    deviceName: String,
    sensorData: {
      connected: Boolean,
      batteryLevel: Number,
      signalQuality: Number,
      calibrated: Boolean,
      lastSync: Date
    }
  }],
  
  // Real-time vital signs data (encrypted)
  vitalSigns: {
    heartRate: [{
      timestamp: Date,
      value: Number,        // BPM
      confidence: Number,   // 0-1
      source: String        // camera_ppg, camera_rppg, ble_sensor
    }],
    
    heartRateVariability: [{
      timestamp: Date,
      rmssd: Number,        // ms
      sdnn: Number,         // ms
      pnn50: Number,        // percentage
      confidence: Number,
      source: String
    }],
    
    oxygenSaturation: [{
      timestamp: Date,
      value: Number,        // percentage
      confidence: Number,
      source: String        // pulse_oximeter, camera_analysis
    }],
    
    breathingRate: [{
      timestamp: Date,
      value: Number,        // breaths per minute
      confidence: Number,
      source: String,       // audio_analysis, camera_motion, manual
      audioQuality: Number  // for headset audio analysis
    }],
    
    stressLevel: [{
      timestamp: Date,
      value: Number,        // 0-100 scale
      factors: {
        hrv: Number,
        heartRate: Number,
        breathing: Number,
        movement: Number
      },
      recommendation: String
    }]
  },
  
  // Audio and coaching data
  audio: {
    coachingUsed: Boolean,
    coachingType: {
      type: String,
      enum: ['voice_guidance', 'breathing_tones', 'nature_sounds', 'music', 'silent']
    },
    backgroundAudio: String,
    volumeLevel: Number,
    adaptiveCoaching: {
      enabled: Boolean,
      adjustments: [{
        timestamp: Date,
        reason: String,      // "high_stress", "breathing_too_fast", etc.
        adjustment: String   // "slower_pace", "calming_voice", etc.
      }]
    },
    breathSoundAnalysis: {
      breathingPatternDetected: String,
      breathingQuality: Number,  // 0-1
      nostrilDominance: String,  // left, right, balanced
      soundPurity: Number        // breath clarity
    }
  },
  
  // User experience and feedback
  userExperience: {
    difficultyRating: { type: Number, min: 1, max: 5 },
    satisfactionRating: { type: Number, min: 1, max: 5 },
    energyLevelBefore: { type: Number, min: 1, max: 10 },
    energyLevelAfter: { type: Number, min: 1, max: 10 },
    stressLevelBefore: { type: Number, min: 1, max: 10 },
    stressLevelAfter: { type: Number, min: 1, max: 10 },
    moodBefore: String,
    moodAfter: String,
    notes: String,
    tags: [String],
    wouldRecommend: Boolean
  },
  
  // Gamification elements
  gamification: {
    pointsEarned: { type: Number, default: 0 },
    achievementsUnlocked: [String],
    streakContribution: Boolean,
    personalBests: [{
      metric: String,      // longest_session, best_hrv, most_consistent
      value: Number,
      previousBest: Number
    }],
    challengeProgress: [{
      challengeId: String,
      progress: Number,
      completed: Boolean
    }]
  },
  
  // Data quality and validation
  dataQuality: {
    overallScore: { type: Number, min: 0, max: 1 },
    issues: [String],
    sensorAccuracy: {
      heartRate: Number,
      breathing: Number,
      movement: Number
    },
    dataCompleteness: Number,  // percentage of planned data collected
    anomaliesDetected: [String]
  },
  
  // Session outcome and recommendations
  outcome: {
    sessionCompleted: { type: Boolean, default: false },
    completionPercentage: Number,
    reasonForIncomplete: String,
    effectiveness: Number,     // calculated effectiveness score
    nextSessionRecommendation: {
      technique: String,
      duration: Number,
      timing: String,
      focus: String
    },
    healthInsights: [String],
    warningsOrConcerns: [String]
  },
  
  // Privacy and compliance
  dataConsent: {
    analyticsConsent: Boolean,
    researchConsent: Boolean,
    sharingConsent: Boolean,
    retentionPeriod: Number    // days
  },
  
  // Metadata
  appVersion: String,
  platform: String,           // ios, android
  sessionVersion: { type: Number, default: 1 },
  encrypted: { type: Boolean, default: true },
  synced: { type: Boolean, default: false },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Indexes for performance
sessionSchema.index({ userId: 1, 'timing.startTime': -1 });
sessionSchema.index({ sessionType: 1, 'timing.startTime': -1 });
sessionSchema.index({ 'outcome.sessionCompleted': 1 });
sessionSchema.index({ 'gamification.achievementsUnlocked': 1 });
sessionSchema.index({ 'timing.startTime': 1 });

// Virtual for session duration
sessionSchema.virtual('duration').get(function() {
  if (this.timing.endTime && this.timing.startTime) {
    return this.timing.endTime - this.timing.startTime;
  }
  return null;
});

// Instance methods
sessionSchema.methods.completeSession = function() {
  this.timing.endTime = new Date();
  this.timing.actualDuration = Math.floor(
    (this.timing.endTime - this.timing.startTime) / 1000
  );
  this.outcome.sessionCompleted = true;
  this.outcome.completionPercentage = 100;
  this.updatedAt = new Date();
  return this.save();
};

sessionSchema.methods.pauseSession = function() {
  if (!this.pausedAt) {
    this.pausedAt = new Date();
  }
  return this.save();
};

sessionSchema.methods.resumeSession = function() {
  if (this.pausedAt) {
    const pauseDuration = new Date() - this.pausedAt;
    this.timing.pausedDuration = (this.timing.pausedDuration || 0) + pauseDuration;
    this.pausedAt = undefined;
  }
  return this.save();
};

sessionSchema.methods.addVitalSign = function(type, data) {
  if (!this.vitalSigns[type]) {
    this.vitalSigns[type] = [];
  }
  
  this.vitalSigns[type].push({
    timestamp: new Date(),
    ...data
  });
  
  this.markModified('vitalSigns');
  return this.save();
};

sessionSchema.methods.calculateEffectiveness = function() {
  let score = 0;
  let factors = 0;
  
  // Completion factor
  if (this.outcome.completionPercentage >= 90) {
    score += 30;
  } else if (this.outcome.completionPercentage >= 70) {
    score += 20;
  } else if (this.outcome.completionPercentage >= 50) {
    score += 10;
  }
  factors++;
  
  // User satisfaction
  if (this.userExperience.satisfactionRating) {
    score += (this.userExperience.satisfactionRating / 5) * 25;
    factors++;
  }
  
  // Stress reduction
  if (this.userExperience.stressLevelBefore && this.userExperience.stressLevelAfter) {
    const reduction = this.userExperience.stressLevelBefore - this.userExperience.stressLevelAfter;
    if (reduction > 0) {
      score += Math.min(reduction * 5, 25);
    }
    factors++;
  }
  
  // Data quality
  if (this.dataQuality.overallScore) {
    score += this.dataQuality.overallScore * 20;
    factors++;
  }
  
  this.outcome.effectiveness = factors > 0 ? Math.round(score / factors) : 0;
  return this.outcome.effectiveness;
};

// Static methods for analytics
sessionSchema.statics.getUserStats = async function(userId, dateRange = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - dateRange);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        'timing.startTime': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: null,
        totalSessions: { $sum: 1 },
        completedSessions: {
          $sum: { $cond: ['$outcome.sessionCompleted', 1, 0] }
        },
        totalDuration: { $sum: '$timing.actualDuration' },
        averageEffectiveness: { $avg: '$outcome.effectiveness' },
        sessionTypes: { $addToSet: '$sessionType' }
      }
    }
  ]);
};

sessionSchema.statics.getTrends = async function(userId, metric, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        'timing.startTime': { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$timing.startTime'
          }
        },
        avgValue: { $avg: `$${metric}` },
        sessionCount: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

module.exports = mongoose.model('Session', sessionSchema);