const express = require('express');
const { Pool } = require('pg');
const { MongoClient } = require('mongodb');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');
const cron = require('node-cron');
const _ = require('lodash');
require('dotenv').config();

const app = express();

// Logger configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/workout-service.log' })
  ]
});

// Database connections
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

let mongoClient;
let exerciseCollection;

// MongoDB connection
async function connectMongoDB() {
  try {
    mongoClient = new MongoClient(process.env.MONGODB_URL || 'mongodb://localhost:27017');
    await mongoClient.connect();
    const db = mongoClient.db('fitai');
    exerciseCollection = db.collection('exercises');
    logger.info('Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
  }
}

connectMongoDB();

// Middleware
app.use(express.json());

// Authentication middleware (simplified - would use JWT in production)
const authenticateUser = (req, res, next) => {
  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(401).json({ error: 'User authentication required' });
  }
  req.userId = userId;
  next();
};

// Exercise Library Routes

/**
 * @swagger
 * /public/exercises:
 *   get:
 *     summary: Get public exercise library
 *     tags: [Exercises]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by exercise category
 *       - in: query
 *         name: muscleGroup
 *         schema:
 *           type: string
 *         description: Filter by muscle group
 *       - in: query
 *         name: difficulty
 *         schema:
 *           type: integer
 *         description: Filter by difficulty level (1-10)
 *       - in: query
 *         name: equipment
 *         schema:
 *           type: string
 *         description: Filter by required equipment
 *     responses:
 *       200:
 *         description: List of exercises
 */
app.get('/public/exercises', async (req, res) => {
  try {
    const { category, muscleGroup, difficulty, equipment, search } = req.query;
    
    // Build query
    let query = 'SELECT * FROM exercises WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    if (category) {
      query += ` AND category = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (muscleGroup) {
      query += ` AND $${paramIndex} = ANY(muscle_groups)`;
      params.push(muscleGroup);
      paramIndex++;
    }

    if (difficulty) {
      query += ` AND difficulty_level <= $${paramIndex}`;
      params.push(parseInt(difficulty));
      paramIndex++;
    }

    if (equipment) {
      query += ` AND $${paramIndex} = ANY(equipment)`;
      params.push(equipment);
      paramIndex++;
    }

    if (search) {
      query += ` AND (name ILIKE $${paramIndex} OR category ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ' ORDER BY name';

    const result = await pgPool.query(query, params);
    
    res.json({
      exercises: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    logger.error('Error fetching exercises:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

/**
 * @swagger
 * /public/exercises/{id}:
 *   get:
 *     summary: Get specific exercise details
 *     tags: [Exercises]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Exercise ID
 *     responses:
 *       200:
 *         description: Exercise details
 *       404:
 *         description: Exercise not found
 */
app.get('/public/exercises/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pgPool.query('SELECT * FROM exercises WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    const exercise = result.rows[0];
    
    // Get additional media from MongoDB if available
    if (exerciseCollection) {
      const mediaData = await exerciseCollection.findOne({ exerciseId: id });
      if (mediaData) {
        exercise.media = mediaData;
      }
    }

    res.json(exercise);

  } catch (error) {
    logger.error('Error fetching exercise:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// Workout Management Routes

/**
 * @swagger
 * /workouts:
 *   get:
 *     summary: Get user's workouts
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user workouts
 */
app.get('/workouts', authenticateUser, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT w.*, 
             COALESCE(ws.completed_at, NULL) as last_completed,
             COUNT(ws.id) as times_completed
      FROM workouts w
      LEFT JOIN workout_sessions ws ON w.id = ws.workout_id
      WHERE w.user_id = $1
    `;
    const params = [req.userId];

    if (status === 'completed') {
      query += ` AND w.completed_at IS NOT NULL`;
    } else if (status === 'active') {
      query += ` AND w.completed_at IS NULL`;
    }

    query += ` 
      GROUP BY w.id, ws.completed_at
      ORDER BY w.created_at DESC 
      LIMIT $2 OFFSET $3
    `;
    params.push(limit, offset);

    const result = await pgPool.query(query, params);

    // Get total count
    const countResult = await pgPool.query(
      'SELECT COUNT(*) FROM workouts WHERE user_id = $1',
      [req.userId]
    );

    res.json({
      workouts: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });

  } catch (error) {
    logger.error('Error fetching workouts:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

/**
 * @swagger
 * /workouts:
 *   post:
 *     summary: Create a new workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - exercises
 *             properties:
 *               name:
 *                 type: string
 *               exercises:
 *                 type: array
 *               workoutType:
 *                 type: string
 *               estimatedDuration:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Workout created successfully
 */
app.post('/workouts', [
  authenticateUser,
  body('name').notEmpty().trim(),
  body('exercises').isArray().notEmpty(),
  body('workoutType').optional().isString(),
  body('estimatedDuration').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, exercises, workoutType, estimatedDuration } = req.body;

    // Validate exercises exist
    const exerciseIds = exercises.map(ex => ex.id || ex.exerciseId).filter(Boolean);
    if (exerciseIds.length > 0) {
      const exerciseCheck = await pgPool.query(
        'SELECT id FROM exercises WHERE id = ANY($1)',
        [exerciseIds]
      );
      
      if (exerciseCheck.rows.length !== exerciseIds.length) {
        return res.status(400).json({ error: 'Some exercises not found' });
      }
    }

    // Calculate difficulty level
    const avgDifficulty = exercises.reduce((sum, ex) => sum + (ex.difficultyLevel || 5), 0) / exercises.length;

    const result = await pgPool.query(`
      INSERT INTO workouts (user_id, name, exercises, workout_type, estimated_duration, difficulty_level)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      req.userId,
      name,
      JSON.stringify(exercises),
      workoutType || 'custom',
      estimatedDuration || 30,
      Math.round(avgDifficulty)
    ]);

    logger.info(`Workout created: ${result.rows[0].id} by user: ${req.userId}`);
    res.status(201).json(result.rows[0]);

  } catch (error) {
    logger.error('Error creating workout:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

/**
 * @swagger
 * /workouts/{id}:
 *   get:
 *     summary: Get specific workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout details
 *       404:
 *         description: Workout not found
 */
app.get('/workouts/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pgPool.query(`
      SELECT w.*, 
             COUNT(ws.id) as session_count,
             MAX(ws.completed_at) as last_completed,
             AVG(ws.calories_burned) as avg_calories
      FROM workouts w
      LEFT JOIN workout_sessions ws ON w.id = ws.workout_id
      WHERE w.id = $1 AND w.user_id = $2
      GROUP BY w.id
    `, [id, req.userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    const workout = result.rows[0];

    // Get recent sessions
    const sessionsResult = await pgPool.query(`
      SELECT * FROM workout_sessions 
      WHERE workout_id = $1 AND user_id = $2
      ORDER BY started_at DESC
      LIMIT 5
    `, [id, req.userId]);

    workout.recent_sessions = sessionsResult.rows;

    res.json(workout);

  } catch (error) {
    logger.error('Error fetching workout:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

/**
 * @swagger
 * /workouts/{id}:
 *   put:
 *     summary: Update workout
 *     tags: [Workouts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workout updated successfully
 */
app.put('/workouts/:id', [
  authenticateUser,
  body('name').optional().notEmpty().trim(),
  body('exercises').optional().isArray(),
  body('workoutType').optional().isString(),
  body('estimatedDuration').optional().isInt({ min: 1 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const updates = req.body;

    // Check ownership
    const ownershipCheck = await pgPool.query(
      'SELECT id FROM workouts WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Build update query
    const updateFields = [];
    const params = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      const dbField = _.snakeCase(key);
      updateFields.push(`${dbField} = $${paramIndex}`);
      params.push(typeof value === 'object' ? JSON.stringify(value) : value);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    updateFields.push(`updated_at = NOW()`);
    params.push(id, req.userId);

    const query = `
      UPDATE workouts 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pgPool.query(query, params);

    logger.info(`Workout updated: ${id} by user: ${req.userId}`);
    res.json(result.rows[0]);

  } catch (error) {
    logger.error('Error updating workout:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

// Workout Session Management

/**
 * @swagger
 * /workouts/{id}/sessions:
 *   post:
 *     summary: Start a workout session
 *     tags: [Workout Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Workout session started
 */
app.post('/workouts/:id/sessions', authenticateUser, async (req, res) => {
  try {
    const { id: workoutId } = req.params;

    // Verify workout exists and belongs to user
    const workoutCheck = await pgPool.query(
      'SELECT id, name FROM workouts WHERE id = $1 AND user_id = $2',
      [workoutId, req.userId]
    );

    if (workoutCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Create new session
    const sessionResult = await pgPool.query(`
      INSERT INTO workout_sessions (user_id, workout_id, started_at)
      VALUES ($1, $2, NOW())
      RETURNING *
    `, [req.userId, workoutId]);

    const session = sessionResult.rows[0];

    logger.info(`Workout session started: ${session.id} for workout: ${workoutId}`);
    res.status(201).json({
      session_id: session.id,
      workout_id: workoutId,
      started_at: session.started_at,
      message: 'Workout session started successfully'
    });

  } catch (error) {
    logger.error('Error starting workout session:', error);
    res.status(500).json({ error: 'Failed to start workout session' });
  }
});

/**
 * @swagger
 * /sessions/{sessionId}/complete:
 *   post:
 *     summary: Complete a workout session
 *     tags: [Workout Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               exercisesCompleted:
 *                 type: object
 *               caloriesBurned:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Workout session completed
 */
app.post('/sessions/:sessionId/complete', [
  authenticateUser,
  body('exercisesCompleted').optional().isObject(),
  body('caloriesBurned').optional().isFloat({ min: 0 }),
  body('notes').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { sessionId } = req.params;
    const { exercisesCompleted, caloriesBurned, notes } = req.body;

    // Verify session exists and belongs to user
    const sessionCheck = await pgPool.query(
      'SELECT * FROM workout_sessions WHERE id = $1 AND user_id = $2 AND completed_at IS NULL',
      [sessionId, req.userId]
    );

    if (sessionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Active session not found' });
    }

    const session = sessionCheck.rows[0];
    const now = new Date();
    const duration = Math.round((now - new Date(session.started_at)) / (1000 * 60)); // Duration in minutes

    // Update session
    const updateResult = await pgPool.query(`
      UPDATE workout_sessions 
      SET completed_at = NOW(),
          actual_duration = $1,
          exercises_completed = $2,
          calories_burned = $3,
          session_notes = $4
      WHERE id = $5 AND user_id = $6
      RETURNING *
    `, [
      duration,
      JSON.stringify(exercisesCompleted || {}),
      caloriesBurned || 0,
      notes || '',
      sessionId,
      req.userId
    ]);

    // Update user progress
    await updateUserProgress(req.userId, {
      workout_completed: true,
      duration: duration,
      calories_burned: caloriesBurned || 0,
      exercises_completed: Object.keys(exercisesCompleted || {})
    });

    logger.info(`Workout session completed: ${sessionId} by user: ${req.userId}`);
    res.json({
      session: updateResult.rows[0],
      message: 'Workout completed successfully!',
      duration_minutes: duration,
      calories_burned: caloriesBurned || 0
    });

  } catch (error) {
    logger.error('Error completing workout session:', error);
    res.status(500).json({ error: 'Failed to complete workout session' });
  }
});

// Progress tracking helper function
async function updateUserProgress(userId, sessionData) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Get existing progress for today
    const existingProgress = await pgPool.query(
      'SELECT * FROM user_progress WHERE user_id = $1 AND date = $2',
      [userId, today]
    );

    if (existingProgress.rows.length > 0) {
      // Update existing progress
      const current = existingProgress.rows[0];
      const updatedMetrics = {
        ...current.metrics,
        total_duration: (current.metrics.total_duration || 0) + sessionData.duration,
        total_calories: (current.metrics.total_calories || 0) + sessionData.calories_burned,
        exercises_completed: [
          ...(current.metrics.exercises_completed || []),
          ...sessionData.exercises_completed
        ]
      };

      await pgPool.query(`
        UPDATE user_progress 
        SET total_workouts = total_workouts + 1,
            total_calories_burned = total_calories_burned + $1,
            metrics = $2
        WHERE user_id = $3 AND date = $4
      `, [
        sessionData.calories_burned,
        JSON.stringify(updatedMetrics),
        userId,
        today
      ]);
    } else {
      // Create new progress entry
      const metrics = {
        total_duration: sessionData.duration,
        total_calories: sessionData.calories_burned,
        exercises_completed: sessionData.exercises_completed
      };

      await pgPool.query(`
        INSERT INTO user_progress (user_id, date, total_workouts, total_calories_burned, metrics)
        VALUES ($1, $2, 1, $3, $4)
      `, [
        userId,
        today,
        sessionData.calories_burned,
        JSON.stringify(metrics)
      ]);
    }

    // Update workout streak
    await updateWorkoutStreak(userId);

  } catch (error) {
    logger.error('Error updating user progress:', error);
  }
}

async function updateWorkoutStreak(userId) {
  try {
    // Get last 30 days of progress
    const progressResult = await pgPool.query(`
      SELECT date, total_workouts
      FROM user_progress
      WHERE user_id = $1 AND date >= CURRENT_DATE - INTERVAL '30 days'
      ORDER BY date DESC
    `, [userId]);

    let currentStreak = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    const today = new Date().toISOString().split('T')[0];
    const progressByDate = {};
    
    progressResult.rows.forEach(row => {
      progressByDate[row.date] = row.total_workouts > 0;
    });

    // Calculate current streak (from today backwards)
    const currentDate = new Date();
    for (let i = 0; i < 30; i++) {
      const dateStr = currentDate.toISOString().split('T')[0];
      if (progressByDate[dateStr]) {
        if (i === 0 || currentStreak > 0) { // Continue streak only if today has workout or streak is active
          currentStreak++;
        }
      } else if (i === 0) {
        break; // No workout today, streak is 0
      } else {
        break; // Streak broken
      }
      currentDate.setDate(currentDate.getDate() - 1);
    }

    // Calculate max streak
    for (const hasWorkout of Object.values(progressByDate)) {
      if (hasWorkout) {
        tempStreak++;
        maxStreak = Math.max(maxStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    }

    // Update today's progress with streak info
    await pgPool.query(`
      UPDATE user_progress 
      SET workout_streak = $1,
          ai_insights = COALESCE(ai_insights, '{}') || $2
      WHERE user_id = $3 AND date = $4
    `, [
      currentStreak,
      JSON.stringify({ 
        current_streak: currentStreak,
        max_streak: maxStreak,
        updated_at: new Date().toISOString()
      }),
      userId,
      today
    ]);

  } catch (error) {
    logger.error('Error updating workout streak:', error);
  }
}

// Get user statistics
app.get('/workouts/stats', authenticateUser, async (req, res) => {
  try {
    const { period = '30' } = req.query; // days

    // Get workout statistics
    const statsResult = await pgPool.query(`
      SELECT 
        COUNT(DISTINCT ws.id) as total_sessions,
        COUNT(DISTINCT w.id) as total_workouts,
        COALESCE(SUM(ws.actual_duration), 0) as total_duration,
        COALESCE(SUM(ws.calories_burned), 0) as total_calories,
        COALESCE(AVG(ws.calories_burned), 0) as avg_calories_per_session,
        COALESCE(AVG(ws.actual_duration), 0) as avg_duration_per_session
      FROM workouts w
      LEFT JOIN workout_sessions ws ON w.id = ws.workout_id
      WHERE w.user_id = $1 
        AND ws.completed_at IS NOT NULL
        AND ws.completed_at >= CURRENT_DATE - INTERVAL '${period} days'
    `, [req.userId]);

    // Get current streak
    const streakResult = await pgPool.query(`
      SELECT workout_streak, ai_insights
      FROM user_progress
      WHERE user_id = $1
      ORDER BY date DESC
      LIMIT 1
    `, [req.userId]);

    // Get favorite exercises
    const favoritesResult = await pgPool.query(`
      SELECT exercise_name, COUNT(*) as frequency
      FROM form_analysis fa
      JOIN workout_sessions ws ON fa.session_id = ws.id
      WHERE ws.user_id = $1
        AND ws.completed_at >= CURRENT_DATE - INTERVAL '${period} days'
      GROUP BY exercise_name
      ORDER BY frequency DESC
      LIMIT 5
    `, [req.userId]);

    const stats = statsResult.rows[0];
    const streak = streakResult.rows[0] || { workout_streak: 0 };
    const favorites = favoritesResult.rows;

    res.json({
      summary: {
        total_sessions: parseInt(stats.total_sessions) || 0,
        total_workouts: parseInt(stats.total_workouts) || 0,
        total_duration_minutes: parseInt(stats.total_duration) || 0,
        total_calories_burned: parseFloat(stats.total_calories) || 0,
        avg_calories_per_session: parseFloat(stats.avg_calories_per_session) || 0,
        avg_duration_per_session: parseFloat(stats.avg_duration_per_session) || 0,
        current_streak: streak.workout_streak || 0
      },
      favorite_exercises: favorites,
      period_days: parseInt(period)
    });

  } catch (error) {
    logger.error('Error fetching workout stats:', error);
    res.status(500).json({ error: 'Failed to fetch workout statistics' });
  }
});

// Scheduled tasks
cron.schedule('0 1 * * *', async () => {
  // Daily task to update streaks and generate insights
  logger.info('Running daily workout analytics update...');
  
  try {
    // Update streaks for all users who worked out yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const activeUsers = await pgPool.query(`
      SELECT DISTINCT user_id 
      FROM user_progress 
      WHERE date = $1 AND total_workouts > 0
    `, [yesterdayStr]);

    for (const user of activeUsers.rows) {
      await updateWorkoutStreak(user.user_id);
    }

    logger.info(`Updated streaks for ${activeUsers.rows.length} users`);
  } catch (error) {
    logger.error('Error in daily analytics update:', error);
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    service: 'workout-service',
    connections: {
      postgresql: pgPool.totalCount > 0,
      mongodb: mongoClient && mongoClient.topology && mongoClient.topology.isConnected()
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Workout service error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

const PORT = process.env.PORT || 3002;

app.listen(PORT, () => {
  logger.info(`Workout service running on port ${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  if (mongoClient) {
    await mongoClient.close();
  }
  await pgPool.end();
  process.exit(0);
});

module.exports = app;
