const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { createProxyMiddleware } = require('http-proxy-middleware');
const jwt = require('jsonwebtoken');
const Redis = require('redis');
const { Server } = require('socket.io');
const http = require('http');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const winston = require('winston');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/api-gateway.log' })
  ]
});

// Redis client for caching and session management
const redisClient = Redis.createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', (err) => logger.error('Redis Client Error', err));
redisClient.connect();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FitAI Pro API',
      version: '1.0.0',
      description: 'AI-powered fitness application API'
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server'
      }
    ]
  },
  apis: ['./routes/*.js', './server.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Check if token is blacklisted in Redis
    const isBlacklisted = await redisClient.get(`blacklist_${token}`);
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token is invalid' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Token verification failed:', error);
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      redis: redisClient.isReady,
      gateway: 'running'
    }
  });
});

// Service endpoints configuration
const services = {
  user: process.env.USER_SERVICE_URL || 'http://user-service:3001',
  workout: process.env.WORKOUT_SERVICE_URL || 'http://workout-service:3002',
  ai: process.env.AI_SERVICE_URL || 'http://ai-service:5000',
  analytics: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3003',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004'
};

// Proxy configuration for microservices
const createServiceProxy = (target, pathRewrite = {}) => {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite,
    onError: (err, req, res) => {
      logger.error(`Proxy error for ${target}:`, err);
      res.status(500).json({ error: 'Service temporarily unavailable' });
    },
    onProxyReq: (proxyReq, req, res) => {
      // Add user context to proxied requests
      if (req.user) {
        proxyReq.setHeader('X-User-ID', req.user.userId);
        proxyReq.setHeader('X-User-Email', req.user.email);
      }
    }
  });
};

// Public routes (no authentication required)
app.use('/api/auth', createServiceProxy(services.user, { '^/api/auth': '/auth' }));
app.use('/api/public', createServiceProxy(services.workout, { '^/api/public': '/public' }));

// Protected routes (authentication required)
app.use('/api/users', authenticateToken, createServiceProxy(services.user, { '^/api/users': '/users' }));
app.use('/api/workouts', authenticateToken, createServiceProxy(services.workout, { '^/api/workouts': '/workouts' }));
app.use('/api/ai', authenticateToken, createServiceProxy(services.ai, { '^/api/ai': '/ai' }));
app.use('/api/analytics', authenticateToken, createServiceProxy(services.analytics, { '^/api/analytics': '/analytics' }));
app.use('/api/notifications', authenticateToken, createServiceProxy(services.notification, { '^/api/notifications': '/notifications' }));

// WebSocket handling for real-time features
io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    
    // Check if token is blacklisted
    const isBlacklisted = await redisClient.get(`blacklist_${token}`);
    if (isBlacklisted) {
      return next(new Error('Invalid token'));
    }
    
    socket.userId = decoded.userId;
    socket.userEmail = decoded.email;
    next();
  } catch (error) {
    next(new Error('Authentication failed'));
  }
});

io.on('connection', (socket) => {
  logger.info(`User ${socket.userId} connected`);
  
  // Join user-specific room
  socket.join(`user_${socket.userId}`);
  
  // Handle real-time workout feedback
  socket.on('workout_started', async (data) => {
    logger.info(`Workout started by user ${socket.userId}:`, data);
    
    // Store session info in Redis
    await redisClient.setEx(
      `workout_session_${socket.userId}`,
      3600, // 1 hour expiry
      JSON.stringify({
        workoutId: data.workoutId,
        startTime: new Date().toISOString(),
        socketId: socket.id
      })
    );
    
    // Notify analytics service
    socket.broadcast.to('analytics').emit('workout_started', {
      userId: socket.userId,
      workoutId: data.workoutId
    });
  });
  
  // Handle video frame analysis for form checking
  socket.on('analyze_frame', async (data) => {
    try {
      // Forward to AI service for analysis
      const response = await fetch(`${services.ai}/analyze/form`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': socket.userId
        },
        body: JSON.stringify(data)
      });
      
      if (response.ok) {
        const analysisResult = await response.json();
        socket.emit('form_feedback', analysisResult);
      }
    } catch (error) {
      logger.error('Frame analysis error:', error);
      socket.emit('analysis_error', { message: 'Analysis temporarily unavailable' });
    }
  });
  
  // Handle workout completion
  socket.on('workout_completed', async (data) => {
    logger.info(`Workout completed by user ${socket.userId}:`, data);
    
    // Clean up session data
    await redisClient.del(`workout_session_${socket.userId}`);
    
    // Send completion notification
    socket.emit('workout_completed_ack', {
      message: 'Workout completed successfully!',
      calories: data.caloriesBurned,
      duration: data.duration
    });
  });
  
  socket.on('disconnect', async () => {
    logger.info(`User ${socket.userId} disconnected`);
    await redisClient.del(`workout_session_${socket.userId}`);
  });
});

// Analytics room for service communication
io.of('/').adapter.on('create-room', (room) => {
  logger.info(`Room ${room} was created`);
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Gateway error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  logger.info(`API Gateway running on port ${PORT}`);
  logger.info(`API Documentation available at http://localhost:${PORT}/api-docs`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await redisClient.disconnect();
  server.close(() => {
    logger.info('Process terminated');
  });
});

module.exports = app;
