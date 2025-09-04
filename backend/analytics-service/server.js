const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const moment = require('moment');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

// Redis connection
const redisClient = redis.createClient({
  url: process.env.REDIS_URL
});

redisClient.on('error', (err) => {
  console.error('Redis Client Error', err);
});

redisClient.connect();

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'analytics-service' });
});

// Get user statistics
app.get('/api/analytics/users/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;

    // Calculate date range
    const endDate = moment();
    const startDate = moment().subtract(parseInt(timeframe), 'days');

    // Get workout statistics
    const workoutStats = await pool.query(`
      SELECT 
        COUNT(*) as total_workouts,
        AVG(duration_minutes) as avg_duration,
        SUM(duration_minutes) as total_duration,
        AVG(calories_burned) as avg_calories,
        SUM(calories_burned) as total_calories
      FROM workouts 
      WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
    `, [userId, startDate.toISOString(), endDate.toISOString()]);

    // Get exercise type distribution
    const exerciseDistribution = await pool.query(`
      SELECT 
        e.category,
        COUNT(*) as count,
        AVG(we.sets) as avg_sets,
        AVG(we.reps) as avg_reps
      FROM workout_exercises we
      JOIN exercises e ON we.exercise_id = e.id
      JOIN workouts w ON we.workout_id = w.id
      WHERE w.user_id = $1 AND w.created_at BETWEEN $2 AND $3
      GROUP BY e.category
      ORDER BY count DESC
    `, [userId, startDate.toISOString(), endDate.toISOString()]);

    // Get progress over time
    const progressData = await pool.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as workouts,
        AVG(duration_minutes) as avg_duration,
        SUM(calories_burned) as calories
      FROM workouts 
      WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
      GROUP BY DATE(created_at)
      ORDER BY date
    `, [userId, startDate.toISOString(), endDate.toISOString()]);

    // Get form analysis trends
    const formTrends = await pool.query(`
      SELECT 
        exercise_name,
        AVG(form_score) as avg_form_score,
        COUNT(*) as analysis_count
      FROM form_analysis 
      WHERE user_id = $1 AND created_at BETWEEN $2 AND $3
      GROUP BY exercise_name
      ORDER BY analysis_count DESC
      LIMIT 10
    `, [userId, startDate.toISOString(), endDate.toISOString()]);

    res.json({
      timeframe,
      period: {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD')
      },
      workoutStats: workoutStats.rows[0],
      exerciseDistribution: exerciseDistribution.rows,
      progressData: progressData.rows,
      formTrends: formTrends.rows
    });

  } catch (error) {
    console.error('Error getting user statistics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get global analytics for trainers/admins
app.get('/api/analytics/global', async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const endDate = moment();
    const startDate = moment().subtract(parseInt(timeframe), 'days');

    // Total users and activity
    const userStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT id) as total_users,
        COUNT(DISTINCT CASE WHEN last_login > $1 THEN id END) as active_users
      FROM users
    `, [startDate.toISOString()]);

    // Workout statistics
    const workoutStats = await pool.query(`
      SELECT 
        COUNT(*) as total_workouts,
        COUNT(DISTINCT user_id) as active_users,
        AVG(duration_minutes) as avg_duration,
        SUM(duration_minutes) as total_duration
      FROM workouts 
      WHERE created_at BETWEEN $1 AND $2
    `, [startDate.toISOString(), endDate.toISOString()]);

    // Popular exercises
    const popularExercises = await pool.query(`
      SELECT 
        e.name,
        e.category,
        COUNT(*) as usage_count
      FROM workout_exercises we
      JOIN exercises e ON we.exercise_id = e.id
      JOIN workouts w ON we.workout_id = w.id
      WHERE w.created_at BETWEEN $1 AND $2
      GROUP BY e.id, e.name, e.category
      ORDER BY usage_count DESC
      LIMIT 20
    `, [startDate.toISOString(), endDate.toISOString()]);

    // User retention (weekly active users)
    const retentionData = await pool.query(`
      SELECT 
        DATE_TRUNC('week', last_login) as week,
        COUNT(DISTINCT id) as active_users
      FROM users 
      WHERE last_login BETWEEN $1 AND $2
      GROUP BY DATE_TRUNC('week', last_login)
      ORDER BY week
    `, [startDate.toISOString(), endDate.toISOString()]);

    res.json({
      timeframe,
      period: {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD')
      },
      userStats: userStats.rows[0],
      workoutStats: workoutStats.rows[0],
      popularExercises: popularExercises.rows,
      retentionData: retentionData.rows
    });

  } catch (error) {
    console.error('Error getting global analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get trainer analytics
app.get('/api/analytics/trainers/:trainerId', async (req, res) => {
  try {
    const { trainerId } = req.params;
    const { timeframe = '30d' } = req.query;
    const endDate = moment();
    const startDate = moment().subtract(parseInt(timeframe), 'days');

    // Get trainer's clients
    const clientStats = await pool.query(`
      SELECT 
        COUNT(*) as total_clients,
        COUNT(CASE WHEN u.last_login > $2 THEN 1 END) as active_clients
      FROM trainer_clients tc
      JOIN users u ON tc.client_id = u.id
      WHERE tc.trainer_id = $1
    `, [trainerId, startDate.toISOString()]);

    // Client workout statistics
    const clientWorkouts = await pool.query(`
      SELECT 
        u.first_name,
        u.last_name,
        COUNT(w.*) as total_workouts,
        AVG(w.duration_minutes) as avg_duration,
        MAX(w.created_at) as last_workout
      FROM trainer_clients tc
      JOIN users u ON tc.client_id = u.id
      LEFT JOIN workouts w ON u.id = w.user_id AND w.created_at BETWEEN $2 AND $3
      WHERE tc.trainer_id = $1
      GROUP BY u.id, u.first_name, u.last_name
      ORDER BY total_workouts DESC
    `, [trainerId, startDate.toISOString(), endDate.toISOString()]);

    res.json({
      timeframe,
      period: {
        start: startDate.format('YYYY-MM-DD'),
        end: endDate.format('YYYY-MM-DD')
      },
      clientStats: clientStats.rows[0],
      clientWorkouts: clientWorkouts.rows
    });

  } catch (error) {
    console.error('Error getting trainer analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Generate reports
app.post('/api/analytics/reports', async (req, res) => {
  try {
    const { reportType, parameters } = req.body;
    const reportId = `report_${Date.now()}`;

    // Cache the report parameters
    await redisClient.setEx(`report:${reportId}`, 3600, JSON.stringify({
      type: reportType,
      parameters,
      status: 'generating',
      createdAt: new Date().toISOString()
    }));

    // In a real implementation, you would trigger a background job here
    // For now, we'll simulate report generation
    setTimeout(async () => {
      await redisClient.setEx(`report:${reportId}`, 3600, JSON.stringify({
        type: reportType,
        parameters,
        status: 'completed',
        createdAt: new Date().toISOString(),
        downloadUrl: `/api/analytics/reports/${reportId}/download`
      }));
    }, 5000);

    res.json({
      reportId,
      status: 'generating',
      estimatedTime: '5 seconds'
    });

  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get report status
app.get('/api/analytics/reports/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const reportData = await redisClient.get(`report:${reportId}`);

    if (!reportData) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json(JSON.parse(reportData));

  } catch (error) {
    console.error('Error getting report status:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Analytics service running on port ${PORT}`);
});

module.exports = app;
