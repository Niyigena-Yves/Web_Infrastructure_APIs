#!/bin/bash

# Weather Dashboard Deployment Script
# This script automates the Docker build, push, and deployment process

set -e  # Exit on any error

# Configuration
DOCKER_USERNAME=${1:-"yvesniyigena"}
APP_NAME="weather-dashboard"
VERSION=${2:-"v1"}
REGISTRY="docker.io"

echo "Starting Weather Dashboard Deployment"
echo "Docker Username: $DOCKER_USERNAME"
echo " Version: $VERSION"
echo "App Name: $APP_NAME"
echo ""

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command_exists docker; then
    echo "Docker is not installed or not in PATH"
    exit 1
fi

if ! command_exists curl; then
    echo "curl is not installed or not in PATH"
    exit 1
fi

echo "Prerequisites check passed"
echo ""

# Step 1: Build the Docker image
echo "Building Docker image..."
docker build -t "$DOCKER_USERNAME/$APP_NAME:$VERSION" .

# Also tag as latest
docker tag "$DOCKER_USERNAME/$APP_NAME:$VERSION" "$DOCKER_USERNAME/$APP_NAME:latest"

echo "Docker image built successfully"
echo ""

# Step 2: Test the image locally
echo "Testing the image locally..."
echo "Starting container for testing..."

# Kill any existing test container
docker rm -f weather-test 2>/dev/null || true

# Run test container
docker run -d --name weather-test -p 8080:8080 "$DOCKER_USERNAME/$APP_NAME:$VERSION"

# Wait for container to start
sleep 5

# Test health endpoint
if curl -f http://localhost:8080/health > /dev/null 2>&1; then
    echo "Local test passed - application is responding"
else
    echo "Local test failed - application not responding"
    docker logs weather-test
    docker rm -f weather-test
    exit 1
fi

# Test weather API
if curl -f "http://localhost:8080/api/weather?latitude=40.7128&longitude=-74.0060" > /dev/null 2>&1; then
    echo "Weather API test passed"
else
    echo "Weather API test failed"
    docker logs weather-test
    docker rm -f weather-test
    exit 1
fi

# Clean up test container
docker rm -f weather-test
echo ""

# Step 3: Push to Docker Hub
echo "Pushing to Docker Hub..."
echo "Please make sure you're logged in to Docker Hub (run 'docker login' if needed)"

# Check if user is logged in
if ! docker info | grep -q "Username:"; then
    echo "You may need to login to Docker Hub first"
    echo "Run: docker login"
    read -p "Continue anyway? (y/N): " -r
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Push the versioned image
echo "Pushing $DOCKER_USERNAME/$APP_NAME:$VERSION..."
docker push "$DOCKER_USERNAME/$APP_NAME:$VERSION"

# Push the latest tag
echo "Pushing $DOCKER_USERNAME/$APP_NAME:latest..."
docker push "$DOCKER_USERNAME/$APP_NAME:latest"

echo "Images pushed to Docker Hub successfully"
echo ""

# Step 4: Generate deployment commands
echo "Deployment Commands for Lab Environment:"
echo ""
echo "# On Web-01:"
echo "ssh user@web-01"
echo "docker pull $DOCKER_USERNAME/$APP_NAME:$VERSION"
echo "docker run -d --name weather-app --restart unless-stopped \\"
echo "  -p 8080:8080 \\"
echo "  -e INSTANCE_NAME=web-01 \\"
echo "  $DOCKER_USERNAME/$APP_NAME:$VERSION"
echo ""
echo "# On Web-02:"
echo "ssh user@web-02"
echo "docker pull $DOCKER_USERNAME/$APP_NAME:$VERSION"
echo "docker run -d --name weather-app --restart unless-stopped \\"
echo "  -p 8080:8080 \\"
echo "  -e INSTANCE_NAME=web-02 \\"
echo "  $DOCKER_USERNAME/$APP_NAME:$VERSION"
echo ""
echo "# Test load balancing:"
echo "for i in {1..10}; do"
echo "  curl -s http://your-load-balancer/health | grep hostname"
echo "  sleep 1"
echo "done"
echo ""

# Step 5: Generate HAProxy configuration
echo "HAProxy Configuration:"
echo ""
echo "backend weather_backend"
echo "    balance roundrobin"
echo "    option httpchk GET /health"
echo "    server web01 172.20.0.11:8080 check"
echo "    server web02 172.20.0.12:8080 check"
echo ""

echo "Deployment completed successfully!"
echo ""
echo "Next steps:"
echo "1. SSH into your lab machines (Web-01, Web-02)"
echo "2. Run the deployment commands above"
echo "3. Update HAProxy configuration on Lb-01"
echo "4. Test the load balancing"
echo ""
echo "Docker Hub: https://hub.docker.com/r/$DOCKER_USERNAME/$APP_NAME"
echo "Monitor your application using the /health and /api/analytics endpoints"