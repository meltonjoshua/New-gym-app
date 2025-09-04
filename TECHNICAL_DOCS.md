# FitAI Pro - Technical Documentation

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Documentation](#api-documentation)
4. [Mobile App](#mobile-app)
5. [Web Dashboard](#web-dashboard)
6. [AI/ML Components](#aiml-components)
7. [Deployment](#deployment)
8. [Development](#development)
9. [Troubleshooting](#troubleshooting)
10. [Contributing](#contributing)
11. [License](#license)

## Architecture Overview

- **AI Service** (Port 5000): Computer vision and AI features
- **Analytics Service** (Port 3003): Data analytics and reporting

### Frontend Applications

- **Mobile App**: React Native app for users

- **PostgreSQL** (Port 5432): Primary structured data
- **MongoDB** (Port 27017): Media and unstructured data

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.11+ (for AI service development)

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd fitai-pro

# Start all services
 
./start.sh

 

### Access Points
 
**Responsibilities**:
- Request routing to microservices
 

**Key Endpoints**:
- `POST /api/auth/login` - User authentication
- `GET /api/health` - Health check
- WebSocket: Real-time workout sessions

 
### User Service
**Location**: `backend/user-service/`
**Technology**: Node.js, Express, PostgreSQL
**Responsibilities**:
- User registration and profile management
- Authentication (local and OAuth)
- Password reset and verification
- User preferences and settings

**Key Endpoints**:
 
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login
 

### Workout Service
 
- Workout session tracking
- Progress calculations

 
- `POST /api/workouts/sessions` - Start workout session

### AI Service
 
**Responsibilities**:
- Real-time pose detection and analysis
- Exercise form scoring
- Rep counting and movement tracking
- Workout recommendations

 
**Key Endpoints**:
- `POST /api/ai/analyze-form` - Analyze exercise form
- `POST /api/ai/count-reps` - Count repetitions
 
- `GET /api/ai/recommendations/:userId` - Get workout recommendations

### Analytics Service
**Location**: `backend/analytics-service/`
**Technology**: Node.js, Express, PostgreSQL, Redis
**Responsibilities**:
 
- User progress analytics
- Trainer client statistics
- Global platform metrics
- Report generation

**Key Endpoints**:
 
- `GET /api/analytics/users/:userId/stats` - User statistics
- `GET /api/analytics/global` - Platform analytics
- `GET /api/analytics/trainers/:trainerId` - Trainer analytics

### Notification Service
**Location**: `backend/notification-service/`
**Technology**: Node.js, Express, Firebase, Nodemailer
**Responsibilities**:
- Push notifications to mobile devices
- Email notifications
- Scheduled workout reminders
- Progress report emails

**Key Endpoints**:
- `POST /api/notifications/push` - Send push notification
- `POST /api/notifications/email` - Send email
- `GET /api/notifications/users/:userId` - Get user notifications

## Database Schema

### PostgreSQL Tables
- `users` - User accounts and profiles
- `workouts` - Workout sessions
- `exercises` - Exercise library
- `workout_exercises` - Workout-exercise relationships
- `form_analysis` - AI form analysis results
- `progress_tracking` - User progress metrics
- `achievements` - User achievements and badges
- `trainer_clients` - Trainer-client relationships
- `notifications` - Notification history

### MongoDB Collections
- `exercise_media` - Exercise images and videos
- `workout_media` - Workout session media
- `user_uploads` - User-generated content

## API Documentation

### Authentication

All protected endpoints require a JWT token in the Authorization header:

```http
Authorization: Bearer YOUR_JWT_TOKEN
```

### Error Responses

All services return consistent error responses:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

### Rate Limiting

- 100 requests per 15 minutes per IP
- Premium users: 1000 requests per 15 minutes

## Mobile App

**Location**: `mobile/`
**Technology**: React Native, Expo, Redux Toolkit

### Key Features

- Camera-based form analysis
- Real-time workout tracking
- Social features and challenges
- Progress visualization
- Push notifications

### State Management

Redux slices:

- `authSlice` - Authentication state
- `workoutSlice` - Workout data
- `exerciseSlice` - Exercise library
- `progressSlice` - User progress

### Navigation

React Navigation with stack and tab navigators:

- Auth Stack: Login, Register, Forgot Password
- Main Tabs: Workouts, Progress, Profile, Social

## Web Dashboard

**Location**: `frontend/web/`
**Technology**: React, Material-UI, React Router

### Target Users

- Fitness trainers
- Gym administrators
- Platform managers

### Dashboard Features

- Client management
- Analytics dashboards
- Exercise library management
- User support tools
- Platform analytics

### Web Deployment

Built as static files and served by Nginx with API proxying.

## AI/ML Components

### Pose Detection

- **MediaPipe Pose**: Real-time joint detection
- **Custom Form Analysis**: Exercise-specific scoring
- **Rep Counting**: Movement pattern recognition

### Models

- Pose classification models
- Exercise recognition
- Workout recommendation engine
- Progressive overload calculations

### Model Storage

Models are stored in the `ml-models/` directory and loaded by the AI service.

## Deployment

### Production Environment

```bash
# Set production environment
export NODE_ENV=production
export FLASK_ENV=production

# Start with production compose
docker-compose -f docker-compose.prod.yml up -d
```

### Environment Variables
Key production configurations:
- Database URLs with real credentials
- JWT secrets (strong, unique values)
- SMTP configuration for emails
- Firebase configuration for push notifications
- AWS credentials for file storage

### Scaling
- Use load balancers for multiple service instances
- Separate database servers
- CDN for static assets
- Redis cluster for caching

## Development

### Local Development Setup
```bash
# Install dependencies for each service
cd backend/api-gateway && npm install
cd ../user-service && npm install
cd ../workout-service && npm install
cd ../analytics-service && npm install
cd ../notification-service && npm install

# Install Python dependencies
cd ../ai-service && pip install -r requirements.txt

# Install frontend dependencies
cd ../../frontend/web && npm install
cd ../../mobile && npm install
```

### Running Individual Services
```bash
# Start databases first
docker-compose up database mongo redis

# Run services individually
cd backend/api-gateway && npm run dev
cd backend/user-service && npm run dev
# ... etc
```

### Testing
```bash
# Run tests for each service
npm test

# Run integration tests
npm run test:integration
```

### Code Quality
- ESLint for JavaScript/TypeScript
- Prettier for code formatting
- Black for Python formatting
- Pre-commit hooks for quality checks

## Troubleshooting

### Common Issues
1. **Port conflicts**: Check if ports 3000-3005, 5000, 5432, 27017, 6379 are available
2. **Docker permissions**: Ensure Docker daemon is running and user has permissions
3. **Database connection**: Verify database containers are healthy
4. **Memory issues**: AI service requires at least 2GB RAM

### Health Checks
Each service provides a `/health` endpoint for monitoring.

### Logs
View service logs:
```bash
docker-compose logs -f [service-name]
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes with proper tests
4. Submit a pull request

## License

MIT License - See LICENSE file for details.
