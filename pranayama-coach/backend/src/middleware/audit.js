/**
 * Audit Middleware for HIPAA/GDPR Compliance
 * Comprehensive logging of all data access and modifications
 */

const mongoose = require('mongoose');

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  // Event identification
  eventId: {
    type: String,
    required: true,
    unique: true,
    default: () => require('crypto').randomUUID()
  },
  timestamp: {
    type: Date,
    default: Date.now,
    required: true
  },
  
  // Event classification
  eventType: {
    type: String,
    required: true,
    enum: [
      'authentication',
      'authorization',
      'data_access',
      'data_creation',
      'data_modification',
      'data_deletion',
      'data_export',
      'system_access',
      'privacy_action',
      'security_event',
      'compliance_event',
      'error'
    ]
  },
  eventCategory: {
    type: String,
    required: true,
    enum: ['PHI', 'PII', 'system', 'security', 'business']
  },
  severity: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // User and session information
  actor: {
    userId: mongoose.Schema.Types.ObjectId,
    userEmail: String,
    userRole: String,
    sessionId: String,
    ipAddress: String,
    userAgent: String,
    deviceInfo: {
      platform: String,
      version: String,
      device: String
    }
  },
  
  // Action details
  action: {
    method: String,        // GET, POST, PUT, DELETE
    endpoint: String,      // API endpoint
    resource: String,      // users, sessions, vital-signs, etc.
    resourceId: String,    // Specific resource ID
    operation: String,     // create, read, update, delete, export, etc.
    description: String    // Human-readable description
  },
  
  // Data access details (for PHI/PII)
  dataAccess: {
    dataTypes: [String],   // heartRate, personalInfo, etc.
    recordCount: Number,
    patientIds: [String],  // For healthcare compliance
    purpose: String,       // treatment, payment, operations, etc.
    legalBasis: String,    // consent, legitimate_interest, etc. (GDPR)
    retentionPeriod: Number // days
  },
  
  // Request/Response metadata
  request: {
    headers: mongoose.Schema.Types.Mixed,
    body: mongoose.Schema.Types.Mixed,  // Sanitized - no PHI
    query: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    size: Number // bytes
  },
  response: {
    statusCode: Number,
    headers: mongoose.Schema.Types.Mixed,
    size: Number, // bytes
    processingTime: Number // milliseconds
  },
  
  // Security information
  security: {
    authenticated: Boolean,
    authenticationMethod: String, // jwt, oauth, etc.
    encryptionUsed: Boolean,
    tlsVersion: String,
    riskScore: Number, // 0-100
    anomalyDetected: Boolean,
    geolocation: {
      country: String,
      region: String,
      city: String,
      coordinates: [Number] // [longitude, latitude]
    }
  },
  
  // Compliance tracking
  compliance: {
    hipaaRelevant: Boolean,
    gdprRelevant: Boolean,
    consentRequired: Boolean,
    consentObtained: Boolean,
    purposeLimitation: Boolean,
    dataMinimization: Boolean,
    accuracyMaintained: Boolean,
    storageLimitation: String,
    integrityMaintained: Boolean,
    confidentialityMaintained: Boolean
  },
  
  // Error information (if applicable)
  error: {
    occurred: Boolean,
    errorType: String,
    errorCode: String,
    errorMessage: String,
    stackTrace: String // Only in development
  },
  
  // System context
  system: {
    environment: String,   // production, staging, development
    version: String,       // Application version
    nodeId: String,        // Server/instance identifier
    correlationId: String, // For request tracing
    parentEventId: String  // For related events
  },
  
  // Additional metadata
  metadata: {
    tags: [String],
    customFields: mongoose.Schema.Types.Mixed,
    businessContext: String,
    integrationSource: String // mobile_app, web_app, api, etc.
  }
}, {
  timestamps: false, // We use our own timestamp
  collection: 'audit_logs'
});

// Indexes for efficient querying and compliance reporting
auditLogSchema.index({ timestamp: -1 });
auditLogSchema.index({ 'actor.userId': 1, timestamp: -1 });
auditLogSchema.index({ eventType: 1, timestamp: -1 });
auditLogSchema.index({ 'action.resource': 1, timestamp: -1 });
auditLogSchema.index({ 'dataAccess.dataTypes': 1 });
auditLogSchema.index({ 'compliance.hipaaRelevant': 1 });
auditLogSchema.index({ 'compliance.gdprRelevant': 1 });
auditLogSchema.index({ 'security.riskScore': 1 });
auditLogSchema.index({ eventId: 1 }, { unique: true });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

/**
 * Main audit middleware
 */
const auditMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Store original json method to capture response
  const originalJson = res.json;
  let responseBody = null;
  let responseSize = 0;
  
  res.json = function(data) {
    responseBody = data;
    responseSize = JSON.stringify(data).length;
    return originalJson.call(this, data);
  };
  
  // Store original end method to capture final response
  const originalEnd = res.end;
  res.end = function(chunk, encoding) {
    const processingTime = Date.now() - startTime;
    
    // Create audit log entry
    createAuditLog(req, res, {
      responseBody,
      responseSize,
      processingTime
    }).catch(error => {
      console.error('Audit logging failed:', error);
      // Don't fail the request if audit logging fails
    });
    
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

/**
 * Create audit log entry
 */
async function createAuditLog(req, res, responseInfo) {
  try {
    const { responseBody, responseSize, processingTime } = responseInfo;
    
    // Determine event type and category
    const { eventType, eventCategory, severity } = classifyEvent(req, res);
    
    // Sanitize request data (remove sensitive information)
    const sanitizedRequest = sanitizeRequestData(req);
    
    // Determine data types accessed
    const dataTypes = determineDataTypes(req, responseBody);
    
    // Check if this involves PHI/PII
    const { hipaaRelevant, gdprRelevant } = assessComplianceRelevance(req, responseBody, dataTypes);
    
    // Calculate risk score
    const riskScore = calculateRiskScore(req, res, dataTypes);
    
    // Create audit log entry
    const auditEntry = new AuditLog({
      timestamp: new Date(),
      eventType,
      eventCategory,
      severity,
      
      actor: {
        userId: req.user?._id,
        userEmail: req.user?.email,
        userRole: req.user?.role || 'user',
        sessionId: req.sessionID,
        ipAddress: getClientIP(req),
        userAgent: req.get('User-Agent'),
        deviceInfo: extractDeviceInfo(req)
      },
      
      action: {
        method: req.method,
        endpoint: req.originalUrl,
        resource: extractResourceType(req.path),
        resourceId: extractResourceId(req),
        operation: mapMethodToOperation(req.method, req.path),
        description: generateActionDescription(req, res)
      },
      
      dataAccess: {
        dataTypes,
        recordCount: calculateRecordCount(responseBody),
        patientIds: extractPatientIds(req, responseBody),
        purpose: determinePurpose(req),
        legalBasis: determineLegalBasis(req),
        retentionPeriod: getRetentionPeriod(dataTypes)
      },
      
      request: {
        headers: sanitizeHeaders(req.headers),
        body: sanitizedRequest.body,
        query: sanitizedRequest.query,
        params: req.params,
        size: JSON.stringify(req.body || {}).length
      },
      
      response: {
        statusCode: res.statusCode,
        headers: sanitizeHeaders(res.getHeaders()),
        size: responseSize,
        processingTime
      },
      
      security: {
        authenticated: !!req.user,
        authenticationMethod: req.authMethod || 'jwt',
        encryptionUsed: isEncryptionUsed(req, res),
        tlsVersion: req.connection?.getCipher?.()?.version,
        riskScore,
        anomalyDetected: detectAnomalies(req, res),
        geolocation: await getGeolocation(getClientIP(req))
      },
      
      compliance: {
        hipaaRelevant,
        gdprRelevant,
        consentRequired: isConsentRequired(dataTypes),
        consentObtained: checkConsentStatus(req),
        purposeLimitation: checkPurposeLimitation(req),
        dataMinimization: checkDataMinimization(req, responseBody),
        accuracyMaintained: true, // Assume true unless specific checks fail
        storageLimitation: getStorageLimitation(dataTypes),
        integrityMaintained: true,
        confidentialityMaintained: isEncryptionUsed(req, res)
      },
      
      error: {
        occurred: res.statusCode >= 400,
        errorType: res.statusCode >= 500 ? 'server_error' : res.statusCode >= 400 ? 'client_error' : null,
        errorCode: res.statusCode >= 400 ? res.statusCode.toString() : null,
        errorMessage: res.statusCode >= 400 ? responseBody?.error : null
      },
      
      system: {
        environment: process.env.NODE_ENV || 'development',
        version: process.env.APP_VERSION || '1.0.0',
        nodeId: process.env.NODE_ID || require('os').hostname(),
        correlationId: req.correlationId || req.get('X-Correlation-ID'),
        parentEventId: req.parentEventId
      },
      
      metadata: {
        tags: generateTags(req, res, dataTypes),
        customFields: req.auditCustomFields || {},
        businessContext: req.businessContext,
        integrationSource: req.get('X-Source') || 'mobile_app'
      }
    });
    
    await auditEntry.save();
    
    // Send to external audit system if configured
    if (process.env.EXTERNAL_AUDIT_ENDPOINT) {
      sendToExternalAuditSystem(auditEntry);
    }
    
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Continue processing - don't fail the request
  }
}

/**
 * Classify event type and category
 */
function classifyEvent(req, res) {
  const method = req.method;
  const path = req.path;
  const statusCode = res.statusCode;
  
  let eventType = 'data_access';
  let eventCategory = 'business';
  let severity = 'medium';
  
  // Determine event type
  if (path.includes('/auth/')) {
    eventType = 'authentication';
    eventCategory = 'security';
  } else if (method === 'POST' && !path.includes('/search')) {
    eventType = 'data_creation';
  } else if (method === 'PUT' || method === 'PATCH') {
    eventType = 'data_modification';
  } else if (method === 'DELETE') {
    eventType = 'data_deletion';
    severity = 'high';
  } else if (path.includes('/export')) {
    eventType = 'data_export';
    severity = 'high';
  }
  
  // Determine category
  if (path.includes('/vital-signs') || path.includes('/sessions') || path.includes('/health')) {
    eventCategory = 'PHI';
    severity = 'high';
  } else if (path.includes('/users') || path.includes('/profile')) {
    eventCategory = 'PII';
  }
  
  // Adjust severity based on status code
  if (statusCode >= 500) {
    severity = 'critical';
    eventType = 'error';
  } else if (statusCode >= 400) {
    severity = 'high';
  }
  
  return { eventType, eventCategory, severity };
}

/**
 * Sanitize request data by removing sensitive information
 */
function sanitizeRequestData(req) {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'ssn', 'creditCard'];
  
  function sanitizeObject(obj) {
    if (!obj || typeof obj !== 'object') return obj;
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveFields.some(field => key.toLowerCase().includes(field))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object') {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }
  
  return {
    body: sanitizeObject(req.body),
    query: sanitizeObject(req.query)
  };
}

/**
 * Determine what types of data were accessed
 */
function determineDataTypes(req, responseBody) {
  const dataTypes = new Set();
  
  // Check URL path
  if (req.path.includes('/vital-signs')) dataTypes.add('vital_signs');
  if (req.path.includes('/sessions')) dataTypes.add('session_data');
  if (req.path.includes('/users')) dataTypes.add('user_profile');
  if (req.path.includes('/health')) dataTypes.add('health_data');
  
  // Check response body for specific data types
  if (responseBody) {
    if (responseBody.heartRate) dataTypes.add('heart_rate');
    if (responseBody.heartRateVariability) dataTypes.add('hrv');
    if (responseBody.oxygenSaturation) dataTypes.add('spo2');
    if (responseBody.breathing) dataTypes.add('breathing_data');
    if (responseBody.email) dataTypes.add('email');
    if (responseBody.profile) dataTypes.add('personal_info');
  }
  
  return Array.from(dataTypes);
}

/**
 * Assess HIPAA/GDPR compliance relevance
 */
function assessComplianceRelevance(req, responseBody, dataTypes) {
  const healthDataTypes = ['vital_signs', 'heart_rate', 'hrv', 'spo2', 'breathing_data', 'health_data'];
  const personalDataTypes = ['user_profile', 'email', 'personal_info'];
  
  const hipaaRelevant = dataTypes.some(type => healthDataTypes.includes(type));
  const gdprRelevant = dataTypes.some(type => personalDataTypes.includes(type)) || hipaaRelevant;
  
  return { hipaaRelevant, gdprRelevant };
}

/**
 * Calculate risk score (0-100)
 */
function calculateRiskScore(req, res, dataTypes) {
  let score = 0;
  
  // Base score for different data types
  if (dataTypes.includes('vital_signs')) score += 30;
  if (dataTypes.includes('personal_info')) score += 20;
  if (dataTypes.includes('session_data')) score += 10;
  
  // Method-based risk
  if (req.method === 'DELETE') score += 20;
  if (req.method === 'POST' || req.method === 'PUT') score += 10;
  
  // Authentication status
  if (!req.user) score += 30;
  
  // Error conditions
  if (res.statusCode >= 400) score += 15;
  
  // Encryption status
  if (!isEncryptionUsed(req, res)) score += 15;
  
  return Math.min(score, 100);
}

/**
 * Helper functions
 */
function getClientIP(req) {
  return req.ip || 
         req.connection?.remoteAddress || 
         req.socket?.remoteAddress || 
         req.headers['x-forwarded-for']?.split(',')[0] ||
         'unknown';
}

function extractDeviceInfo(req) {
  const userAgent = req.get('User-Agent') || '';
  return {
    platform: req.get('X-Platform') || 'unknown',
    version: req.get('X-App-Version') || 'unknown',
    device: userAgent.includes('Mobile') ? 'mobile' : 'desktop'
  };
}

function extractResourceType(path) {
  const segments = path.split('/').filter(Boolean);
  return segments[1] || segments[0] || 'unknown'; // Skip 'api' if present
}

function extractResourceId(req) {
  return req.params.id || req.params.sessionId || req.params.userId || null;
}

function mapMethodToOperation(method, path) {
  const operationMap = {
    'GET': 'read',
    'POST': 'create',
    'PUT': 'update',
    'PATCH': 'update',
    'DELETE': 'delete'
  };
  
  if (path.includes('/export')) return 'export';
  if (path.includes('/search')) return 'search';
  
  return operationMap[method] || 'unknown';
}

function sanitizeHeaders(headers) {
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  const sanitized = { ...headers };
  
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
}

function isEncryptionUsed(req, res) {
  return req.secure || 
         req.get('X-Data-Encrypted') === 'true' ||
         res.get('X-Data-Encrypted') === 'true';
}

function detectAnomalies(req, res) {
  // Implement anomaly detection logic
  // This could include unusual access patterns, geographic anomalies, etc.
  return false; // Placeholder
}

async function getGeolocation(ip) {
  // Implement IP geolocation lookup
  // This would typically use a service like MaxMind GeoIP
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    coordinates: [0, 0]
  };
}

// Additional helper functions would be implemented here...

module.exports = {
  auditMiddleware,
  AuditLog
};