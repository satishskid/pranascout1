/**
 * VitalSigns Model for Detailed Health Metrics
 * High-frequency data storage with compression and analytics
 */

const mongoose = require('mongoose');

const vitalSignsSchema = new mongoose.Schema({
  // References
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  sessionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Session',
    required: true,
    index: true
  },
  
  // Time window for this batch of data
  timeWindow: {
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    duration: Number,  // seconds
    sampleRate: Number // Hz
  },
  
  // Data source information
  dataSource: {
    primary: {
      type: String,
      enum: ['camera_ppg', 'camera_rppg', 'ble_heart_rate', 'ble_pulse_oximeter', 'audio_microphone', 'phone_sensors'],
      required: true
    },
    device: {
      name: String,
      model: String,
      version: String,
      batteryLevel: Number,
      signalQuality: Number
    },
    calibration: {
      calibrated: Boolean,
      calibrationTime: Date,
      calibrationFactors: mongoose.Schema.Types.Mixed
    }
  },
  
  // Heart Rate Data
  heartRate: {
    measurements: [{
      timestamp: Date,
      bpm: { type: Number, min: 30, max: 250 },
      confidence: { type: Number, min: 0, max: 1 },
      quality: { type: Number, min: 0, max: 1 },
      rr_intervals: [Number], // R-R intervals in ms for HRV calculation
      signal_strength: Number,
      noise_level: Number
    }],
    statistics: {
      min: Number,
      max: Number,
      mean: Number,
      median: Number,
      stdDev: Number,
      trend: String, // increasing, decreasing, stable
      anomalies: [String]
    },
    processing: {
      algorithm: String, // ppg_peak_detection, rppg_cnn, ble_standard
      filterApplied: String,
      artifactRemoval: Boolean,
      smoothingFactor: Number
    }
  },
  
  // Heart Rate Variability (HRV)
  heartRateVariability: {
    measurements: [{
      timestamp: Date,
      rmssd: Number,    // Root Mean Square of Successive Differences (ms)
      sdnn: Number,     // Standard Deviation of NN intervals (ms)
      pnn50: Number,    // Percentage of NN50 divided by total number of NNs
      triangular_index: Number,
      stress_index: Number,
      confidence: { type: Number, min: 0, max: 1 }
    }],
    frequency_domain: {
      vlf_power: Number,    // Very Low Frequency (0.0033-0.04 Hz)
      lf_power: Number,     // Low Frequency (0.04-0.15 Hz)
      hf_power: Number,     // High Frequency (0.15-0.4 Hz)
      lf_hf_ratio: Number,  // Sympathetic/Parasympathetic balance
      total_power: Number
    },
    interpretation: {
      autonomic_balance: String, // sympathetic_dominant, parasympathetic_dominant, balanced
      stress_level: { type: Number, min: 0, max: 100 },
      recovery_status: String,   // poor, fair, good, excellent
      recommendations: [String]
    }
  },
  
  // Oxygen Saturation (SpO2)
  oxygenSaturation: {
    measurements: [{
      timestamp: Date,
      spo2: { type: Number, min: 70, max: 100 },
      pulse_strength: Number,
      perfusion_index: Number,
      confidence: { type: Number, min: 0, max: 1 },
      motion_artifact: Boolean
    }],
    statistics: {
      min: Number,
      max: Number,
      mean: Number,
      below_95_duration: Number, // seconds below 95%
      desaturation_events: Number
    },
    processing: {
      wavelengths_used: [String], // red, infrared
      calibration_curve: String,
      ambient_light_compensation: Boolean
    }
  },
  
  // Breathing Analysis
  breathing: {
    rate_measurements: [{
      timestamp: Date,
      breaths_per_minute: { type: Number, min: 4, max: 60 },
      breath_pattern: String, // regular, irregular, shallow, deep
      inhale_duration: Number,  // seconds
      exhale_duration: Number,  // seconds
      hold_duration: Number,    // seconds
      amplitude: Number,        // breathing depth
      confidence: { type: Number, min: 0, max: 1 }
    }],
    audio_analysis: {
      nostril_dominance: String, // left, right, both
      breath_quality: { type: Number, min: 0, max: 1 },
      sound_clarity: Number,
      background_noise: Number,
      breath_sounds: [String]   // wheeze, stridor, normal
    },
    pattern_recognition: {
      technique_detected: String,
      pattern_consistency: Number,
      timing_accuracy: Number,
      recommended_adjustments: [String]
    }
  },
  
  // Motion and Activity Data
  motion: {
    accelerometer: [{
      timestamp: Date,
      x: Number,
      y: Number,
      z: Number,
      magnitude: Number
    }],
    gyroscope: [{
      timestamp: Date,
      x: Number,
      y: Number,
      z: Number
    }],
    activity: {
      step_count: Number,
      movement_intensity: String, // sedentary, light, moderate, vigorous
      posture: String,           // sitting, standing, walking, lying
      stability: Number          // 0-1, movement stability during session
    }
  },
  
  // Environmental Context
  environment: {
    ambient_light: Number,
    noise_level: Number,
    temperature: Number,
    humidity: Number,
    air_quality: Number,
    location: {
      indoor_outdoor: String,
      gps_accuracy: Number,
      altitude: Number
    }
  },
  
  // Data Quality Assessment
  quality: {
    overall_score: { type: Number, min: 0, max: 1 },
    signal_to_noise_ratio: Number,
    data_completeness: Number, // percentage
    artifacts_detected: Number,
    confidence_intervals: {
      heart_rate: Number,
      hrv: Number,
      spo2: Number,
      breathing: Number
    },
    quality_flags: [String], // low_signal, motion_artifact, poor_contact, etc.
    usable_for_analysis: Boolean
  },
  
  // Real-time Analytics
  analytics: {
    stress_indicators: {
      hrv_stress_score: Number,
      breathing_irregularity: Number,
      heart_rate_elevation: Number,
      overall_stress: { type: Number, min: 0, max: 100 }
    },
    coherence: {
      heart_brain_coherence: Number,
      breathing_heart_sync: Number,
      coherence_ratio: Number
    },
    trends: {
      heart_rate_trend: String,
      hrv_trend: String,
      breathing_trend: String,
      improvement_indicators: [String]
    }
  },
  
  // Processing Metadata
  processing: {
    algorithm_version: String,
    processing_time: Number,    // milliseconds
    cpu_usage: Number,
    memory_usage: Number,
    real_time: Boolean,         // processed in real-time vs batch
    cloud_processed: Boolean,
    model_confidence: Number
  },
  
  // Compression and Storage
  compression: {
    algorithm: String,          // gzip, lz4, custom
    compression_ratio: Number,
    original_size: Number,
    compressed_size: Number,
    raw_data_stored: Boolean
  },
  
  // Privacy and Compliance
  privacy: {
    encrypted: { type: Boolean, default: true },
    anonymized: Boolean,
    retention_period: Number,   // days
    purpose: String,            // medical, fitness, research
    consent_level: String       // basic, advanced, research
  },
  
  // Metadata
  version: { type: Number, default: 1 },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now }
}, {
  timestamps: true,
  // Enable data compression for large documents
  collection: 'vitalsigns'
});

// Indexes for efficient queries
vitalSignsSchema.index({ userId: 1, 'timeWindow.startTime': -1 });
vitalSignsSchema.index({ sessionId: 1 });
vitalSignsSchema.index({ 'timeWindow.startTime': 1, 'timeWindow.endTime': 1 });
vitalSignsSchema.index({ 'dataSource.primary': 1 });
vitalSignsSchema.index({ 'quality.overall_score': 1 });

// Instance methods
vitalSignsSchema.methods.addHeartRateMeasurement = function(measurement) {
  this.heartRate.measurements.push({
    timestamp: new Date(),
    ...measurement
  });
  this.markModified('heartRate.measurements');
  return this.save();
};

vitalSignsSchema.methods.calculateHRVMetrics = function() {
  const rr_intervals = [];
  
  // Collect R-R intervals from recent measurements
  this.heartRate.measurements.forEach(measurement => {
    if (measurement.rr_intervals) {
      rr_intervals.push(...measurement.rr_intervals);
    }
  });
  
  if (rr_intervals.length < 10) return null;
  
  // Calculate RMSSD
  const diff_rr = [];
  for (let i = 1; i < rr_intervals.length; i++) {
    diff_rr.push(Math.pow(rr_intervals[i] - rr_intervals[i-1], 2));
  }
  const rmssd = Math.sqrt(diff_rr.reduce((a, b) => a + b, 0) / diff_rr.length);
  
  // Calculate SDNN
  const mean_rr = rr_intervals.reduce((a, b) => a + b, 0) / rr_intervals.length;
  const variance = rr_intervals.reduce((sum, rr) => sum + Math.pow(rr - mean_rr, 2), 0) / rr_intervals.length;
  const sdnn = Math.sqrt(variance);
  
  // Calculate pNN50
  let nn50_count = 0;
  for (let i = 1; i < rr_intervals.length; i++) {
    if (Math.abs(rr_intervals[i] - rr_intervals[i-1]) > 50) {
      nn50_count++;
    }
  }
  const pnn50 = (nn50_count / (rr_intervals.length - 1)) * 100;
  
  const hrvMeasurement = {
    timestamp: new Date(),
    rmssd: rmssd,
    sdnn: sdnn,
    pnn50: pnn50,
    confidence: rr_intervals.length > 50 ? 0.9 : 0.6
  };
  
  this.heartRateVariability.measurements.push(hrvMeasurement);
  this.markModified('heartRateVariability.measurements');
  
  return hrvMeasurement;
};

vitalSignsSchema.methods.assessDataQuality = function() {
  let qualityScore = 0;
  let factors = 0;
  
  // Heart rate quality
  if (this.heartRate.measurements.length > 0) {
    const avgConfidence = this.heartRate.measurements.reduce((sum, m) => sum + (m.confidence || 0), 0) / this.heartRate.measurements.length;
    qualityScore += avgConfidence * 0.3;
    factors += 0.3;
  }
  
  // SpO2 quality
  if (this.oxygenSaturation.measurements.length > 0) {
    const avgConfidence = this.oxygenSaturation.measurements.reduce((sum, m) => sum + (m.confidence || 0), 0) / this.oxygenSaturation.measurements.length;
    qualityScore += avgConfidence * 0.2;
    factors += 0.2;
  }
  
  // Breathing quality
  if (this.breathing.rate_measurements.length > 0) {
    const avgConfidence = this.breathing.rate_measurements.reduce((sum, m) => sum + (m.confidence || 0), 0) / this.breathing.rate_measurements.length;
    qualityScore += avgConfidence * 0.3;
    factors += 0.3;
  }
  
  // Signal quality
  if (this.dataSource.device.signalQuality) {
    qualityScore += this.dataSource.device.signalQuality * 0.2;
    factors += 0.2;
  }
  
  this.quality.overall_score = factors > 0 ? qualityScore / factors : 0;
  return this.quality.overall_score;
};

vitalSignsSchema.methods.calculateStressLevel = function() {
  let stressScore = 0;
  let weightSum = 0;
  
  // HRV contribution (40% weight)
  if (this.heartRateVariability.measurements.length > 0) {
    const latestHRV = this.heartRateVariability.measurements[this.heartRateVariability.measurements.length - 1];
    
    // Lower HRV indicates higher stress
    // Normalize RMSSD (typical range 20-100ms)
    const normalizedRMSSD = Math.max(0, Math.min(1, (100 - latestHRV.rmssd) / 80));
    stressScore += normalizedRMSSD * 40;
    weightSum += 40;
  }
  
  // Heart rate contribution (30% weight)
  if (this.heartRate.measurements.length > 0) {
    const latestHR = this.heartRate.measurements[this.heartRate.measurements.length - 1];
    
    // Elevated heart rate indicates stress (assuming resting baseline)
    // Normalize around typical resting HR (60-100 bpm)
    const normalizedHR = Math.max(0, Math.min(1, (latestHR.bpm - 60) / 40));
    stressScore += normalizedHR * 30;
    weightSum += 30;
  }
  
  // Breathing rate contribution (30% weight)
  if (this.breathing.rate_measurements.length > 0) {
    const latestBR = this.breathing.rate_measurements[this.breathing.rate_measurements.length - 1];
    
    // Higher breathing rate indicates stress (normal: 12-20 bpm)
    const normalizedBR = Math.max(0, Math.min(1, (latestBR.breaths_per_minute - 12) / 8));
    stressScore += normalizedBR * 30;
    weightSum += 30;
  }
  
  const finalStressLevel = weightSum > 0 ? stressScore / weightSum : 0;
  
  // Update analytics
  if (!this.analytics.stress_indicators) {
    this.analytics.stress_indicators = {};
  }
  this.analytics.stress_indicators.overall_stress = Math.round(finalStressLevel);
  
  return finalStressLevel;
};

// Static methods for analytics
vitalSignsSchema.statics.getAggregatedData = async function(userId, timeRange, metric) {
  const startTime = new Date(Date.now() - timeRange * 24 * 60 * 60 * 1000);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        'timeWindow.startTime': { $gte: startTime }
      }
    },
    {
      $unwind: `$${metric}.measurements`
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: `$${metric}.measurements.timestamp`
          }
        },
        avgValue: { $avg: `$${metric}.measurements.bpm` },
        minValue: { $min: `$${metric}.measurements.bpm` },
        maxValue: { $max: `$${metric}.measurements.bpm` },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);
};

vitalSignsSchema.statics.detectAnomalies = async function(userId, metric, threshold = 2) {
  const recentData = await this.find({
    userId: userId,
    'timeWindow.startTime': {
      $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Last 7 days
    }
  }).sort({ 'timeWindow.startTime': -1 });
  
  // Implementation would include statistical analysis for anomaly detection
  // Using z-score, isolation forest, or other algorithms
  
  return {
    anomalies: [],
    baseline: {},
    recommendations: []
  };
};

module.exports = mongoose.model('VitalSigns', vitalSignsSchema);