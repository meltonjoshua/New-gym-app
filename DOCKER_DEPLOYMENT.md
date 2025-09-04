# Docker Hub Deployment Guide

This guide will help you build and deploy the FitAI Pro application to Docker Hub.

## Prerequisites

1. **Docker Desktop** installed and running
2. **Docker Hub account** (free at https://hub.docker.com)
3. **Git** installed

## Quick Start

### 1. Login to Docker Hub

```bash
docker login
```
Enter your Docker Hub username and password when prompted.

### 2. Set Your Docker Hub Username

Update the deployment script with your Docker Hub username:

```bash
export DOCKER_HUB_USERNAME="your-dockerhub-username"
```

Or edit the script directly:
```bash
nano scripts/deploy-to-dockerhub.sh
```

### 3. Build and Push All Services

Run the automated deployment script:

```bash
./scripts/deploy-to-dockerhub.sh
```

This will:
- Build all 7 Docker images (6 services + 1 frontend)
- Tag them appropriately
- Push them to your Docker Hub repository

### 4. Deploy in Production

Copy the environment file and update with your values:

```bash
cp .env.example .env
nano .env  # Update with your actual values
```

Deploy using the production compose file:

```bash
docker-compose -f docker-compose-prod.yml up -d
```

## Manual Build Process

If you prefer to build services individually:

### Build Individual Services

```bash
# API Gateway
docker build -t $DOCKER_HUB_USERNAME/fitai-pro-api-gateway:latest ./backend/api-gateway
docker push $DOCKER_HUB_USERNAME/fitai-pro-api-gateway:latest

# User Service
docker build -t $DOCKER_HUB_USERNAME/fitai-pro-user-service:latest ./backend/user-service
docker push $DOCKER_HUB_USERNAME/fitai-pro-user-service:latest

# Workout Service
docker build -t $DOCKER_HUB_USERNAME/fitai-pro-workout-service:latest ./backend/workout-service
docker push $DOCKER_HUB_USERNAME/fitai-pro-workout-service:latest

# AI Service
docker build -t $DOCKER_HUB_USERNAME/fitai-pro-ai-service:latest ./backend/ai-service
docker push $DOCKER_HUB_USERNAME/fitai-pro-ai-service:latest

# Analytics Service
docker build -t $DOCKER_HUB_USERNAME/fitai-pro-analytics-service:latest ./backend/analytics-service
docker push $DOCKER_HUB_USERNAME/fitai-pro-analytics-service:latest

# Notification Service
docker build -t $DOCKER_HUB_USERNAME/fitai-pro-notification-service:latest ./backend/notification-service
docker push $DOCKER_HUB_USERNAME/fitai-pro-notification-service:latest

# Web Frontend
docker build -t $DOCKER_HUB_USERNAME/fitai-pro-web-frontend:latest ./frontend/web
docker push $DOCKER_HUB_USERNAME/fitai-pro-web-frontend:latest
```

## Production Deployment

### Environment Variables

Update these key variables in your `.env` file:

```bash
# Your Docker Hub username
DOCKER_HUB_USERNAME=your-dockerhub-username

# Strong passwords for production
DB_PASSWORD=your-secure-database-password
MONGO_PASSWORD=your-secure-mongo-password
REDIS_PASSWORD=your-secure-redis-password

# JWT secret (32+ characters)
JWT_SECRET=your-super-secure-jwt-secret-key-at-least-32-characters

# Your domain
API_URL=https://your-domain.com
```

### Deploy to Production Server

1. Copy files to your production server:
```bash
scp docker-compose-prod.yml user@your-server:/path/to/app/
scp .env user@your-server:/path/to/app/
```

2. SSH into your server and run:
```bash
docker-compose -f docker-compose-prod.yml up -d
```

### Health Checks

Check if all services are running:

```bash
docker-compose -f docker-compose-prod.yml ps
```

View logs:
```bash
docker-compose -f docker-compose-prod.yml logs -f [service-name]
```

## Updating Images

To update with new code:

1. Build and push new images:
```bash
export VERSION=v1.1.0  # or your version
./scripts/deploy-to-dockerhub.sh
```

2. Update production:
```bash
docker-compose -f docker-compose-prod.yml pull
docker-compose -f docker-compose-prod.yml up -d
```

## Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure you're logged into Docker Hub
   ```bash
   docker login
   ```

2. **Build Fails**: Check Dockerfile in the specific service directory

3. **Service Won't Start**: Check logs for the specific service
   ```bash
   docker-compose -f docker-compose-prod.yml logs [service-name]
   ```

4. **Database Connection Issues**: Ensure database environment variables are correct

### Useful Commands

```bash
# Stop all services
docker-compose -f docker-compose-prod.yml down

# Remove all data (CAUTION!)
docker-compose -f docker-compose-prod.yml down -v

# Scale a service
docker-compose -f docker-compose-prod.yml up -d --scale user-service=3

# View resource usage
docker stats
```

## Next Steps

1. Set up CI/CD pipeline (GitHub Actions)
2. Configure NGINX for SSL/TLS
3. Set up monitoring (Prometheus/Grafana)
4. Configure backup strategies
5. Set up logging aggregation
