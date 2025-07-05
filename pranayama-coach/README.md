# Pranayama Coach - Complete Mobile Health Application

A comprehensive cross-platform mobile application for pranayama (yogic breathing) and meditation with real-time vital signs monitoring, built with React Native and Node.js.

## 🎯 Overview

Pranayama Coach provides guided breathing exercises and meditation activities with real-time health monitoring using smartphone cameras (PPG/rPPG), microphone (breathing analysis), and motion sensors. The app includes gamification, analytics, and a stress/calm meter, with two versions:

1. **Basic Version (Phone-Only)**: Camera-based vital signs monitoring, audio breathing analysis
2. **Pro Version (Device Integration)**: Additional BLE sensor support for enhanced accuracy

## 🚀 Quick Deployment

**Ready to deploy to production?**

```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run complete deployment pipeline
./scripts/deploy.sh full
```

📚 **For comprehensive deployment instructions, see [DEPLOYMENT_README.md](DEPLOYMENT_README.md)**

### Production Stack
- **Backend**: Railway (Node.js + MongoDB Atlas)
- **Web Dashboard**: Netlify (React Admin Panel)
- **Mobile Apps**: App Store Connect & Google Play Console
- **CI/CD**: GitHub Actions (Automated testing & deployment)

### Available Deployments
- 🌐 **Web Dashboard**: Real-time analytics, user management, system monitoring
- 📱 **Mobile Apps**: iOS & Android with automated app store deployment
- 🔧 **Backend API**: Scalable Node.js backend with MongoDB & Redis
- 🔒 **Security**: HIPAA/GDPR compliant with end-to-end encryption

## 🏗️ Architecture

### Frontend (React Native)
- **Platform Support**: iOS 12.0+, Android 5.0+
- **Storage**: 500 MB minimum
- **Real-time Processing**: TensorFlow Lite for ML models
- **Camera Integration**: OpenCV for signal processing
- **Audio Analysis**: Advanced breathing pattern recognition

### Backend (Node.js/MongoDB)
- **Security**: HIPAA/GDPR compliant with end-to-end encryption
- **Cloud Storage**: AWS S3 for data storage
- **Analytics**: AWS Lambda for data processing
- **APIs**: RESTful with third-party integrations (Apple Health, Google Fit)

### Key Features
- **Pranayama Techniques**: Nadi Shodhana, box breathing, Ujjayi, and more
- **Meditation Zone**: Guided walks, indoor meditation, activity tracking
- **Vital Signs**: Heart rate, HRV, SpO2, breathing rate monitoring
- **Gamification**: Match-3 games, challenges, achievements
- **Analytics**: Comprehensive health tracking and insights

## 📱 Application Versions

### Basic Version (Phone-Only)
Located in `/apps/pranayama-coach-basic/`

**Features:**
- Camera-based PPG/rPPG for heart rate and HRV
- Microphone breathing analysis
- Motion sensor integration
- All pranayama and meditation features
- Complete gamification system
- Basic analytics and progress tracking

**Vital Signs Sources:**
- Rear camera PPG (finger placement)
- Front camera rPPG (facial analysis)
- Microphone for breathing pattern analysis
- Phone accelerometer/gyroscope for movement

### Pro Version (BLE Integration)
Located in `/apps/pranayama-coach-pro/` (to be created)

**Additional Features:**
- Modular BLE sensor framework
- Support for heart rate monitors (Polar H10, Garmin, etc.)
- Pulse oximeters (Nonin 3012LP, etc.)
- Bluetooth headset integration
- Enhanced accuracy and reliability

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+
- React Native CLI
- MongoDB
- AWS Account (for cloud storage)
- OpenCV for React Native
- TensorFlow Lite

### Backend Setup

1. **Install Dependencies:**
```bash
cd backend
npm install
```

2. **Environment Configuration:**
Create `.env` file:
```env
# Database
MONGODB_URI=mongodb://localhost:27017/pranayama-coach
MONGODB_SSL=true

# JWT Security
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=pranayama-coach-data

# API Configuration
PORT=3000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081

# Compliance
COMPLIANCE_MODE=enabled
HIPAA_LOGGING=true
GDPR_COMPLIANCE=true

# External Services
EXTERNAL_AUDIT_ENDPOINT=https://audit.yourcompany.com/api
APPLE_HEALTH_API_KEY=your-apple-health-key
GOOGLE_FIT_API_KEY=your-google-fit-key
```

3. **Start Backend:**
```bash
npm run dev
```

### Frontend Setup (Basic Version)

1. **Install Dependencies:**
```bash
cd apps/pranayama-coach-basic
npm install
```

2. **iOS Setup:**
```bash
cd ios
pod install
cd ..
```

3. **Start Metro Bundler:**
```bash
npm start
```

4. **Run on Device:**
```bash
# iOS
npm run ios

# Android
npm run android
```

## 📊 Database Schema

### User Model
```typescript
interface User {
  email: string;
  profile: UserProfile;
  healthBaseline: HealthBaseline;
  preferences: UserPreferences;
  subscription: Subscription;
  gamification: Gamification;
  devices: Device[];
  security: SecuritySettings;
  encryptionKey: string; // For PHI encryption
}
```

### Session Model
```typescript
interface Session {
  userId: ObjectId;
  sessionType: SessionType;
  pranayama?: PranayamaSession;
  meditation?: MeditationSession;
  timing: SessionTiming;
  vitalSigns: VitalSigns;
  userExperience: UserExperience;
  outcome: SessionOutcome;
}
```

### VitalSigns Model
```typescript
interface VitalSigns {
  heartRate: HeartRateData[];
  heartRateVariability: HRVData[];
  oxygenSaturation: SpO2Data[];
  breathing: BreathingData[];
  stressLevel: StressData[];
  dataQuality: DataQuality;
  analytics: SessionAnalytics;
}
```

## 🔒 Security & Compliance

### HIPAA Compliance
- **Encryption**: AES-256-GCM for data at rest and in transit
- **Audit Logging**: Comprehensive access and modification tracking
- **User Rights**: Data export and deletion capabilities
- **Access Controls**: Role-based permissions and session management

### GDPR Compliance
- **Consent Management**: Granular consent tracking and withdrawal
- **Data Minimization**: Collection limited to necessary health data
- **Right to Erasure**: Complete data deletion capabilities
- **Data Portability**: Export in standard formats

### Security Features
- **End-to-End Encryption**: All PHI encrypted with user-specific keys
- **Token Management**: JWT with refresh token rotation
- **Rate Limiting**: API protection against abuse
- **Audit Trail**: Complete action logging for compliance

## 🧠 Machine Learning & Signal Processing

### Heart Rate Detection
```typescript
// Camera PPG Processing
class PPGProcessor {
  // Bandpass filter for heart rate range (0.7-3.5 Hz)
  applyBandpassFilter(signal: number[], sampleRate: number): number[]
  
  // Peak detection with adaptive thresholding
  detectPeaks(signal: number[]): number[]
  
  // R-R interval calculation for HRV
  calculateRRIntervals(peaks: number[], sampleRate: number): number[]
}
```

### Breathing Analysis
```typescript
// Audio breathing pattern recognition
class BreathingAnalyzer {
  // TensorFlow Lite model for breathing rate
  analyzeBreathingPattern(audioSignal: AudioSignal): BreathingData
  
  // Nostril dominance detection
  detectNostrilDominance(audioFeatures: AudioFeatures): string
  
  // Breathing quality assessment
  assessBreathingQuality(pattern: BreathingPattern): number
}
```

### Stress Assessment
```typescript
// Multi-metric stress calculation
class StressCalculator {
  calculateStressLevel(metrics: {
    heartRate: number;
    hrv: number;
    breathingRate: number;
    movement?: number;
  }): StressLevel
}
```

## 📱 Core Components

### Session Management
```typescript
// Session controller with real-time monitoring
const SessionScreen: React.FC = () => {
  const { startMonitoring, currentVitalSigns } = useVitalSigns();
  const { playGuidance, breathAnalysis } = useAudio();
  
  // Real-time vital signs display
  // Breathing guidance with visual pacer
  // Adaptive coaching based on performance
};
```

### Vital Signs Monitoring
```typescript
// Real-time data collection and processing
const VitalSignsProvider: React.FC = () => {
  // Camera-based PPG/rPPG processing
  // Audio breathing analysis
  // Motion sensor integration
  // Data quality assessment
  // Stress level calculation
};
```

### Audio Coaching
```typescript
// Adaptive audio guidance system
const AudioProvider: React.FC = () => {
  // Voice guidance with breathing cues
  // Background sounds and music
  // Real-time breathing analysis
  // Adaptive coaching adjustments
};
```

## 🎮 Gamification System

### Achievements
- **Breathing Mastery**: Perfect breathing pattern achievements
- **Consistency**: Daily practice streaks
- **Progress**: Personal best improvements
- **Challenges**: Weekly and monthly goals

### Games
- **Breathing Match-3**: Tile matching controlled by breathing rhythm
- **Walking Challenges**: Step count and distance goals
- **Meditation Streaks**: Consecutive day achievements

### Progression
- **Experience Points**: Earned through session completion
- **Levels**: Unlock advanced techniques and features
- **Badges**: Visual recognition of achievements
- **Leaderboards**: Anonymous progress comparison

## 📈 Analytics & Insights

### Health Metrics
- **Heart Rate Trends**: Resting HR, max HR, recovery patterns
- **HRV Analysis**: Stress recovery and autonomic balance
- **Breathing Patterns**: Rate consistency, technique mastery
- **Sleep Impact**: Correlation with session timing

### Progress Tracking
- **Session Analytics**: Completion rates, effectiveness scores
- **Technique Mastery**: Skill progression over time
- **Stress Management**: Stress reduction effectiveness
- **Goal Achievement**: Personal target tracking

### Data Export
- **CSV Reports**: Detailed metric exports
- **PDF Summaries**: Visual progress reports
- **Health App Integration**: Apple Health, Google Fit sync
- **Third-Party APIs**: Wearable device data sharing

## 🔧 Development Guidelines

### Code Structure
```
src/
├── components/        # Reusable UI components
├── screens/          # Screen components
├── context/          # React Context providers
├── services/         # Business logic and API calls
├── types/           # TypeScript type definitions
├── utils/           # Helper functions
└── __tests__/       # Test files
```

### State Management
- **Context API**: User, vital signs, audio state
- **Local State**: Component-specific state
- **Async Storage**: Persistent data (encrypted)
- **Remote State**: Server synchronization

### Performance Optimization
- **Lazy Loading**: Screen and component lazy loading
- **Memoization**: React.memo and useMemo for expensive operations
- **Background Processing**: Vital signs processing in background
- **Data Compression**: Efficient data storage and transmission

## 🧪 Testing Strategy

### Unit Tests
```bash
npm test
```

### Integration Tests
```bash
npm run test:integration
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Performance Tests
- **Vital Signs Accuracy**: Camera and audio processing validation
- **Real-time Processing**: <100ms latency verification
- **Memory Usage**: Optimization for extended sessions
- **Battery Impact**: Power consumption monitoring

## 🚀 Deployment

### Backend Deployment
```bash
# Production build
npm run build

# Deploy to AWS/Azure/GCP
npm run deploy:production
```

### Mobile App Deployment
```bash
# iOS
npx react-native run-ios --configuration Release

# Android
npx react-native run-android --variant=release
```

### Environment Configuration
- **Development**: Local servers, test data
- **Staging**: Production-like environment for testing
- **Production**: Full security, monitoring, and compliance

## 📋 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh-token` - Token refresh
- `POST /api/auth/forgot-password` - Password reset

### Session Endpoints
- `POST /api/sessions` - Create new session
- `GET /api/sessions` - Get user sessions
- `PUT /api/sessions/:id` - Update session
- `DELETE /api/sessions/:id` - Delete session

### Vital Signs Endpoints
- `POST /api/vital-signs` - Upload vital signs data
- `GET /api/vital-signs` - Get user vital signs
- `GET /api/vital-signs/analytics` - Get analytics data

### Analytics Endpoints
- `GET /api/analytics/summary` - Progress summary
- `GET /api/analytics/trends` - Trend analysis
- `POST /api/analytics/export` - Data export

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Implement changes with tests
4. Submit pull request with detailed description
5. Ensure compliance and security requirements

## 📄 License

This project is licensed under the MIT License with additional health data protection clauses for HIPAA/GDPR compliance.

## 📞 Support

For technical support or questions:
- **Email**: support@pranayamacoach.com
- **Documentation**: https://docs.pranayamacoach.com
- **Issues**: GitHub Issues for bug reports
- **Community**: Discord server for discussions

---

**Note**: This application handles sensitive health data. Ensure proper security measures, compliance requirements, and user consent procedures are implemented before deployment in production environments.