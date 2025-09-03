const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const { body, validationResult } = require('express-validator');
const winston = require('winston');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const nodemailer = require('nodemailer');
const crypto = require('crypto');
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
    new winston.transports.File({ filename: 'logs/user-service.log' })
  ]
});

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Email configuration
const emailTransporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Middleware
app.use(express.json());
app.use(passport.initialize());

// User interface matching the README specification
class UserProfile {
  constructor(data) {
    this.id = data.id;
    this.email = data.email;
    this.profile = {
      age: data.age || null,
      weight: data.weight || null,
      height: data.height || null,
      fitnessLevel: data.fitness_level || 'beginner',
      goals: data.goals || [],
      medicalConditions: data.medical_conditions || [],
      preferences: {
        workoutTypes: data.workout_types || [],
        duration: data.preferred_duration || 30,
        intensity: data.preferred_intensity || 'medium'
      }
    };
    this.metrics = {
      currentStrength: data.current_strength || {},
      cardioBaseline: data.cardio_baseline || 0,
      bodyComposition: {
        bodyFat: data.body_fat || null,
        muscleMass: data.muscle_mass || null
      }
    };
  }
}

// Passport JWT Strategy
passport.use(new JwtStrategy({
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET || 'fallback-secret'
}, async (payload, done) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [payload.userId]);
    if (result.rows.length > 0) {
      return done(null, result.rows[0]);
    }
    return done(null, false);
  } catch (error) {
    return done(error, false);
  }
}));

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: "/auth/google/callback"
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user exists
    let result = await pool.query('SELECT * FROM users WHERE email = $1', [profile.emails[0].value]);
    
    if (result.rows.length > 0) {
      return done(null, result.rows[0]);
    }
    
    // Create new user
    const newUser = await pool.query(
      'INSERT INTO users (email, profile, email_verified) VALUES ($1, $2, $3) RETURNING *',
      [
        profile.emails[0].value,
        JSON.stringify({
          googleId: profile.id,
          name: profile.displayName,
          picture: profile.photos[0]?.value
        }),
        true
      ]
    );
    
    return done(null, newUser.rows[0]);
  } catch (error) {
    return done(error, null);
  }
}));

// Authentication routes
/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
app.post('/auth/register', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 8 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate email verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, profile) 
       VALUES ($1, $2, $3) RETURNING id, email, created_at`,
      [email, hashedPassword, JSON.stringify({ verificationToken })]
    );

    const user = result.rows[0];

    // Send verification email
    if (process.env.EMAIL_USER) {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Verify your FitAI Pro account',
        html: `
          <h1>Welcome to FitAI Pro!</h1>
          <p>Please click the link below to verify your email address:</p>
          <a href="${process.env.FRONTEND_URL}/verify-email/${verificationToken}">Verify Email</a>
        `
      });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    logger.info(`User registered: ${email}`);
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: { id: user.id, email: user.email },
      emailVerificationRequired: true
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
app.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    // Get user
    const result = await pool.query(
      'SELECT id, email, password_hash, email_verified, is_active FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await pool.query('UPDATE users SET last_login = NOW() WHERE id = $1', [user.id]);

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );

    logger.info(`User logged in: ${email}`);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email },
      emailVerified: user.email_verified
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Email verification
app.get('/auth/verify-email/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(
      `UPDATE users 
       SET email_verified = true, 
           profile = profile - 'verificationToken',
           updated_at = NOW()
       WHERE profile->>'verificationToken' = $1 
       RETURNING id, email`,
      [token]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    logger.error('Email verification error:', error);
    res.status(500).json({ error: 'Email verification failed' });
  }
});

// Profile management routes
app.get('/users/profile', passport.authenticate('jwt', { session: false }), async (req, res) => {
  try {
    const userId = req.user.id;

    const result = await pool.query(`
      SELECT u.*, up.*, um.* 
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      LEFT JOIN user_metrics um ON u.id = um.user_id
      WHERE u.id = $1
      ORDER BY um.recorded_at DESC
      LIMIT 1
    `, [userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = result.rows[0];
    const userProfile = new UserProfile(userData);

    res.json(userProfile);
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.put('/users/profile', [
  passport.authenticate('jwt', { session: false }),
  body('age').optional().isInt({ min: 13, max: 120 }),
  body('weight').optional().isFloat({ min: 30, max: 300 }),
  body('height').optional().isFloat({ min: 100, max: 250 }),
  body('fitnessLevel').optional().isIn(['beginner', 'intermediate', 'advanced'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const {
      age, weight, height, fitnessLevel, goals, medicalConditions,
      workoutTypes, duration, intensity
    } = req.body;

    // Start transaction
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Update or insert user profile
      await client.query(`
        INSERT INTO user_profiles (user_id, age, weight, height, fitness_level, goals, medical_conditions, workout_preferences)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (user_id)
        DO UPDATE SET 
          age = COALESCE($2, user_profiles.age),
          weight = COALESCE($3, user_profiles.weight),
          height = COALESCE($4, user_profiles.height),
          fitness_level = COALESCE($5, user_profiles.fitness_level),
          goals = COALESCE($6, user_profiles.goals),
          medical_conditions = COALESCE($7, user_profiles.medical_conditions),
          workout_preferences = COALESCE($8, user_profiles.workout_preferences),
          updated_at = NOW()
      `, [
        userId, age, weight, height, fitnessLevel, goals, medicalConditions,
        JSON.stringify({ workoutTypes, duration, intensity })
      ]);

      await client.query('COMMIT');

      logger.info(`Profile updated for user: ${userId}`);
      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    logger.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Metrics tracking
app.post('/users/metrics', [
  passport.authenticate('jwt', { session: false }),
  body('currentStrength').optional().isObject(),
  body('cardioBaseline').optional().isFloat({ min: 0 }),
  body('bodyComposition').optional().isObject()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const userId = req.user.id;
    const { currentStrength, cardioBaseline, bodyComposition } = req.body;

    await pool.query(`
      INSERT INTO user_metrics (user_id, current_strength, cardio_baseline, body_composition)
      VALUES ($1, $2, $3, $4)
    `, [
      userId,
      JSON.stringify(currentStrength),
      cardioBaseline,
      JSON.stringify(bodyComposition)
    ]);

    logger.info(`Metrics recorded for user: ${userId}`);
    res.status(201).json({ message: 'Metrics recorded successfully' });
  } catch (error) {
    logger.error('Metrics recording error:', error);
    res.status(500).json({ error: 'Failed to record metrics' });
  }
});

// Password reset
app.post('/auth/forgot-password', [
  body('email').isEmail().normalizeEmail()
], async (req, res) => {
  try {
    const { email } = req.body;
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 3600000); // 1 hour

    await pool.query(
      `UPDATE users 
       SET profile = profile || $1 
       WHERE email = $2`,
      [JSON.stringify({ resetToken, resetExpires }), email]
    );

    if (process.env.EMAIL_USER) {
      await emailTransporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Password Reset - FitAI Pro',
        html: `
          <h1>Password Reset Request</h1>
          <p>Click the link below to reset your password:</p>
          <a href="${process.env.FRONTEND_URL}/reset-password/${resetToken}">Reset Password</a>
          <p>This link will expire in 1 hour.</p>
        `
      });
    }

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    logger.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback',
  passport.authenticate('google', { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { userId: req.user.id, email: req.user.email },
      process.env.JWT_SECRET || 'fallback-secret',
      { expiresIn: '24h' }
    );
    
    res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
  }
);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', service: 'user-service' });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  logger.info(`User service running on port ${PORT}`);
});

module.exports = app;
