#!/bin/bash

# FitAI Pro - Build and Start Script

set -e

echo "🏋️ Starting FitAI Pro Application..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p logs
mkdir -p data/postgres
mkdir -p data/mongo
mkdir -p data/redis

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Build and start services
echo "🔨 Building and starting services..."
docker-compose up --build -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
services=("api-gateway:3000" "user-service:3001" "workout-service:3002" "ai-service:5000" "analytics-service:3003" "notification-service:3004")

for service in "${services[@]}"; do
    name=$(echo $service | cut -d: -f1)
    port=$(echo $service | cut -d: -f2)
    
    if curl -f -s "http://localhost:$port/health" > /dev/null; then
        echo "✅ $name is healthy"
    else
        echo "❌ $name is not responding"
    fi
done

echo "🌐 Checking web frontend..."
if curl -f -s "http://localhost:3005/health" > /dev/null; then
    echo "✅ Web frontend is healthy"
else
    echo "❌ Web frontend is not responding"
fi

echo ""
echo "🎉 FitAI Pro is running!"
echo ""
echo "📱 Services available at:"
echo "   • API Gateway: http://localhost:3000"
echo "   • User Service: http://localhost:3001"
echo "   • Workout Service: http://localhost:3002"
echo "   • AI Service: http://localhost:5000"
echo "   • Analytics Service: http://localhost:3003"
echo "   • Notification Service: http://localhost:3004"
echo "   • Web Frontend: http://localhost:3005"
echo ""
echo "🗄️ Databases:"
echo "   • PostgreSQL: localhost:5432"
echo "   • MongoDB: localhost:27017"
echo "   • Redis: localhost:6379"
echo ""
echo "📊 View logs with: docker-compose logs -f [service-name]"
echo "🛑 Stop services with: docker-compose down"
