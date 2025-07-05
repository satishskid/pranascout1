#!/bin/bash

# Quick deployment fix script for Netlify 404 issues

echo "🔧 Fixing Netlify deployment for Pranayama Coach..."

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "web-dashboard/package.json" ]; then
    echo -e "${RED}❌ Please run this script from the pranayama-coach root directory${NC}"
    exit 1
fi

echo -e "${YELLOW}📋 Pre-flight checks...${NC}"

# Check Node version
NODE_VERSION=$(node --version)
echo "Node.js: $NODE_VERSION"

# Check if build directory exists
if [ -d "web-dashboard/build" ]; then
    echo -e "${YELLOW}🗑️  Cleaning old build...${NC}"
    rm -rf web-dashboard/build
fi

echo -e "${YELLOW}📦 Installing dependencies...${NC}"
cd web-dashboard
npm install

echo -e "${YELLOW}🏗️  Building for production...${NC}"
CI=false npm run build

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Build successful!${NC}"
else
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${YELLOW}🔍 Checking build output...${NC}"
if [ -f "build/index.html" ]; then
    echo -e "${GREEN}✅ index.html found${NC}"
else
    echo -e "${RED}❌ index.html missing${NC}"
    exit 1
fi

if [ -f "build/static/js/"*.js ]; then
    echo -e "${GREEN}✅ JavaScript files found${NC}"
else
    echo -e "${RED}❌ JavaScript files missing${NC}"
fi

if [ -f "build/_redirects" ]; then
    echo -e "${GREEN}✅ _redirects file found${NC}"
else
    echo -e "${YELLOW}⚠️  _redirects file missing, copying...${NC}"
    cp public/_redirects build/
fi

echo -e "${GREEN}🎉 Build ready for deployment!${NC}"
echo ""
echo -e "${YELLOW}📤 Deployment options:${NC}"
echo "1. Drag and drop the 'build' folder to Netlify dashboard"
echo "2. Use Netlify CLI: netlify deploy --prod --dir=build"
echo "3. Push to GitHub and use auto-deploy"
echo ""
echo -e "${YELLOW}🔗 Your build is located at:${NC}"
echo "$(pwd)/build"

cd ..