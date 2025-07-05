# Pranayama Coach - Complete Setup Guide

This guide provides step-by-step instructions for setting up the Pranayama Coach application for development and production environments.

## 🚀 Quick Start

### Prerequisites Checklist
- [ ] Node.js 18+ installed
- [ ] React Native CLI installed
- [ ] MongoDB 6.0+ running
- [ ] iOS development tools (macOS only)
- [ ] Android Studio and SDK
- [ ] AWS account for cloud services
- [ ] Git for version control

## 📋 Development Environment Setup

### 1. System Prerequisites

#### Node.js & npm
```bash
# Install Node.js 18+ using nvm (recommended)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
nvm alias default 18

# Verify installation
node --version  # Should be 18+
npm --version
```

#### React Native CLI
```bash
# Install React Native CLI globally
npm install -g react-native-cli

# Install dependencies for React Native
npm install -g @react-native-community/cli
```

#### MongoDB
```bash
# macOS (using Homebrew)
brew tap mongodb/brew
brew install mongodb-community@6.0
brew services start mongodb/brew/mongodb-community

# Ubuntu/Debian
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod

# Verify MongoDB installation
mongo --version
```

#### iOS Development (macOS only)
```bash
# Install Xcode from App Store
# Install Xcode Command Line Tools
xcode-select --install

# Install CocoaPods
sudo gem install cocoapods
```

#### Android Development
```bash
# Download and install Android Studio from https://developer.android.com/studio
# Set up Android SDK and create virtual device
# Add to your shell profile (.zshrc or .bash_profile):
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/emulator
export PATH=$PATH:$ANDROID_HOME/tools
export PATH=$PATH:$ANDROID_HOME/tools/bin
export PATH=$PATH:$ANDROID_HOME/platform-tools
```

### 2. Clone and Setup Repository

```bash
# Clone the repository
git clone https://github.com/your-org/pranayama-coach.git
cd pranayama-coach

# Create environment files from templates
cp backend/.env.example backend/.env
cp apps/pranayama-coach-basic/.env.example apps/pranayama-coach-basic/.env

# Install backend dependencies
cd backend
npm install

# Install basic app dependencies
cd ../apps/pranayama-coach-basic
npm install

# iOS setup (macOS only)
cd ios
pod install
cd ..
```

## ⚙️ Configuration

### 1. Backend Configuration

Create and configure `backend/.env`:

```env
# Database Configuration
MONGODB_URI=mongodb://localhost:27017/pranayama-coach-dev
MONGODB_SSL=false
MONGODB_AUTH_SOURCE=admin

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Server Configuration
PORT=3000
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000,http://localhost:8081

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AWS Configuration (for production)
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1
S3_BUCKET=pranayama-coach-dev

# Email Configuration (for production)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=your-sendgrid-api-key
EMAIL_FROM=noreply@pranayamacoach.com

# Apple Health Integration
APPLE_HEALTH_CLIENT_ID=your-apple-health-client-id
APPLE_HEALTH_CLIENT_SECRET=your-apple-health-secret

# Google Fit Integration
GOOGLE_FIT_CLIENT_ID=your-google-fit-client-id
GOOGLE_FIT_CLIENT_SECRET=your-google-fit-secret

# Compliance and Logging
HIPAA_LOGGING_ENABLED=true
GDPR_COMPLIANCE_ENABLED=true
AUDIT_LOG_RETENTION_DAYS=2555  # 7 years for HIPAA
```

### 2. Mobile App Configuration

Create and configure `apps/pranayama-coach-basic/.env`:

```env
# API Configuration
API_BASE_URL=http://localhost:3000/api
API_TIMEOUT=10000

# Feature Flags
ENABLE_CAMERA_PPG=true
ENABLE_CAMERA_RPPG=true
ENABLE_AUDIO_BREATHING=true
ENABLE_MOTION_SENSORS=true
ENABLE_GAMIFICATION=true

# Analytics
ENABLE_ANALYTICS=true
ANALYTICS_ENDPOINT=https://analytics.pranayamacoach.com

# Debug Settings
DEBUG_MODE=true
LOG_LEVEL=debug
ENABLE_FLIPPER=true

# Third-party Keys
APPLE_HEALTH_ENABLED=true
GOOGLE_FIT_ENABLED=true
```

### 3. Database Setup

Initialize MongoDB with required collections and indexes:

```bash
# Connect to MongoDB
mongo pranayama-coach-dev

# Create collections and indexes
db.users.createIndex({ email: 1 }, { unique: true })
db.users.createIndex({ "security.emailVerificationToken": 1 })
db.users.createIndex({ lastActiveAt: 1 })

db.sessions.createIndex({ userId: 1, "timing.startTime": -1 })
db.sessions.createIndex({ sessionType: 1, "timing.startTime": -1 })
db.sessions.createIndex({ "outcome.completed": 1 })

db.vitalsigns.createIndex({ userId: 1, "timeWindow.startTime": -1 })
db.vitalsigns.createIndex({ sessionId: 1 })
db.vitalsigns.createIndex({ "dataSource.primary": 1 })

db.auditlogs.createIndex({ timestamp: -1 })
db.auditlogs.createIndex({ "actor.userId": 1, timestamp: -1 })
db.auditlogs.createIndex({ eventType: 1, timestamp: -1 })
```

## 🏃‍♂️ Running the Application

### 1. Start Backend Services

```bash
# Start MongoDB (if not running as service)
mongod --config /usr/local/etc/mongod.conf

# Start the backend server
cd backend
npm run dev

# The server should start on http://localhost:3000
# API documentation available at http://localhost:3000/api/docs
```

### 2. Start Mobile Application

```bash
# Start Metro bundler
cd apps/pranayama-coach-basic
npm start

# In separate terminals, run on devices:

# iOS Simulator
npm run ios

# Android Emulator
npm run android

# Physical iOS device
npm run ios --device "Your Device Name"

# Physical Android device (with USB debugging enabled)
npm run android --deviceId [DEVICE_ID]
```

### 3. Verify Installation

#### Backend Health Check
```bash
# Test backend health endpoint
curl http://localhost:3000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "memory": { ... }
}
```

#### Mobile App Testing
- [ ] App loads without errors
- [ ] Registration/login flow works
- [ ] Camera permissions are requested
- [ ] Microphone permissions are requested
- [ ] Motion sensor data is accessible
- [ ] Real-time vital signs display

## 🧪 Testing Setup

### 1. Backend Testing

```bash
cd backend

# Install test dependencies
npm install --save-dev jest supertest

# Run unit tests
npm test

# Run integration tests
npm run test:integration

# Run with coverage
npm run test:coverage
```

### 2. Mobile App Testing

```bash
cd apps/pranayama-coach-basic

# Install test dependencies
npm install --save-dev @testing-library/react-native jest

# Run unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run E2E tests (requires Detox setup)
npm run test:e2e
```

### 3. Load Testing

```bash
# Install artillery for load testing
npm install -g artillery

# Run API load tests
artillery quick --count 10 --num 50 http://localhost:3000/api/auth/login
```

## 🚀 Production Deployment

### 1. Environment Preparation

#### Production Environment Variables
```env
# Production backend .env
NODE_ENV=production
JWT_SECRET=super-secure-production-jwt-secret
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/pranayama-coach
SSL_CERT_PATH=/path/to/ssl/cert.pem
SSL_KEY_PATH=/path/to/ssl/key.pem

# Production security
HELMET_ENABLED=true
RATE_LIMITING_ENABLED=true
CORS_ORIGIN=https://app.pranayamacoach.com

# Production AWS
AWS_ACCESS_KEY_ID=production-access-key
AWS_SECRET_ACCESS_KEY=production-secret-key
S3_BUCKET=pranayama-coach-production

# Monitoring
NEW_RELIC_LICENSE_KEY=your-new-relic-key
SENTRY_DSN=your-sentry-dsn
```

### 2. Backend Deployment

#### Using Docker
```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and deploy
docker build -t pranayama-coach-backend .
docker run -p 3000:3000 --env-file .env pranayama-coach-backend
```

#### Using PM2
```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'pranayama-coach-api',
    script: 'dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Deploy with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### 3. Mobile App Deployment

#### iOS App Store Deployment
```bash
cd apps/pranayama-coach-basic

# Build for release
npm run build:ios:release

# Archive and upload to App Store Connect
xcodebuild -workspace ios/PranayamaCoachBasic.xcworkspace \
  -scheme PranayamaCoachBasic \
  -configuration Release \
  -archivePath build/PranayamaCoachBasic.xcarchive \
  archive

# Upload to App Store Connect using Xcode or Transporter
```

#### Google Play Store Deployment
```bash
cd apps/pranayama-coach-basic

# Generate release APK
cd android
./gradlew assembleRelease

# Generate signed bundle
./gradlew bundleRelease

# Upload to Google Play Console
```

### 4. Database Migration

```bash
# Create migration script
cat > migrate.js << EOF
const { MongoClient } = require('mongodb');

async function migrate() {
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  
  const db = client.db();
  
  // Add any data migrations here
  console.log('Migration completed');
  
  await client.close();
}

migrate().catch(console.error);
EOF

# Run migration
node migrate.js
```

## 🔧 Troubleshooting

### Common Issues

#### Backend Issues

**MongoDB Connection Failed**
```bash
# Check MongoDB status
brew services list | grep mongodb  # macOS
systemctl status mongod            # Linux

# Check MongoDB logs
tail -f /usr/local/var/log/mongodb/mongo.log  # macOS
tail -f /var/log/mongodb/mongod.log           # Linux

# Test connection
mongo --eval "db.adminCommand('ismaster')"
```

**Port Already in Use**
```bash
# Find process using port 3000
lsof -ti:3000

# Kill process
kill -9 $(lsof -ti:3000)
```

#### Mobile App Issues

**Metro Bundler Issues**
```bash
# Clear React Native cache
npx react-native start --reset-cache

# Clear node modules and reinstall
rm -rf node_modules
npm install
```

**iOS Build Issues**
```bash
# Clean iOS build
cd ios
rm -rf build
rm -rf ~/Library/Developer/Xcode/DerivedData
pod install --repo-update

# Reset simulator
xcrun simctl erase all
```

**Android Build Issues**
```bash
# Clean Android build
cd android
./gradlew clean

# Clear Gradle cache
rm -rf ~/.gradle/caches/
```

#### Permission Issues

**Camera/Microphone Permissions (iOS)**
Add to `ios/PranayamaCoachBasic/Info.plist`:
```xml
<key>NSCameraUsageDescription</key>
<string>Camera access is required for heart rate monitoring</string>
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is required for breathing analysis</string>
```

**Camera/Microphone Permissions (Android)**
Add to `android/app/src/main/AndroidManifest.xml`:
```xml
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.VIBRATE" />
```

### Performance Optimization

#### Backend Performance
```bash
# Monitor memory usage
node --inspect dist/index.js

# Enable performance profiling
NODE_ENV=production npm run start:profile
```

#### Mobile App Performance
```bash
# Enable Flipper for debugging
npm run flipper

# Run performance tests
npm run test:performance

# Analyze bundle size
npx react-native bundle --platform ios --dev false --entry-file index.js --bundle-output main.jsbundle --analyze
```

### Security Checklist

#### Pre-Production Security Review
- [ ] Environment variables secured
- [ ] Database access restricted
- [ ] API rate limiting enabled
- [ ] CORS properly configured
- [ ] SSL certificates installed
- [ ] Audit logging enabled
- [ ] Data encryption verified
- [ ] Vulnerability scan completed
- [ ] Penetration testing done

#### Compliance Checklist
- [ ] HIPAA risk assessment completed
- [ ] GDPR privacy impact assessment done
- [ ] Data retention policies implemented
- [ ] User consent mechanisms in place
- [ ] Audit trail verification
- [ ] Incident response plan prepared

## 📞 Support and Resources

### Documentation
- [API Documentation](./API_DOCS.md)
- [Architecture Guide](./ARCHITECTURE.md)
- [Security Guide](./SECURITY.md)
- [Compliance Guide](./COMPLIANCE.md)

### Development Resources
- [React Native Documentation](https://reactnative.dev/docs/getting-started)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [TensorFlow Lite](https://www.tensorflow.org/lite)
- [OpenCV for React Native](https://github.com/brainhubeu/react-native-opencv3)

### Community and Support
- **Issues**: [GitHub Issues](https://github.com/your-org/pranayama-coach/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/pranayama-coach/discussions)
- **Discord**: [Community Discord Server](https://discord.gg/pranayamacoach)
- **Email**: support@pranayamacoach.com

### Emergency Contacts
- **Security Issues**: security@pranayamacoach.com
- **Production Incidents**: incidents@pranayamacoach.com
- **HIPAA/Compliance**: compliance@pranayamacoach.com

---

This setup guide provides a comprehensive foundation for developing and deploying the Pranayama Coach application. Follow each section carefully and verify each step before proceeding to ensure a smooth development experience.