/**
 * Encryption Middleware for HIPAA/GDPR Compliance
 * End-to-end encryption for sensitive health data
 */

const crypto = require('crypto');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32; // 256 bits
const IV_LENGTH = 16;  // 128 bits
const TAG_LENGTH = 16; // 128 bits

/**
 * Encrypt sensitive data using AES-256-GCM
 */
function encryptData(plaintext, key) {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipher(ALGORITHM, key, iv);
    
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
function decryptData(encryptedData, key) {
  try {
    const { encrypted, iv, tag } = encryptedData;
    
    const decipher = crypto.createDecipher(ALGORITHM, key);
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error('Failed to decrypt data');
  }
}

/**
 * Middleware to encrypt outgoing response data
 */
const encryptResponse = (req, res, next) => {
  // Only encrypt if client supports it and data contains PHI
  const clientSupportsEncryption = req.headers['x-encryption-supported'] === 'true';
  const forceEncryption = req.headers['x-force-encryption'] === 'true';
  
  if (!clientSupportsEncryption && !forceEncryption) {
    return next();
  }

  // Store original json method
  const originalJson = res.json;
  
  res.json = function(data) {
    try {
      // Check if data contains PHI (Protected Health Information)
      const containsPHI = checkForPHI(data);
      
      if (containsPHI || forceEncryption) {
        // Get user's encryption key
        const encryptionKey = req.user?.encryptionKey;
        if (!encryptionKey) {
          return res.status(500).json({
            error: 'Encryption key not available',
            code: 'ENCRYPTION_KEY_MISSING'
          });
        }

        // Encrypt the response data
        const encryptedData = encryptData(JSON.stringify(data), encryptionKey);
        
        // Send encrypted response
        res.set({
          'X-Data-Encrypted': 'true',
          'X-Encryption-Algorithm': ALGORITHM,
          'Content-Type': 'application/json'
        });
        
        return originalJson.call(this, {
          encrypted: true,
          data: encryptedData.encrypted,
          iv: encryptedData.iv,
          tag: encryptedData.tag,
          timestamp: new Date().toISOString()
        });
      }
      
      // Send unencrypted response
      return originalJson.call(this, data);
    } catch (error) {
      console.error('Response encryption error:', error);
      return res.status(500).json({
        error: 'Failed to encrypt response',
        code: 'ENCRYPTION_FAILED'
      });
    }
  };
  
  next();
};

/**
 * Middleware to decrypt incoming request data
 */
const decryptRequest = (req, res, next) => {
  try {
    // Check if request contains encrypted data
    const isEncrypted = req.headers['x-data-encrypted'] === 'true';
    
    if (!isEncrypted) {
      return next();
    }

    // Validate encryption headers
    if (!req.body.encrypted || !req.body.iv || !req.body.tag) {
      return res.status(400).json({
        error: 'Invalid encrypted request format',
        code: 'INVALID_ENCRYPTED_FORMAT'
      });
    }

    // Get user's encryption key
    const encryptionKey = req.user?.encryptionKey;
    if (!encryptionKey) {
      return res.status(400).json({
        error: 'Encryption key not available',
        code: 'ENCRYPTION_KEY_MISSING'
      });
    }

    // Decrypt the request data
    const decryptedData = decryptData({
      encrypted: req.body.data,
      iv: req.body.iv,
      tag: req.body.tag
    }, encryptionKey);

    // Parse decrypted JSON
    req.body = JSON.parse(decryptedData);
    
    next();
  } catch (error) {
    console.error('Request decryption error:', error);
    res.status(400).json({
      error: 'Failed to decrypt request data',
      code: 'DECRYPTION_FAILED'
    });
  }
};

/**
 * Check if data contains Protected Health Information (PHI)
 */
function checkForPHI(data) {
  if (!data || typeof data !== 'object') {
    return false;
  }

  const phiFields = [
    'heartRate', 'heartRateVariability', 'oxygenSaturation', 'breathing',
    'vitalSigns', 'healthBaseline', 'medicalHistory', 'symptoms',
    'medications', 'allergies', 'conditions', 'personalData',
    'firstName', 'lastName', 'dateOfBirth', 'ssn', 'phoneNumber',
    'address', 'email', 'emergencyContact', 'insuranceInfo'
  ];

  // Recursively check for PHI fields
  function containsPHI(obj, path = '') {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const currentPath = path ? `${path}.${key}` : key;
        
        // Check if current key is a PHI field
        if (phiFields.some(phi => key.toLowerCase().includes(phi.toLowerCase()))) {
          return true;
        }
        
        // Recursively check nested objects
        if (typeof obj[key] === 'object' && obj[key] !== null) {
          if (containsPHI(obj[key], currentPath)) {
            return true;
          }
        }
      }
    }
    return false;
  }

  return containsPHI(data);
}

/**
 * Encrypt specific fields in database documents
 */
const encryptFields = (fields, encryptionKey) => {
  return (doc) => {
    if (!doc || !encryptionKey) return doc;
    
    const encrypted = { ...doc };
    
    fields.forEach(field => {
      if (encrypted[field] !== undefined) {
        try {
          const fieldValue = typeof encrypted[field] === 'string' 
            ? encrypted[field] 
            : JSON.stringify(encrypted[field]);
          
          encrypted[field] = encryptData(fieldValue, encryptionKey);
        } catch (error) {
          console.error(`Failed to encrypt field ${field}:`, error);
        }
      }
    });
    
    return encrypted;
  };
};

/**
 * Decrypt specific fields in database documents
 */
const decryptFields = (fields, encryptionKey) => {
  return (doc) => {
    if (!doc || !encryptionKey) return doc;
    
    const decrypted = { ...doc };
    
    fields.forEach(field => {
      if (decrypted[field] && typeof decrypted[field] === 'object' && decrypted[field].encrypted) {
        try {
          const decryptedValue = decryptData(decrypted[field], encryptionKey);
          
          // Try to parse as JSON, fallback to string
          try {
            decrypted[field] = JSON.parse(decryptedValue);
          } catch {
            decrypted[field] = decryptedValue;
          }
        } catch (error) {
          console.error(`Failed to decrypt field ${field}:`, error);
          // Keep encrypted data if decryption fails
        }
      }
    });
    
    return decrypted;
  };
};

/**
 * Generate a new encryption key for a user
 */
function generateEncryptionKey() {
  return crypto.randomBytes(KEY_LENGTH).toString('hex');
}

/**
 * Hash sensitive data for searching while maintaining privacy
 */
function hashForSearch(data, salt) {
  return crypto.createHash('sha256')
    .update(data + salt)
    .digest('hex');
}

/**
 * Middleware for field-level encryption on save
 */
const fieldEncryptionMiddleware = (schema, options = {}) => {
  const encryptedFields = options.fields || [];
  
  schema.pre('save', function(next) {
    if (!this.isNew && !this.isModified()) {
      return next();
    }
    
    const encryptionKey = this.encryptionKey || options.defaultKey;
    if (!encryptionKey) {
      return next(new Error('Encryption key required for PHI data'));
    }
    
    // Encrypt specified fields
    encryptedFields.forEach(field => {
      if (this[field] !== undefined && !this[field].encrypted) {
        try {
          const fieldValue = typeof this[field] === 'string' 
            ? this[field] 
            : JSON.stringify(this[field]);
          
          this[field] = encryptData(fieldValue, encryptionKey);
        } catch (error) {
          return next(new Error(`Failed to encrypt ${field}: ${error.message}`));
        }
      }
    });
    
    next();
  });
  
  schema.post('find', function(docs) {
    if (!docs) return;
    
    const docsArray = Array.isArray(docs) ? docs : [docs];
    docsArray.forEach(doc => {
      if (doc.encryptionKey) {
        decryptDocumentFields(doc, encryptedFields, doc.encryptionKey);
      }
    });
  });
};

/**
 * Decrypt document fields helper
 */
function decryptDocumentFields(doc, fields, encryptionKey) {
  fields.forEach(field => {
    if (doc[field] && typeof doc[field] === 'object' && doc[field].encrypted) {
      try {
        const decryptedValue = decryptData(doc[field], encryptionKey);
        
        try {
          doc[field] = JSON.parse(decryptedValue);
        } catch {
          doc[field] = decryptedValue;
        }
      } catch (error) {
        console.error(`Failed to decrypt ${field}:`, error);
      }
    }
  });
}

module.exports = {
  encryptResponse,
  decryptRequest,
  encryptData,
  decryptData,
  encryptFields,
  decryptFields,
  generateEncryptionKey,
  hashForSearch,
  fieldEncryptionMiddleware,
  checkForPHI
};