#!/bin/bash

# FitAI Pro Docker Hub Deployment Script
# This script builds all services and pushes them to Docker Hub

set -e

# Configuration
DOCKER_HUB_USERNAME="${DOCKER_HUB_USERNAME:-your-dockerhub-username}"
PROJECT_NAME="fitai-pro"
VERSION="${VERSION:-latest}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 FitAI Pro Docker Hub Deployment${NC}"
echo "================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
    exit 1
fi

# Check if logged into Docker Hub
if ! docker info | grep -q "Username"; then
    echo -e "${YELLOW}⚠️  You are not logged into Docker Hub. Please run 'docker login' first.${NC}"
    echo "Run: docker login"
    exit 1
fi

echo -e "${GREEN}✅ Docker is running and you are logged in${NC}"
echo ""

# Function to build and push a service
build_and_push() {
    local service_name=$1
    local dockerfile_path=$2
    local image_name="${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-${service_name}:${VERSION}"
    
    echo -e "${YELLOW}🔨 Building ${service_name}...${NC}"
    
    # Build the image
    docker build -t "${image_name}" "${dockerfile_path}"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Successfully built ${service_name}${NC}"
        
        # Push to Docker Hub
        echo -e "${YELLOW}📤 Pushing ${service_name} to Docker Hub...${NC}"
        docker push "${image_name}"
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}✅ Successfully pushed ${service_name} to Docker Hub${NC}"
        else
            echo -e "${RED}❌ Failed to push ${service_name}${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ Failed to build ${service_name}${NC}"
        return 1
    fi
    
    echo ""
}

# Build and push all services
echo -e "${YELLOW}📦 Building and pushing all services...${NC}"
echo ""

# Backend Services
build_and_push "api-gateway" "./backend/api-gateway"
build_and_push "user-service" "./backend/user-service"
build_and_push "workout-service" "./backend/workout-service"
build_and_push "ai-service" "./backend/ai-service"
build_and_push "analytics-service" "./backend/analytics-service"
build_and_push "notification-service" "./backend/notification-service"

# Frontend
build_and_push "web-frontend" "./frontend/web"

echo -e "${GREEN}🎉 All services have been successfully built and pushed to Docker Hub!${NC}"
echo ""
echo -e "${YELLOW}📋 Docker Hub Images:${NC}"
echo "• ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-api-gateway:${VERSION}"
echo "• ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-user-service:${VERSION}"
echo "• ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-workout-service:${VERSION}"
echo "• ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-ai-service:${VERSION}"
echo "• ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-analytics-service:${VERSION}"
echo "• ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-notification-service:${VERSION}"
echo "• ${DOCKER_HUB_USERNAME}/${PROJECT_NAME}-web-frontend:${VERSION}"
echo ""
echo -e "${GREEN}🚀 Ready for deployment! Use docker-compose-prod.yml to deploy.${NC}"
