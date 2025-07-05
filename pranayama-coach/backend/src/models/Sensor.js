/**
 * Sensor Model for BLE Device Management
 * Modular framework for plug-and-play sensor integration
 */

const mongoose = require('mongoose');

const sensorSchema = new mongoose.Schema({
  // Basic sensor identification
  name: {
    type: String,
    required: true,
    trim: true
  },
  manufacturer: String,
  model: String,
  firmwareVersion: String,
  hardwareVersion: String,
  
  // BLE connection details
  bluetooth: {
    macAddress: {
      type: String,
      required: true,
      unique: true,
      validate: {
        validator: function(mac) {
          return /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/.test(mac);
        },
        message: 'Invalid MAC address format'
      }
    },
    deviceId: String,        // Platform-specific device identifier
    localName: String,       // BLE advertised name
    rssi: Number,           // Signal strength
    txPowerLevel: Number,   // Transmission power
    isConnectable: { type: Boolean, default: true },
    connectionState: {
      type: String,
      enum: ['disconnected', 'connecting', 'connected', 'bonded', 'error'],
      default: 'disconnected'
    },
    lastSeen: Date,
    batteryLevel: Number    // 0-100
  },
  
  // BLE GATT Profile Information
  gattProfile: {
    services: [{
      uuid: String,           // Standard or custom service UUID
      name: String,           // Human-readable service name
      characteristics: [{
        uuid: String,         // Characteristic UUID
        name: String,         // Human-readable name
        properties: [String], // read, write, notify, indicate
        descriptors: [{
          uuid: String,
          name: String,
          value: mongoose.Schema.Types.Mixed
        }],
        dataFormat: {
          type: String,
          enum: ['uint8', 'uint16', 'uint32', 'int8', 'int16', 'int32', 'float32', 'string', 'bytes', 'custom'],
          default: 'bytes'
        },
        byteOrder: {
          type: String,
          enum: ['little', 'big'],
          default: 'little'
        },
        scaleFactor: Number,
        offset: Number,
        unit: String          // bpm, %, mmHg, etc.
      }],
      isStandard: Boolean     // true for standard BLE profiles
    }],
    
    // Standard Health Device Profile mappings
    standardProfiles: [{
      profileName: {
        type: String,
        enum: [
          'heart_rate',         // Heart Rate Service (0x180D)
          'health_thermometer', // Health Thermometer (0x1809)
          'blood_pressure',     // Blood Pressure (0x1810)
          'glucose',           // Glucose (0x1808)
          'pulse_oximeter',    // Pulse Oximeter (custom)
          'fitness_machine',   // Fitness Machine (0x1826)
          'cycling_power',     // Cycling Power (0x1818)
          'running_speed',     // Running Speed and Cadence (0x1814)
          'environmental',     // Environmental Sensing (0x181A)
          'custom'
        ]
      },
      serviceUUID: String,
      characteristicMappings: [{
        metricName: String,   // hr, hrv, spo2, temperature, etc.
        characteristicUUID: String,
        parser: String        // Function name or script to parse data
      }]
    }]
  },
  
  // Sensor capabilities and metrics
  capabilities: {
    metrics: [{
      name: {
        type: String,
        enum: [
          'heart_rate',
          'heart_rate_variability',
          'oxygen_saturation',
          'blood_pressure_systolic',
          'blood_pressure_diastolic',
          'body_temperature',
          'breathing_rate',
          'activity_level',
          'step_count',
          'distance',
          'calories',
          'sleep_stage',
          'stress_level',
          'glucose_level',
          'ecg',
          'ppg_signal',
          'accelerometer',
          'gyroscope',
          'magnetometer',
          'ambient_light',
          'environmental_temperature',
          'humidity',
          'air_pressure',
          'custom'
        ]
      },
      displayName: String,
      unit: String,
      range: {
        min: Number,
        max: Number
      },
      accuracy: String,       // ±3 bpm, ±2%, etc.
      precision: Number,      // decimal places
      sampleRate: Number,     // Hz
      isRealTime: Boolean,
      isCalibrated: Boolean,
      calibrationRequired: Boolean
    }],
    
    // Additional capabilities
    features: [String],       // waterproof, sleep_tracking, gps, etc.
    certifications: [String], // fda_cleared, ce_marked, iso_13485, etc.
    batteryType: String,      // rechargeable, replaceable, etc.
    batteryLife: String,      // hours/days of typical use
    operatingRange: String,   // meters for BLE range
    waterResistance: String   // IPX7, etc.
  },
  
  // User association and configuration
  userConfig: {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    nickname: String,         // User-defined name
    isPrimary: Boolean,       // Primary device for this metric type
    autoConnect: { type: Boolean, default: true },
    notificationsEnabled: { type: Boolean, default: true },
    
    // Personalized settings
    thresholds: [{
      metric: String,
      minValue: Number,
      maxValue: Number,
      alertEnabled: Boolean
    }],
    
    calibration: {
      isCalibrated: { type: Boolean, default: false },
      calibrationDate: Date,
      calibrationValues: mongoose.Schema.Types.Mixed,
      calibrationNotes: String,
      nextCalibrationDue: Date
    },
    
    preferences: {
      dataFrequency: {
        type: String,
        enum: ['realtime', 'every_second', 'every_5_seconds', 'every_minute'],
        default: 'realtime'
      },
      smoothing: { type: Boolean, default: true },
      noiseFiltering: { type: Boolean, default: true }
    }
  },
  
  // Connection history and reliability
  connectionHistory: [{
    timestamp: Date,
    event: {
      type: String,
      enum: ['connected', 'disconnected', 'pairing_started', 'pairing_success', 'pairing_failed', 'error', 'battery_low']
    },
    details: String,
    duration: Number,        // seconds connected
    dataQuality: Number,     // 0-1
    errorCode: String
  }],
  
  reliability: {
    connectionSuccess: { type: Number, default: 0 },   // percentage
    averageConnectionTime: Number,                      // seconds
    dataTransmissionReliability: { type: Number, default: 0 }, // percentage
    lastSuccessfulConnection: Date,
    longestConnectionDuration: Number,                  // seconds
    totalUsageTime: { type: Number, default: 0 },      // seconds
    errorCount: { type: Number, default: 0 }
  },
  
  // Data processing configuration
  dataProcessing: {
    // Real-time processing settings
    filters: [{
      type: {
        type: String,
        enum: ['lowpass', 'highpass', 'bandpass', 'notch', 'moving_average', 'kalman', 'custom']
      },
      parameters: mongoose.Schema.Types.Mixed,
      enabled: { type: Boolean, default: true }
    }],
    
    // Validation rules
    validation: {
      outlierDetection: { type: Boolean, default: true },
      outlierThreshold: { type: Number, default: 3 }, // standard deviations
      rangeValidation: { type: Boolean, default: true },
      timeoutDetection: { type: Boolean, default: true },
      timeoutThreshold: { type: Number, default: 5000 } // milliseconds
    },
    
    // Aggregation settings
    aggregation: {
      windowSize: { type: Number, default: 30 },       // seconds
      method: {
        type: String,
        enum: ['mean', 'median', 'max', 'min', 'rms'],
        default: 'mean'
      },
      overlap: { type: Number, default: 0 }            // seconds
    }
  },
  
  // Compatibility and version info
  compatibility: {
    platforms: [String],      // ios, android, windows, macos
    minOSVersions: {
      ios: String,
      android: String,
      windows: String,
      macos: String
    },
    appVersions: {
      minVersion: String,
      maxVersion: String,
      recommendedVersion: String
    },
    bluetoothVersions: [String], // 4.0, 4.1, 4.2, 5.0, 5.1, 5.2
    requiredPermissions: [String] // location, bluetooth, etc.
  },
  
  // Documentation and support
  documentation: {
    manualUrl: String,
    supportUrl: String,
    troubleshootingSteps: [String],
    knownIssues: [String],
    setupInstructions: [String],
    videoTutorialUrl: String
  },
  
  // JSON configuration for dynamic integration
  configJson: {
    version: String,
    configuration: mongoose.Schema.Types.Mixed, // Full JSON config
    updateUrl: String,       // URL to fetch latest config
    lastConfigUpdate: Date,
    hash: String            // Configuration integrity check
  },
  
  // Status and metadata
  status: {
    isActive: { type: Boolean, default: true },
    isSupported: { type: Boolean, default: true },
    supportLevel: {
      type: String,
      enum: ['full', 'partial', 'experimental', 'deprecated'],
      default: 'full'
    },
    lastHealthCheck: Date,
    issues: [String],
    maintenanceMode: Boolean
  },
  
  // Compliance and certification
  compliance: {
    medicalGrade: Boolean,
    fdaClearance: String,
    ceMarking: Boolean,
    iso13485: Boolean,
    hipaaCompliant: Boolean,
    dataRetentionPolicy: String,
    privacyLevel: {
      type: String,
      enum: ['basic', 'standard', 'high', 'medical'],
      default: 'standard'
    }
  },
  
  // Analytics and usage
  analytics: {
    totalUsers: { type: Number, default: 0 },
    activeUsers: { type: Number, default: 0 },
    averageSessionDuration: Number,
    dataQualityRating: Number,
    userRating: Number,
    reviewCount: Number,
    popularMetrics: [String],
    usagePatterns: mongoose.Schema.Types.Mixed
  },
  
  // Metadata
  addedBy: String,          // system, user, manufacturer
  addedDate: { type: Date, default: Date.now },
  lastUpdated: { type: Date, default: Date.now },
  version: { type: Number, default: 1 }
}, {
  timestamps: true
});

// Indexes for efficient queries
sensorSchema.index({ 'bluetooth.macAddress': 1 }, { unique: true });
sensorSchema.index({ 'userConfig.userId': 1 });
sensorSchema.index({ manufacturer: 1, model: 1 });
sensorSchema.index({ 'capabilities.metrics.name': 1 });
sensorSchema.index({ 'gattProfile.standardProfiles.profileName': 1 });
sensorSchema.index({ 'bluetooth.connectionState': 1 });
sensorSchema.index({ 'status.isActive': 1, 'status.isSupported': 1 });

// Virtual for connection status
sensorSchema.virtual('isConnected').get(function() {
  return this.bluetooth.connectionState === 'connected' || this.bluetooth.connectionState === 'bonded';
});

// Virtual for battery status
sensorSchema.virtual('batteryStatus').get(function() {
  const level = this.bluetooth.batteryLevel;
  if (level === undefined) return 'unknown';
  if (level < 10) return 'critical';
  if (level < 25) return 'low';
  if (level < 75) return 'good';
  return 'excellent';
});

// Instance methods
sensorSchema.methods.connect = async function() {
  this.bluetooth.connectionState = 'connecting';
  this.connectionHistory.push({
    timestamp: new Date(),
    event: 'connecting'
  });
  await this.save();
  
  // Actual BLE connection logic would be handled by the frontend
  // This just updates the database state
  return this;
};

sensorSchema.methods.disconnect = async function() {
  const wasConnected = this.isConnected;
  this.bluetooth.connectionState = 'disconnected';
  
  if (wasConnected) {
    // Calculate connection duration
    const lastConnection = this.connectionHistory
      .filter(h => h.event === 'connected')
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    
    if (lastConnection) {
      const duration = Math.floor((new Date() - lastConnection.timestamp) / 1000);
      this.connectionHistory.push({
        timestamp: new Date(),
        event: 'disconnected',
        duration: duration
      });
      
      // Update reliability metrics
      this.reliability.totalUsageTime += duration;
      if (duration > this.reliability.longestConnectionDuration) {
        this.reliability.longestConnectionDuration = duration;
      }
    }
  }
  
  await this.save();
  return this;
};

sensorSchema.methods.updateBatteryLevel = function(level) {
  this.bluetooth.batteryLevel = level;
  
  if (level < 15) {
    this.connectionHistory.push({
      timestamp: new Date(),
      event: 'battery_low',
      details: `Battery level: ${level}%`
    });
  }
  
  return this.save();
};

sensorSchema.methods.calibrate = function(calibrationData, notes) {
  this.userConfig.calibration = {
    isCalibrated: true,
    calibrationDate: new Date(),
    calibrationValues: calibrationData,
    calibrationNotes: notes,
    nextCalibrationDue: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
  };
  
  // Mark all metrics as calibrated
  this.capabilities.metrics.forEach(metric => {
    metric.isCalibrated = true;
  });
  
  return this.save();
};

sensorSchema.methods.updateReliability = function(success, dataQuality) {
  const totalAttempts = this.reliability.connectionSuccess + this.reliability.errorCount;
  const successCount = this.reliability.connectionSuccess + (success ? 1 : 0);
  const errorCount = this.reliability.errorCount + (success ? 0 : 1);
  
  this.reliability.connectionSuccess = (successCount / (totalAttempts + 1)) * 100;
  this.reliability.errorCount = errorCount;
  
  if (dataQuality !== undefined) {
    this.reliability.dataTransmissionReliability = 
      (this.reliability.dataTransmissionReliability + dataQuality) / 2;
  }
  
  if (success) {
    this.reliability.lastSuccessfulConnection = new Date();
  }
  
  return this.save();
};

// Static methods
sensorSchema.statics.findByMAC = function(macAddress) {
  return this.findOne({ 'bluetooth.macAddress': macAddress });
};

sensorSchema.statics.findConnectedDevices = function(userId) {
  return this.find({
    'userConfig.userId': userId,
    'bluetooth.connectionState': { $in: ['connected', 'bonded'] }
  });
};

sensorSchema.statics.findByCapability = function(metricName, userId) {
  return this.find({
    'userConfig.userId': userId,
    'capabilities.metrics.name': metricName,
    'status.isActive': true,
    'status.isSupported': true
  });
};

sensorSchema.statics.createFromConfig = function(configJson, userId) {
  const config = JSON.parse(configJson);
  
  return this.create({
    name: config.name,
    manufacturer: config.manufacturer,
    model: config.model,
    bluetooth: {
      macAddress: config.macAddress
    },
    gattProfile: config.gattProfile,
    capabilities: config.capabilities,
    userConfig: {
      userId: userId,
      autoConnect: true
    },
    configJson: {
      version: config.version,
      configuration: config,
      lastConfigUpdate: new Date()
    },
    addedBy: 'user'
  });
};

sensorSchema.statics.updateFromRemoteConfig = async function(sensorId, remoteConfigUrl) {
  // Fetch and validate remote configuration
  // Update sensor configuration dynamically
  const sensor = await this.findById(sensorId);
  if (!sensor) throw new Error('Sensor not found');
  
  // Implementation would fetch from remoteConfigUrl
  // and update the configuration
  
  return sensor;
};

sensorSchema.statics.getSupportedDevices = function() {
  return this.find({
    'status.isSupported': true,
    'status.isActive': true
  }).select('name manufacturer model capabilities.metrics gattProfile.standardProfiles');
};

sensorSchema.statics.getCompatibilityReport = function(platform, osVersion, appVersion) {
  return this.find({
    'status.isSupported': true,
    'compatibility.platforms': platform
    // Additional compatibility checks would be implemented here
  });
};

module.exports = mongoose.model('Sensor', sensorSchema);