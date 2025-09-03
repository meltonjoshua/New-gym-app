-- FitAI Pro Database Schema
-- Initialize the database with all required tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    profile JSONB DEFAULT '{}',
    preferences JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMP
);

-- User profiles with detailed fitness information
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    age INTEGER,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    fitness_level VARCHAR(20) CHECK (fitness_level IN ('beginner', 'intermediate', 'advanced')),
    goals TEXT[],
    medical_conditions TEXT[],
    workout_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- User metrics for tracking progress
CREATE TABLE user_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    current_strength JSONB DEFAULT '{}',
    cardio_baseline DECIMAL(8,2),
    body_composition JSONB DEFAULT '{}',
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- Exercise library
CREATE TABLE exercises (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    muscle_groups TEXT[],
    equipment TEXT[],
    instructions JSONB DEFAULT '{}',
    media_urls JSONB DEFAULT '{}',
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    calories_per_minute DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Workouts table
CREATE TABLE workouts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255),
    exercises JSONB NOT NULL,
    workout_type VARCHAR(100),
    estimated_duration INTEGER, -- in minutes
    difficulty_level INTEGER CHECK (difficulty_level BETWEEN 1 AND 10),
    completed_at TIMESTAMP,
    performance_data JSONB DEFAULT '{}',
    ai_generated BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Workout sessions (individual workout instances)
CREATE TABLE workout_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    started_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    actual_duration INTEGER, -- in minutes
    exercises_completed JSONB DEFAULT '{}',
    form_analysis_data JSONB DEFAULT '{}',
    calories_burned DECIMAL(8,2),
    ai_feedback JSONB DEFAULT '{}',
    session_notes TEXT
);

-- Progress tracking
CREATE TABLE user_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    metrics JSONB DEFAULT '{}',
    ai_insights JSONB DEFAULT '{}',
    workout_streak INTEGER DEFAULT 0,
    total_workouts INTEGER DEFAULT 0,
    total_calories_burned DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Form analysis results
CREATE TABLE form_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES workout_sessions(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255),
    video_timestamp DECIMAL(10,3),
    form_score DECIMAL(3,2) CHECK (form_score BETWEEN 0 AND 1),
    feedback_data JSONB DEFAULT '{}',
    corrections JSONB DEFAULT '{}',
    rep_count INTEGER,
    analyzed_at TIMESTAMP DEFAULT NOW()
);

-- User achievements and badges
CREATE TABLE achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    badge_icon_url VARCHAR(500),
    criteria JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE user_achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    achievement_id UUID REFERENCES achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- Social features
CREATE TABLE user_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    friend_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status VARCHAR(20) CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Workout sharing and challenges
CREATE TABLE workout_shares (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workout_id UUID REFERENCES workouts(id) ON DELETE CASCADE,
    shared_by UUID REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    share_code VARCHAR(50) UNIQUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Nutrition integration
CREATE TABLE nutrition_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    plan_name VARCHAR(255),
    daily_calories INTEGER,
    macros JSONB DEFAULT '{}',
    meal_plan JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Device integrations
CREATE TABLE device_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    device_type VARCHAR(100),
    device_id VARCHAR(255),
    connection_data JSONB DEFAULT '{}',
    last_sync TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100),
    title VARCHAR(255),
    message TEXT,
    data JSONB DEFAULT '{}',
    read BOOLEAN DEFAULT false,
    sent_at TIMESTAMP DEFAULT NOW()
);

-- AI model training data
CREATE TABLE ai_training_data (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    data_type VARCHAR(100),
    training_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_workouts_user_id ON workouts(user_id);
CREATE INDEX idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX idx_user_progress_user_id_date ON user_progress(user_id, date);
CREATE INDEX idx_form_analysis_session_id ON form_analysis(session_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);

-- Sample data for testing
INSERT INTO achievements (name, description, badge_icon_url, criteria) VALUES
('First Workout', 'Complete your first workout session', '/badges/first-workout.png', '{"workouts_completed": 1}'),
('Week Warrior', 'Complete 7 workouts in a week', '/badges/week-warrior.png', '{"weekly_workouts": 7}'),
('Form Master', 'Achieve 95%+ form score in 10 exercises', '/badges/form-master.png', '{"high_form_scores": 10}'),
('Calorie Crusher', 'Burn 1000 calories in a single week', '/badges/calorie-crusher.png', '{"weekly_calories": 1000}');

-- Insert sample exercises
INSERT INTO exercises (name, category, muscle_groups, equipment, instructions, difficulty_level, calories_per_minute) VALUES
('Push-ups', 'Strength', ARRAY['chest', 'triceps', 'shoulders'], ARRAY['bodyweight'], '{"steps": ["Start in plank position", "Lower body to ground", "Push back up"]}', 3, 8.5),
('Squats', 'Strength', ARRAY['quadriceps', 'glutes', 'hamstrings'], ARRAY['bodyweight'], '{"steps": ["Stand with feet shoulder-width apart", "Lower into sitting position", "Return to standing"]}', 2, 7.2),
('Burpees', 'Cardio', ARRAY['full body'], ARRAY['bodyweight'], '{"steps": ["Start standing", "Drop into push-up position", "Jump back to standing", "Jump up with arms overhead"]}', 8, 12.0),
('Deadlifts', 'Strength', ARRAY['hamstrings', 'glutes', 'back'], ARRAY['barbell', 'dumbbells'], '{"steps": ["Stand with feet hip-width apart", "Hinge at hips and lower weight", "Drive hips forward to return to standing"]}', 6, 9.5);
