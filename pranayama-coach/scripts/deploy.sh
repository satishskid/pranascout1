#!/bin/bash

# Pranayama Coach - Deployment Script
# This script automates the deployment process for the web dashboard

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="pranayama-coach"
DASHBOARD_DIR="web-dashboard"
BACKEND_DIR="backend"

# Print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or later."
        exit 1
    fi
    
    if ! command_exists npm; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -c 2-)
    REQUIRED_VERSION="18.0.0"
    
    if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$NODE_VERSION" | sort -V | head -n1)" != "$REQUIRED_VERSION" ]; then
        print_error "Node.js version $NODE_VERSION is too old. Please install version 18 or later."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Backend dependencies
    if [ -d "$BACKEND_DIR" ]; then
        print_status "Installing backend dependencies..."
        cd "$BACKEND_DIR"
        npm ci
        cd ..
        print_success "Backend dependencies installed"
    fi
    
    # Dashboard dependencies
    if [ -d "$DASHBOARD_DIR" ]; then
        print_status "Installing dashboard dependencies..."
        cd "$DASHBOARD_DIR"
        npm ci
        cd ..
        print_success "Dashboard dependencies installed"
    else
        print_error "Dashboard directory not found: $DASHBOARD_DIR"
        exit 1
    fi
}

# Run tests
run_tests() {
    print_status "Running tests..."
    
    # Dashboard tests
    print_status "Running dashboard tests..."
    cd "$DASHBOARD_DIR"
    if npm run test -- --watchAll=false 2>/dev/null; then
        print_success "Dashboard tests passed"
    else
        print_warning "Dashboard tests not configured or failed"
    fi
    cd ..
}

# Build dashboard
build_dashboard() {
    print_status "Building dashboard for production..."
    
    cd "$DASHBOARD_DIR"
    
    # Lint and type check
    if npm run lint 2>/dev/null; then
        print_success "Linting passed"
    else
        print_warning "Linting failed or not configured"
    fi
    
    if npm run type-check 2>/dev/null; then
        print_success "Type checking passed"
    else
        print_warning "Type checking failed or not configured"
    fi
    
    # Build
    print_status "Building React application..."
    CI=false npm run build
    
    cd ..
    print_success "Dashboard built successfully"
}

# Deploy to Netlify
deploy_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command_exists netlify; then
        print_error "Netlify CLI is not installed. Installing..."
        npm install -g netlify-cli
    fi
    
    cd "$DASHBOARD_DIR"
    
    # Check if already logged in
    if ! netlify status >/dev/null 2>&1; then
        print_warning "Not logged in to Netlify. Please run 'netlify login' first."
        read -p "Do you want to login now? (y/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            netlify login
        else
            print_error "Cannot deploy without Netlify authentication"
            exit 1
        fi
    fi
    
    # Deploy
    print_status "Deploying to production..."
    netlify deploy --prod --dir=build
    
    cd ..
    print_success "Deployment completed!"
}

# Manual deployment option
manual_deploy() {
    print_status "Preparing for manual deployment..."
    
    cd "$DASHBOARD_DIR"
    
    # Create deployment package
    if [ -d "build" ]; then
        tar -czf "../pranayama-dashboard-$(date +%Y%m%d-%H%M%S).tar.gz" build/
        print_success "Deployment package created: pranayama-dashboard-$(date +%Y%m%d-%H%M%S).tar.gz"
        print_status "You can now upload this file to your hosting provider"
    else
        print_error "Build directory not found. Please run build first."
        exit 1
    fi
    
    cd ..
}

# Setup environment
setup_environment() {
    print_status "Setting up environment files..."
    
    cd "$DASHBOARD_DIR"
    
    # Create .env.local if it doesn't exist
    if [ ! -f ".env.local" ]; then
        if [ -f ".env.example" ]; then
            cp .env.example .env.local
            print_warning "Created .env.local from .env.example"
            print_warning "Please update .env.local with your actual values"
        else
            print_warning ".env.example not found, creating basic .env.local"
            cat > .env.local << EOF
# Local development environment
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_ENVIRONMENT=development
REACT_APP_DEBUG=true
EOF
        fi
    fi
    
    # Check production environment
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found, creating default"
        cat > .env.production << EOF
# Production environment
REACT_APP_API_URL=/api
REACT_APP_ENVIRONMENT=production
REACT_APP_DEBUG=false
EOF
    fi
    
    cd ..
    print_success "Environment setup completed"
}

# Show help
show_help() {
    echo "Pranayama Coach Deployment Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  setup      Setup environment files"
    echo "  install    Install all dependencies"
    echo "  test       Run all tests"
    echo "  build      Build dashboard for production"
    echo "  deploy     Deploy to Netlify (requires CLI setup)"
    echo "  manual     Create deployment package for manual upload"
    echo "  full       Run full deployment pipeline (install, test, build, deploy)"
    echo "  help       Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 full                 # Complete deployment"
    echo "  $0 build                # Just build the dashboard"
    echo "  $0 deploy               # Deploy to Netlify"
    echo ""
}

# Main script logic
main() {
    echo "====================================="
    echo "Pranayama Coach Deployment Script"
    echo "====================================="
    echo ""
    
    case "${1:-help}" in
        setup)
            check_prerequisites
            setup_environment
            ;;
        install)
            check_prerequisites
            install_dependencies
            ;;
        test)
            check_prerequisites
            run_tests
            ;;
        build)
            check_prerequisites
            build_dashboard
            ;;
        deploy)
            check_prerequisites
            deploy_netlify
            ;;
        manual)
            check_prerequisites
            manual_deploy
            ;;
        full)
            check_prerequisites
            setup_environment
            install_dependencies
            run_tests
            build_dashboard
            
            print_status "Choose deployment method:"
            echo "1) Deploy to Netlify (requires Netlify CLI)"
            echo "2) Create manual deployment package"
            read -p "Enter choice (1 or 2): " choice
            
            case $choice in
                1)
                    deploy_netlify
                    ;;
                2)
                    manual_deploy
                    ;;
                *)
                    print_error "Invalid choice"
                    exit 1
                    ;;
            esac
            ;;
        help|--help|-h)
            show_help
            ;;
        *)
            print_error "Unknown command: $1"
            show_help
            exit 1
            ;;
    esac
    
    echo ""
    print_success "Script completed successfully!"
}

# Run main function with all arguments
main "$@"