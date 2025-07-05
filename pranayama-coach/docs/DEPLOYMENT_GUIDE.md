# 🚀 Complete Production Deployment Guide

This guide covers the complete deployment of Pranayama Coach to production, including backend API deployment, web dashboard, and mobile app store submission.

## 📋 Pre-Deployment Checklist

### Security & Compliance
- [ ] Environment variables secured and validated
- [ ] SSL certificates configured
- [ ] HIPAA/GDPR compliance verified
- [ ] Data encryption tested
- [ ] Security audit completed
- [ ] Penetration testing passed

### Backend Readiness
- [ ] Database indexes optimized
- [ ] API performance tested (load testing)
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery tested
- [ ] Health check endpoints working
- [ ] Documentation updated

### Mobile App Readiness
- [ ] App tested on multiple devices
- [ ] Camera PPG/rPPG functionality verified
- [ ] Audio breathing analysis tested
- [ ] Offline functionality confirmed
- [ ] App Store metadata prepared
- [ ] Screenshots and assets ready

## 🏗️ Deployment Architecture

```
Production Environment Layout:

┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Mobile Apps   │    │   Backend API   │    │   Database      │
│                 │    │                 │    │                 │
│ • iOS App Store │◄──►│ • Railway       │◄──►│ • MongoDB Atlas │
│ • Google Play   │    │ • Auto-scaling  │    │ • Encrypted     │
│ • TestFlight    │    │ • Load Balanced │    │ • Geo-replicated│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  Web Dashboard  │
                       │                 │
                       │ • Netlify       │
                       │ • Admin Panel   │
                       │ • Analytics UI  │
                       └─────────────────┘
```

## 🖥️ Backend Deployment (Railway)

### Step 1: Prepare MongoDB Atlas

```bash
# 1. Create MongoDB Atlas cluster
# Visit: https://cloud.mongodb.com
# Create new cluster with M10 or higher for production

# 2. Configure security
# - Enable authentication
# - Set up network access (IP whitelist)
# - Create database user with appropriate permissions

# 3. Get connection string
MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/pranayama-coach?retryWrites=true&w=majority"
```

### Step 2: Deploy to Railway

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login to Railway
railway login

# 3. Initialize project
cd backend
railway init

# 4. Set environment variables
railway variables set NODE_ENV=production
railway variables set MONGODB_URI="your-mongodb-atlas-uri"
railway variables set JWT_SECRET="your-super-secure-jwt-secret"
railway variables set AWS_ACCESS_KEY_ID="your-aws-key"
railway variables set AWS_SECRET_ACCESS_KEY="your-aws-secret"

# 5. Deploy
railway up
```

### Step 3: Configure Domain and SSL

```bash
# 1. Add custom domain in Railway dashboard
# Domain: api.pranayamacoach.com

# 2. Configure DNS records
# Type: CNAME
# Name: api
# Value: your-railway-app.railway.app

# 3. SSL is automatically configured by Railway
```

### Step 4: Set Up Monitoring

```bash
# Add monitoring environment variables
railway variables set SENTRY_DSN="your-sentry-dsn"
railway variables set NEW_RELIC_LICENSE_KEY="your-newrelic-key"

# Configure uptime monitoring
# Use Uptime Robot or Pingdom to monitor:
# - https://api.pranayamacoach.com/health
# - Response time < 500ms
# - Uptime > 99.9%
```

## 🌐 Web Dashboard Deployment (Netlify)

### Step 1: Build Dashboard

```bash
cd web-dashboard

# Install dependencies
npm install

# Build for production
npm run build

# Test build locally
npx serve -s build
```

### Step 2: Deploy to Netlify

```bash
# Option 1: Netlify CLI
npm install -g netlify-cli
netlify login
netlify init
netlify deploy --prod --dir=build

# Option 2: GitHub integration (recommended)
# 1. Push code to GitHub
# 2. Connect repository in Netlify dashboard
# 3. Configure build settings:
#    - Build command: npm run build
#    - Publish directory: build
#    - Environment variables:
#      REACT_APP_API_URL=https://api.pranayamacoach.com
```

### Step 3: Configure Custom Domain

```bash
# 1. Add domain in Netlify dashboard
# Domain: admin.pranayamacoach.com

# 2. Configure DNS
# Type: CNAME
# Name: admin
# Value: your-netlify-site.netlify.app

# 3. Enable HTTPS (automatic with Netlify)
```

## 📱 Mobile App Deployment

### iOS App Store Submission

#### Step 1: Prepare iOS Build

```bash
cd apps/pranayama-coach-basic

# Update version in package.json and iOS project
# Version: 1.0.0
# Build: 1

# Install dependencies
npm install
cd ios && pod install && cd ..

# Create production build
npx react-native run-ios --configuration Release
```

#### Step 2: Archive and Submit

```bash
# Archive the app
cd ios
xcodebuild -workspace PranayamaCoachBasic.xcworkspace \
           -scheme PranayamaCoachBasic \
           -configuration Release \
           -archivePath build/PranayamaCoachBasic.xcarchive \
           archive

# Export for App Store
xcodebuild -exportArchive \
           -archivePath build/PranayamaCoachBasic.xcarchive \
           -exportPath build/ \
           -exportOptionsPlist ExportOptions.plist

# Upload to App Store Connect
xcrun altool --upload-app \
             --type ios \
             --file build/PranayamaCoachBasic.ipa \
             --username "your-apple-id@email.com" \
             --password "app-specific-password"
```

#### Step 3: App Store Connect Configuration

1. **App Information**
   - Upload app metadata from `/app-store/ios/AppStoreMetadata.md`
   - Add screenshots (required: 6.7", 6.5", 5.5", and iPad Pro)
   - Set pricing and availability

2. **App Privacy**
   - Configure data collection practices
   - Health data: Collected for app functionality
   - Analytics: Anonymous usage data

3. **App Review Information**
   - Demo account: demo@pranayamacoach.com / Demo123!
   - Review notes: Include testing instructions for camera/microphone

### Android Google Play Submission

#### Step 1: Prepare Android Build

```bash
cd apps/pranayama-coach-basic

# Generate upload keystore (production)
keytool -genkey -v -keystore upload-keystore.jks \
        -alias upload \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000

# Build signed APK
cd android
./gradlew assembleRelease \
  -Pandroid.injected.signing.store.file=upload-keystore.jks \
  -Pandroid.injected.signing.store.password=KEYSTORE_PASSWORD \
  -Pandroid.injected.signing.key.alias=upload \
  -Pandroid.injected.signing.key.password=KEY_PASSWORD

# Build App Bundle (recommended)
./gradlew bundleRelease
```

#### Step 2: Google Play Console Setup

1. **App Details**
   - Upload app metadata from `/app-store/android/PlayStoreMetadata.md`
   - Add screenshots for phone and tablet
   - Set content rating and target audience

2. **Privacy & Security**
   - Upload privacy policy
   - Configure data safety section
   - Set up app signing by Google Play

3. **Release Management**
   - Upload AAB file to Internal Testing
   - Add release notes
   - Review and publish

## 🔄 CI/CD Pipeline Setup

### GitHub Secrets Configuration

```bash
# Repository secrets to configure:

# Backend deployment
RAILWAY_PROJECT_ID=your-project-id
RAILWAY_TOKEN=your-railway-token

# iOS deployment
APPLE_ID_USERNAME=your-apple-id@email.com
APPLE_ID_PASSWORD=app-specific-password

# Android deployment
ANDROID_KEYSTORE=base64-encoded-keystore
ANDROID_KEYSTORE_PASSWORD=keystore-password
ANDROID_KEY_ALIAS=upload
ANDROID_KEY_PASSWORD=key-password
GOOGLE_PLAY_SERVICE_ACCOUNT=service-account-json

# Netlify deployment
NETLIFY_SITE_ID=your-site-id
NETLIFY_AUTH_TOKEN=your-auth-token

# Monitoring
SLACK_WEBHOOK_URL=your-slack-webhook
```

### Automated Deployment Workflow

The GitHub Actions workflow (`.github/workflows/deploy.yml`) automatically:

1. **On Pull Request:**
   - Runs tests and security checks
   - Builds apps for verification
   - Reports status to PR

2. **On Main Branch Push:**
   - Deploys backend to Railway
   - Builds and uploads iOS app to TestFlight
   - Builds and uploads Android app to Internal Testing
   - Deploys web dashboard to Netlify
   - Sends notifications to team

## 📊 Monitoring and Maintenance

### Application Monitoring

```bash
# Set up monitoring tools:

# 1. Sentry for error tracking
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# 2. New Relic for APM
NEW_RELIC_LICENSE_KEY=your-license-key

# 3. Uptime monitoring
# Configure checks for:
# - API health endpoint: /health
# - Database connectivity
# - External service integrations

# 4. Performance monitoring
# - API response times < 500ms
# - Database query performance
# - Mobile app crash rates < 0.1%
```

### Backup Strategy

```bash
# 1. Database backups (MongoDB Atlas)
# - Automatic daily backups enabled
# - Point-in-time recovery available
# - Cross-region backup replication

# 2. Code backups
# - Git repository with multiple remotes
# - Tagged releases for rollback capability

# 3. Configuration backups
# - Environment variables documented
# - Infrastructure as code (Railway configuration)
```

### Security Maintenance

```bash
# Regular security tasks:

# 1. Dependency updates
npm audit --production
npm update

# 2. Security scanning
# - Monthly vulnerability scans
# - Annual penetration testing
# - Quarterly compliance audits

# 3. Certificate management
# - SSL certificates (auto-renewed by Railway/Netlify)
# - App signing certificates (annual renewal)
```

## 🚨 Incident Response

### Rollback Procedures

```bash
# Backend rollback
railway rollback

# iOS rollback
# Use App Store Connect to remove from sale
# Submit previous version if needed

# Android rollback
# Use Google Play Console to halt rollout
# Promote previous release if needed

# Web dashboard rollback
netlify rollback
```

### Emergency Contacts

- **Technical Lead:** tech@pranayamacoach.com
- **DevOps:** devops@pranayamacoach.com
- **Security:** security@pranayamacoach.com
- **24/7 Hotline:** +1-800-BREATH-1

## 📈 Performance Targets

### Backend API
- **Response Time:** < 200ms (95th percentile)
- **Uptime:** > 99.9%
- **Error Rate:** < 0.1%
- **Throughput:** 1000+ requests/second

### Mobile Apps
- **Crash Rate:** < 0.1%
- **App Start Time:** < 3 seconds
- **Camera Processing:** < 100ms latency
- **Battery Usage:** < 5% per 30-minute session

### Database
- **Query Performance:** < 50ms average
- **Connection Pool:** 95%+ efficiency
- **Backup Success:** 100%
- **Data Consistency:** 100%

## 🎯 Post-Launch Activities

### Week 1-2: Intensive Monitoring
- [ ] Monitor crash reports and fix critical issues
- [ ] Track user onboarding funnel
- [ ] Verify vital signs accuracy across devices
- [ ] Collect user feedback and reviews

### Month 1: Optimization
- [ ] Performance optimizations based on real usage
- [ ] A/B testing for onboarding flow
- [ ] Feature usage analytics review
- [ ] Customer support process refinement

### Month 2-3: Growth
- [ ] Marketing campaign launch
- [ ] Influencer partnerships
- [ ] Healthcare provider partnerships
- [ ] Feature expansion planning

### Ongoing: Maintenance
- [ ] Monthly security updates
- [ ] Quarterly feature releases
- [ ] Bi-annual compliance audits
- [ ] Annual architecture review

---

**🎉 Congratulations!** Your Pranayama Coach application is now successfully deployed to production with comprehensive monitoring, security, and compliance measures in place.