const express = require('express');
const { Pool } = require('pg');
const redis = require('redis');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cron = require('node-cron');
const nodemailer = require('nodemailer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

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

// Email transporter
const emailTransporter = nodemailer.createTransporter({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

// Push notification service (Firebase)
let firebaseAdmin;
try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    firebaseAdmin = require('firebase-admin');
    firebaseAdmin.initializeApp({
      credential: firebaseAdmin.credential.cert(serviceAccount)
    });
  }
} catch (error) {
  console.warn('Firebase not configured, push notifications disabled');
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', service: 'notification-service' });
});

// Send push notification
app.post('/api/notifications/push', async (req, res) => {
  try {
    const { userId, title, body, data = {} } = req.body;

    if (!firebaseAdmin) {
      return res.status(503).json({ error: 'Push notifications not configured' });
    }

    // Get user's FCM token
    const userResult = await pool.query(
      'SELECT fcm_token FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { fcm_token } = userResult.rows[0];
    if (!fcm_token) {
      return res.status(400).json({ error: 'User has no FCM token' });
    }

    const message = {
      notification: { title, body },
      data,
      token: fcm_token
    };

    const response = await firebaseAdmin.messaging().send(message);

    // Log notification
    await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, status, sent_at)
      VALUES ($1, 'push', $2, $3, 'sent', NOW())
    `, [userId, title, body]);

    res.json({ success: true, messageId: response });

  } catch (error) {
    console.error('Error sending push notification:', error);
    res.status(500).json({ error: 'Failed to send push notification' });
  }
});

// Send email notification
app.post('/api/notifications/email', async (req, res) => {
  try {
    const { userId, subject, htmlContent, textContent } = req.body;

    // Get user's email
    const userResult = await pool.query(
      'SELECT email, first_name, last_name FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { email, first_name, last_name } = userResult.rows[0];

    const mailOptions = {
      from: process.env.FROM_EMAIL || 'noreply@fitaipro.com',
      to: email,
      subject,
      text: textContent,
      html: htmlContent
    };

    await emailTransporter.sendMail(mailOptions);

    // Log notification
    await pool.query(`
      INSERT INTO notifications (user_id, type, title, message, status, sent_at)
      VALUES ($1, 'email', $2, $3, 'sent', NOW())
    `, [userId, subject, textContent || htmlContent]);

    res.json({ success: true });

  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).json({ error: 'Failed to send email' });
  }
});

// Send workout reminder
app.post('/api/notifications/workout-reminder', async (req, res) => {
  try {
    const { userId, workoutType = 'workout' } = req.body;

    const title = 'Workout Reminder';
    const body = `Time for your ${workoutType}! Let's achieve your fitness goals today.`;

    // Send push notification
    if (firebaseAdmin) {
      try {
        await sendPushNotification(userId, title, body);
      } catch (error) {
        console.error('Failed to send push notification:', error);
      }
    }

    res.json({ success: true });

  } catch (error) {
    console.error('Error sending workout reminder:', error);
    res.status(500).json({ error: 'Failed to send workout reminder' });
  }
});

// Get user notifications
app.get('/api/notifications/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    const result = await pool.query(`
      SELECT id, type, title, message, status, sent_at, read_at
      FROM notifications 
      WHERE user_id = $1
      ORDER BY sent_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);

    res.json(result.rows);

  } catch (error) {
    console.error('Error getting notifications:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
app.patch('/api/notifications/:notificationId/read', async (req, res) => {
  try {
    const { notificationId } = req.params;

    await pool.query(`
      UPDATE notifications 
      SET read_at = NOW() 
      WHERE id = $1 AND read_at IS NULL
    `, [notificationId]);

    res.json({ success: true });

  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Scheduled tasks
// Daily workout reminders
cron.schedule('0 8 * * *', async () => {
  console.log('Running daily workout reminders...');
  
  try {
    // Get users who haven't worked out in the last 24 hours
    const inactiveUsers = await pool.query(`
      SELECT DISTINCT u.id
      FROM users u
      LEFT JOIN workouts w ON u.id = w.user_id AND w.created_at > NOW() - INTERVAL '24 hours'
      WHERE w.id IS NULL
        AND u.notification_preferences->>'workout_reminders' = 'true'
        AND u.created_at < NOW() - INTERVAL '24 hours'
    `);

    for (const user of inactiveUsers.rows) {
      try {
        await sendPushNotification(
          user.id,
          'Daily Workout Reminder',
          'You haven\'t worked out today. Let\'s get moving! 💪'
        );
      } catch (error) {
        console.error(`Failed to send reminder to user ${user.id}:`, error);
      }
    }

    console.log(`Sent workout reminders to ${inactiveUsers.rows.length} users`);

  } catch (error) {
    console.error('Error in daily workout reminders:', error);
  }
});

// Weekly progress reports
cron.schedule('0 9 * * 0', async () => {
  console.log('Running weekly progress reports...');
  
  try {
    const users = await pool.query(`
      SELECT id, email, first_name 
      FROM users 
      WHERE notification_preferences->>'weekly_reports' = 'true'
    `);

    for (const user of users.rows) {
      try {
        // Get user's weekly stats
        const stats = await pool.query(`
          SELECT 
            COUNT(*) as workouts,
            SUM(duration_minutes) as total_minutes,
            AVG(duration_minutes) as avg_duration,
            SUM(calories_burned) as total_calories
          FROM workouts 
          WHERE user_id = $1 AND created_at > NOW() - INTERVAL '7 days'
        `, [user.id]);

        const weeklyStats = stats.rows[0];
        
        if (weeklyStats.workouts > 0) {
          const htmlContent = `
            <h2>Your Weekly Fitness Report</h2>
            <p>Hi ${user.first_name},</p>
            <p>Here's your fitness summary for this week:</p>
            <ul>
              <li>Workouts completed: ${weeklyStats.workouts}</li>
              <li>Total time exercised: ${weeklyStats.total_minutes} minutes</li>
              <li>Average workout duration: ${Math.round(weeklyStats.avg_duration)} minutes</li>
              <li>Total calories burned: ${weeklyStats.total_calories}</li>
            </ul>
            <p>Keep up the great work! 🏆</p>
          `;

          await emailTransporter.sendMail({
            from: process.env.FROM_EMAIL || 'noreply@fitaipro.com',
            to: user.email,
            subject: 'Your Weekly Fitness Report',
            html: htmlContent
          });
        }

      } catch (error) {
        console.error(`Failed to send weekly report to user ${user.id}:`, error);
      }
    }

  } catch (error) {
    console.error('Error in weekly progress reports:', error);
  }
});

// Helper function to send push notifications
async function sendPushNotification(userId, title, body, data = {}) {
  if (!firebaseAdmin) return;

  const userResult = await pool.query(
    'SELECT fcm_token FROM users WHERE id = $1',
    [userId]
  );

  if (userResult.rows.length === 0 || !userResult.rows[0].fcm_token) {
    return;
  }

  const message = {
    notification: { title, body },
    data,
    token: userResult.rows[0].fcm_token
  };

  const response = await firebaseAdmin.messaging().send(message);

  // Log notification
  await pool.query(`
    INSERT INTO notifications (user_id, type, title, message, status, sent_at)
    VALUES ($1, 'push', $2, $3, 'sent', NOW())
  `, [userId, title, body]);

  return response;
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Notification service running on port ${PORT}`);
});

module.exports = app;
