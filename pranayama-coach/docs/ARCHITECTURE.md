# Pranayama Coach - Technical Architecture

## 🏗️ System Architecture Overview

The Pranayama Coach application follows a modern, scalable architecture designed for real-time health monitoring, cross-platform compatibility, and regulatory compliance.

```
┌─────────────────────────────────────────────────────────────┐
│                    MOBILE APPLICATIONS                       │
├─────────────────────────────────────────────────────────────┤
│  Basic Version (Phone-Only)    │  Pro Version (BLE + Phone) │
│  • Camera PPG/rPPG            │  • All Basic features       │
│  • Audio breathing analysis   │  • BLE sensor framework     │
│  • Motion sensors             │  • Heart rate monitors      │
│  • Complete app features      │  • Pulse oximeters          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     API GATEWAY                             │
│  • Authentication & Authorization                           │
│  • Rate Limiting & Security                                 │
│  • Request/Response Encryption                              │
│  • HIPAA/GDPR Compliance Middleware                        │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   BACKEND SERVICES                          │
├─────────────────────────────────────────────────────────────┤
│  Node.js + Express + TypeScript                            │
│  • User Management & Authentication                         │
│  • Session & Vital Signs Processing                        │
│  • Analytics & Insights Engine                             │
│  • Third-party Integrations                                │
│  • Audit & Compliance Logging                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    DATA LAYER                               │
├─────────────────────────────────────────────────────────────┤
│  MongoDB (Primary Database)    │  AWS S3 (File Storage)     │
│  • User profiles & sessions    │  • Audio/video files       │
│  • Vital signs data           │  • Analytics exports       │
│  • Encrypted PHI storage      │  • Backup & archival       │
└─────────────────────────────────────────────────────────────┘
```

## 📱 Mobile Application Architecture

### React Native Framework
- **Version**: React Native 0.74+
- **Language**: TypeScript for type safety
- **State Management**: React Context + Hooks
- **Navigation**: React Navigation 6
- **Styling**: StyleSheet with theme system

### Core Modules

#### 1. Authentication & Security
```typescript
// JWT-based authentication with biometric support
class AuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse>
  async biometricLogin(): Promise<AuthResponse>
  async refreshToken(): Promise<string>
  async logout(): Promise<void>
}

// End-to-end encryption for PHI data
class EncryptionService {
  async encrypt(data: string): Promise<string>
  async decrypt(encryptedData: string): Promise<string>
}
```

#### 2. Vital Signs Processing
```typescript
// Real-time vital signs monitoring
class VitalSignsService {
  async startMonitoring(methods: MonitoringMethod[]): Promise<void>
  async processCameraPPG(): Promise<HeartRateData>
  async processAudioBreathing(): Promise<BreathingData>
  async calculateStress(metrics: VitalMetrics): Promise<StressData>
}
```

#### 3. Session Management
```typescript
// Pranayama and meditation session control
class SessionService {
  async createSession(config: SessionConfig): Promise<Session>
  async startSession(sessionId: string): Promise<void>
  async pauseSession(sessionId: string): Promise<void>
  async completeSession(sessionId: string): Promise<SessionOutcome>
}
```

### Camera-Based Vital Signs

#### PPG (Photoplethysmography) Processing
```typescript
interface PPGProcessor {
  // Finger-based heart rate detection using rear camera
  extractPPGSignal(videoFrames: ImageData[]): PPGSignal
  
  // Signal filtering and noise reduction
  applyBandpassFilter(signal: number[], cutoffs: [number, number]): number[]
  
  // Peak detection for heart rate calculation
  detectHeartRatePeaks(filteredSignal: number[]): HeartRateData
  
  // Heart rate variability calculation
  calculateHRV(rrIntervals: number[]): HRVData
}
```

#### rPPG (Remote Photoplethysmography) Processing
```typescript
interface rPPGProcessor {
  // Face-based heart rate detection using front camera
  extractFaceROI(videoFrame: ImageData): FaceRegion
  
  // Color channel analysis for pulse signal
  extractPulseSignal(faceRegion: FaceRegion): rPPGSignal
  
  // Machine learning model for heart rate estimation
  processWithTensorFlow(signal: rPPGSignal): HeartRateData
}
```

### Audio-Based Breathing Analysis

#### Breathing Pattern Recognition
```typescript
interface BreathingAnalyzer {
  // Real-time audio processing for breathing detection
  captureAudioSignal(duration: number): AudioSignal
  
  // TensorFlow Lite model for breathing rate calculation
  analyzeBreathingRate(audioSignal: AudioSignal): BreathingData
  
  // Nostril dominance detection
  detectNostrilDominance(audioFeatures: AudioFeatures): NostrilDominance
  
  // Breathing quality assessment
  assessBreathingQuality(pattern: BreathingPattern): QualityMetrics
}
```

### Motion Sensor Integration

#### Activity and Posture Detection
```typescript
interface MotionProcessor {
  // Accelerometer data processing
  processAccelerometerData(data: AccelerometerData[]): ActivityMetrics
  
  // Gyroscope data for posture detection
  processGyroscopeData(data: GyroscopeData[]): PostureData
  
  // Step counting and movement analysis
  calculateMovementMetrics(motionData: MotionData): MovementAnalysis
}
```

## 🚀 Backend Architecture

### Node.js + Express Framework
- **Runtime**: Node.js 18+ with TypeScript
- **Framework**: Express.js with security middleware
- **Authentication**: JWT with refresh token rotation
- **Validation**: Joi schemas with sanitization
- **Logging**: Winston with structured logging

### Microservices Architecture

#### 1. Authentication Service
```typescript
// User authentication and authorization
class AuthController {
  async register(req: Request, res: Response): Promise<void>
  async login(req: Request, res: Response): Promise<void>
  async refreshToken(req: Request, res: Response): Promise<void>
  async forgotPassword(req: Request, res: Response): Promise<void>
}
```

#### 2. User Management Service
```typescript
// User profile and preferences management
class UserController {
  async getProfile(req: Request, res: Response): Promise<void>
  async updateProfile(req: Request, res: Response): Promise<void>
  async updatePreferences(req: Request, res: Response): Promise<void>
  async deleteAccount(req: Request, res: Response): Promise<void>
}
```

#### 3. Session Processing Service
```typescript
// Session data processing and analytics
class SessionController {
  async createSession(req: Request, res: Response): Promise<void>
  async uploadVitalSigns(req: Request, res: Response): Promise<void>
  async getSessionAnalytics(req: Request, res: Response): Promise<void>
  async exportSessionData(req: Request, res: Response): Promise<void>
}
```

### Security & Compliance Middleware

#### HIPAA/GDPR Compliance
```typescript
// Audit logging middleware for compliance
const auditMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Log all PHI access and modifications
  // Track user consent and data usage
  // Monitor data retention and deletion
}

// Encryption middleware for sensitive data
const encryptionMiddleware = (req: Request, res: Response, next: NextFunction) => {
  // Encrypt request/response containing PHI
  // Manage user-specific encryption keys
  // Ensure end-to-end data protection
}
```

#### Data Protection
```typescript
interface DataProtection {
  // Encrypt PHI data using AES-256-GCM
  encryptPHI(data: any, userKey: string): Promise<EncryptedData>
  
  // Decrypt PHI data for authorized access
  decryptPHI(encryptedData: EncryptedData, userKey: string): Promise<any>
  
  // Hash data for searchability while maintaining privacy
  hashForSearch(data: string, salt: string): string
  
  // Generate audit trail for all data access
  logDataAccess(userId: string, dataType: string, action: string): Promise<void>
}
```

## 🗄️ Database Architecture

### MongoDB Document Structure

#### User Document
```typescript
interface UserDocument {
  _id: ObjectId;
  email: string;
  password: string; // Hashed with bcrypt
  
  // Encrypted personal information
  profile: {
    firstName: string;
    lastName: string;
    dateOfBirth?: Date;
    healthBaseline?: HealthBaseline;
  };
  
  // User preferences and settings
  preferences: {
    notifications: NotificationSettings;
    audioVisual: AudioVisualSettings;
    privacy: PrivacySettings;
  };
  
  // Gamification data
  gamification: {
    level: number;
    experience: number;
    achievements: Achievement[];
    streakDays: number;
  };
  
  // Security and compliance
  security: {
    lastLogin: Date;
    emailVerified: boolean;
    twoFactorEnabled: boolean;
  };
  
  // PHI encryption key
  encryptionKey: string;
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### Session Document
```typescript
interface SessionDocument {
  _id: ObjectId;
  userId: ObjectId;
  
  // Session configuration
  sessionType: SessionType;
  technique?: PranayamaTechnique;
  duration: number;
  
  // Timing information
  timing: {
    startTime: Date;
    endTime?: Date;
    actualDuration?: number;
  };
  
  // Encrypted vital signs data
  vitalSigns: {
    heartRate: HeartRateData[];
    heartRateVariability: HRVData[];
    breathing: BreathingData[];
    stressLevel: StressData[];
  };
  
  // User feedback
  userExperience: {
    satisfactionRating?: number;
    stressLevelBefore?: number;
    stressLevelAfter?: number;
    notes?: string;
  };
  
  // Session outcome
  outcome: {
    completed: boolean;
    effectiveness: number;
    achievements: string[];
  };
  
  createdAt: Date;
  updatedAt: Date;
}
```

#### Vital Signs Document (High-Frequency Data)
```typescript
interface VitalSignsDocument {
  _id: ObjectId;
  userId: ObjectId;
  sessionId: ObjectId;
  
  // Time window for this data batch
  timeWindow: {
    startTime: Date;
    endTime: Date;
    sampleRate: number;
  };
  
  // Data source information
  dataSource: {
    primary: 'camera_ppg' | 'camera_rppg' | 'audio_microphone';
    device: DeviceInfo;
    quality: DataQuality;
  };
  
  // Compressed time-series data
  measurements: {
    heartRate: CompressedTimeSeries;
    breathing: CompressedTimeSeries;
    motion: CompressedTimeSeries;
  };
  
  // Analytics and derived metrics
  analytics: {
    stressLevel: number;
    coherenceScore: number;
    qualityMetrics: QualityMetrics;
  };
  
  createdAt: Date;
}
```

### Data Indexing Strategy
```javascript
// User collection indexes
db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ "security.emailVerificationToken": 1 });
db.users.createIndex({ lastActiveAt: 1 });

// Session collection indexes
db.sessions.createIndex({ userId: 1, "timing.startTime": -1 });
db.sessions.createIndex({ sessionType: 1, "timing.startTime": -1 });
db.sessions.createIndex({ "outcome.completed": 1 });

// Vital signs collection indexes
db.vitalSigns.createIndex({ userId: 1, "timeWindow.startTime": -1 });
db.vitalSigns.createIndex({ sessionId: 1 });
db.vitalSigns.createIndex({ "dataSource.primary": 1 });
```

## 🔐 Security Architecture

### Authentication Flow
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Mobile    │    │  API        │    │  Database   │
│   Client    │    │  Gateway    │    │             │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │
        │  Login Request    │                   │
        ├──────────────────►│                   │
        │                   │  Validate User    │
        │                   ├──────────────────►│
        │                   │                   │
        │                   │  User Data        │
        │                   │◄──────────────────┤
        │                   │                   │
        │                   │  Generate JWT     │
        │                   │  + Refresh Token  │
        │  Auth Response    │                   │
        │◄──────────────────┤                   │
        │                   │                   │
        │  API Request      │                   │
        │  + JWT Token      │                   │
        ├──────────────────►│                   │
        │                   │  Validate Token   │
        │                   │  Process Request  │
        │                   ├──────────────────►│
        │                   │                   │
        │  Response         │  Data             │
        │◄──────────────────┤◄──────────────────┤
```

### Encryption Layers

#### 1. Transport Layer Security
- **TLS 1.3**: All API communications encrypted
- **Certificate Pinning**: Mobile app validates server certificates
- **HSTS**: HTTP Strict Transport Security enforced

#### 2. Application Layer Encryption
```typescript
// Field-level encryption for PHI data
interface EncryptionStrategy {
  // Encrypt sensitive fields before database storage
  encryptField(data: any, fieldPath: string, key: string): Promise<EncryptedField>
  
  // Decrypt fields for authorized access
  decryptField(encryptedField: EncryptedField, key: string): Promise<any>
  
  // Key rotation for enhanced security
  rotateEncryptionKey(userId: string): Promise<string>
}
```

#### 3. Database Encryption
- **Encryption at Rest**: MongoDB encryption enabled
- **Field-Level Encryption**: Sensitive fields encrypted with user-specific keys
- **Key Management**: AWS KMS for encryption key management

### Access Control

#### Role-Based Access Control (RBAC)
```typescript
enum UserRole {
  USER = 'user',           // Standard app user
  PREMIUM = 'premium',     // Premium subscription user
  ADMIN = 'admin',         // Administrative access
  SUPPORT = 'support',     // Customer support access
}

interface Permission {
  resource: string;        // users, sessions, analytics
  action: string;          // create, read, update, delete
  conditions?: any;        // Additional constraints
}
```

## 📊 Analytics & Machine Learning

### Real-Time Processing Pipeline
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Sensor    │    │  Signal     │    │  Machine    │
│   Data      │    │ Processing  │    │ Learning    │
│ Collection  │    │             │    │  Models     │
└─────────────┘    └─────────────┘    └─────────────┘
        │                   │                   │
        │  Raw Data         │                   │
        ├──────────────────►│                   │
        │                   │  Filtered Data    │
        │                   ├──────────────────►│
        │                   │                   │
        │                   │  Predictions      │
        │                   │◄──────────────────┤
        │                   │                   │
        │  Real-time        │                   │
        │  Feedback         │                   │
        │◄──────────────────┤                   │
```

### TensorFlow Lite Models

#### Heart Rate Detection Model
```python
# Model architecture for rPPG heart rate estimation
model = tf.keras.Sequential([
    tf.keras.layers.Conv1D(32, 3, activation='relu'),
    tf.keras.layers.Conv1D(64, 3, activation='relu'),
    tf.keras.layers.GlobalAveragePooling1D(),
    tf.keras.layers.Dense(50, activation='relu'),
    tf.keras.layers.Dense(1, activation='linear')  # Heart rate output
])

# Training data: facial video segments with ground truth HR
# Input: 30-second video clips (900 frames at 30 fps)
# Output: Heart rate in BPM
```

#### Breathing Analysis Model
```python
# Model for breathing pattern recognition from audio
model = tf.keras.Sequential([
    tf.keras.layers.LSTM(64, return_sequences=True),
    tf.keras.layers.LSTM(32),
    tf.keras.layers.Dense(50, activation='relu'),
    tf.keras.layers.Dense(3, activation='softmax')  # Inhale/Hold/Exhale
])

# Training data: breathing audio with labeled phases
# Input: 16kHz audio spectrograms
# Output: Breathing phase probabilities
```

### Analytics Engine

#### Session Analytics
```typescript
interface SessionAnalytics {
  // Real-time metrics during session
  calculateRealTimeMetrics(vitalSigns: VitalSigns): RealTimeMetrics
  
  // Post-session analysis
  analyzeSessionOutcome(session: Session): SessionOutcome
  
  // Progress tracking over time
  calculateProgressMetrics(sessions: Session[]): ProgressMetrics
  
  // Personalized recommendations
  generateRecommendations(userHistory: UserHistory): Recommendation[]
}
```

#### Stress Assessment Algorithm
```typescript
class StressCalculator {
  calculateStressLevel(metrics: {
    heartRate: number;
    hrv: number;
    breathingRate: number;
    movement?: number;
  }): StressLevel {
    // Multi-factor stress assessment
    // Weighted combination of physiological indicators
    // Personalized based on user baseline
    // Real-time adaptation during session
  }
}
```

## 🎮 Gamification System

### Achievement Engine
```typescript
interface AchievementSystem {
  // Check for achievement unlocks
  checkAchievements(session: Session, userHistory: UserHistory): Achievement[]
  
  // Calculate experience points
  calculateExperience(sessionOutcome: SessionOutcome): number
  
  // Update user level and progression
  updateProgression(userId: string, experience: number): Promise<Progression>
  
  // Generate personalized challenges
  createChallenges(userPreferences: UserPreferences): Challenge[]
}
```

### Game Integration
```typescript
// Breathing-controlled Match-3 game
interface BreathingGame {
  // Map breathing rhythm to game controls
  mapBreathingToGameInput(breathingData: BreathingData): GameInput
  
  // Adaptive difficulty based on breathing consistency
  adjustDifficulty(breathingQuality: number): DifficultyLevel
  
  // Score calculation based on breathing performance
  calculateScore(gamePerformance: GamePerformance, breathingMetrics: BreathingMetrics): Score
}
```

## 🔌 Integration Architecture

### Third-Party Integrations

#### Apple HealthKit Integration
```typescript
interface HealthKitService {
  // Write session data to HealthKit
  writeHealthData(sessionData: SessionData): Promise<void>
  
  // Read user's health baseline from HealthKit
  readHealthBaseline(): Promise<HealthBaseline>
  
  // Sync vital signs with Health app
  syncVitalSigns(vitalSigns: VitalSigns): Promise<void>
}
```

#### Google Fit Integration
```typescript
interface GoogleFitService {
  // Upload session data to Google Fit
  uploadSessionData(sessionData: SessionData): Promise<void>
  
  // Read user's fitness data
  readFitnessData(dataTypes: string[]): Promise<FitnessData>
  
  // Sync heart rate and activity data
  syncHealthMetrics(metrics: HealthMetrics): Promise<void>
}
```

### Cloud Services Architecture

#### AWS Integration
```typescript
interface AWSServices {
  // S3 for file storage
  s3: {
    uploadFile(file: File, key: string): Promise<string>
    downloadFile(key: string): Promise<File>
    deleteFile(key: string): Promise<void>
  }
  
  // Lambda for serverless processing
  lambda: {
    processAnalytics(sessionData: SessionData): Promise<Analytics>
    generateInsights(userData: UserData): Promise<Insights>
  }
  
  // CloudWatch for monitoring
  cloudWatch: {
    logMetric(metricName: string, value: number): Promise<void>
    createAlert(condition: AlertCondition): Promise<void>
  }
}
```

## 📈 Monitoring & Observability

### Application Monitoring
```typescript
interface MonitoringSystem {
  // Performance metrics
  trackPerformance(operation: string, duration: number): void
  
  // Error tracking
  logError(error: Error, context: ErrorContext): void
  
  // User behavior analytics
  trackUserAction(action: UserAction): void
  
  // Health check endpoints
  healthCheck(): Promise<HealthStatus>
}
```

### Compliance Monitoring
```typescript
interface ComplianceMonitoring {
  // HIPAA audit logging
  logPHIAccess(userId: string, dataType: string, action: string): void
  
  // GDPR compliance tracking
  trackDataProcessing(userId: string, purpose: string, legalBasis: string): void
  
  // Data retention monitoring
  checkDataRetention(): Promise<RetentionReport>
  
  // Consent management
  trackConsent(userId: string, consentType: string, granted: boolean): void
}
```

This architecture provides a robust, scalable, and compliant foundation for the Pranayama Coach application, ensuring high-quality user experience while maintaining strict security and regulatory compliance standards.