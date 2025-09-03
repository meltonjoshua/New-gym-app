// API Configuration
export const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000'  // Development
  : 'https://api.fitaipro.com';  // Production

export const SOCKET_URL = __DEV__
  ? 'http://localhost:3000'
  : 'https://api.fitaipro.com';

// App Configuration
export const APP_CONFIG = {
  // Workout session settings
  ANALYSIS_INTERVAL: 1000, // milliseconds between frame analysis
  MAX_SESSION_DURATION: 7200, // 2 hours in seconds
  AUTO_SAVE_INTERVAL: 30000, // 30 seconds
  
  // Form analysis settings
  FORM_SCORE_THRESHOLD: 0.7, // Minimum score for "good" form
  REP_COUNT_DEBOUNCE: 500, // milliseconds to debounce rep counting
  
  // Progress tracking
  ACHIEVEMENTS_CHECK_INTERVAL: 60000, // 1 minute
  PROGRESS_SYNC_INTERVAL: 300000, // 5 minutes
  
  // Camera settings
  VIDEO_QUALITY: 0.3, // Balance between quality and performance
  FRAME_RATE: 30,
  
  // Notifications
  WORKOUT_REMINDER_HOUR: 18, // 6 PM
  STREAK_REMINDER_ENABLED: true,
  
  // Offline settings
  MAX_OFFLINE_WORKOUTS: 10,
  OFFLINE_DATA_RETENTION_DAYS: 7,
};

// Exercise categories and muscle groups
export const EXERCISE_CATEGORIES = [
  'Strength',
  'Cardio',
  'Flexibility',
  'Balance',
  'Endurance',
  'Sports',
  'Rehabilitation',
];

export const MUSCLE_GROUPS = [
  { id: 'chest', name: 'Chest', icon: 'body' },
  { id: 'back', name: 'Back', icon: 'body' },
  { id: 'shoulders', name: 'Shoulders', icon: 'body' },
  { id: 'arms', name: 'Arms', icon: 'arm-flex' },
  { id: 'core', name: 'Core', icon: 'body' },
  { id: 'legs', name: 'Legs', icon: 'walk' },
  { id: 'glutes', name: 'Glutes', icon: 'body' },
  { id: 'full body', name: 'Full Body', icon: 'body-outline' },
];

export const EQUIPMENT_TYPES = [
  { id: 'bodyweight', name: 'Bodyweight', icon: 'body' },
  { id: 'dumbbells', name: 'Dumbbells', icon: 'barbell' },
  { id: 'barbell', name: 'Barbell', icon: 'barbell' },
  { id: 'resistance bands', name: 'Resistance Bands', icon: 'remove' },
  { id: 'kettlebell', name: 'Kettlebell', icon: 'fitness' },
  { id: 'machine', name: 'Machine', icon: 'hardware-chip' },
  { id: 'cable', name: 'Cable', icon: 'git-pull-request' },
  { id: 'medicine ball', name: 'Medicine Ball', icon: 'basketball' },
];

// Fitness levels and their characteristics
export const FITNESS_LEVELS = {
  beginner: {
    name: 'Beginner',
    description: 'New to exercise or returning after a long break',
    characteristics: [
      'Focus on learning proper form',
      'Shorter workout durations',
      'More rest between exercises',
      'Bodyweight and light weights',
    ],
    recommendedWorkoutDuration: 20,
    setsRange: [1, 3],
    repsRange: [8, 15],
    restTime: 60,
  },
  intermediate: {
    name: 'Intermediate',
    description: 'Regular exercise routine for 3-12 months',
    characteristics: [
      'Comfortable with basic movements',
      'Can handle moderate intensity',
      'Ready for compound exercises',
      'Progressive overload principles',
    ],
    recommendedWorkoutDuration: 30,
    setsRange: [2, 4],
    repsRange: [6, 12],
    restTime: 45,
  },
  advanced: {
    name: 'Advanced',
    description: 'Consistent training for over a year',
    characteristics: [
      'Excellent form and technique',
      'High intensity workouts',
      'Complex movement patterns',
      'Sport-specific training',
    ],
    recommendedWorkoutDuration: 45,
    setsRange: [3, 5],
    repsRange: [4, 10],
    restTime: 30,
  },
};

// Workout types and their focus
export const WORKOUT_TYPES = {
  strength: {
    name: 'Strength Training',
    icon: 'barbell',
    color: '#FF6B6B',
    description: 'Build muscle and increase strength',
    primaryMuscleGroups: ['chest', 'back', 'shoulders', 'arms', 'legs'],
    averageCaloriesPerMinute: 6,
  },
  cardio: {
    name: 'Cardiovascular',
    icon: 'heart',
    color: '#4ECDC4',
    description: 'Improve heart health and endurance',
    primaryMuscleGroups: ['full body'],
    averageCaloriesPerMinute: 10,
  },
  hiit: {
    name: 'HIIT',
    icon: 'flash',
    color: '#45B7D1',
    description: 'High-intensity interval training',
    primaryMuscleGroups: ['full body'],
    averageCaloriesPerMinute: 12,
  },
  flexibility: {
    name: 'Flexibility',
    icon: 'leaf',
    color: '#96CEB4',
    description: 'Improve flexibility and mobility',
    primaryMuscleGroups: ['full body'],
    averageCaloriesPerMinute: 3,
  },
  yoga: {
    name: 'Yoga',
    icon: 'flower',
    color: '#FFEAA7',
    description: 'Mind-body wellness and flexibility',
    primaryMuscleGroups: ['core', 'full body'],
    averageCaloriesPerMinute: 4,
  },
  full_body: {
    name: 'Full Body',
    icon: 'body',
    color: '#DDA0DD',
    description: 'Comprehensive workout targeting all muscle groups',
    primaryMuscleGroups: ['chest', 'back', 'shoulders', 'arms', 'legs', 'core'],
    averageCaloriesPerMinute: 8,
  },
};

// Achievement definitions
export const ACHIEVEMENTS = {
  first_workout: {
    id: 'first_workout',
    name: 'First Steps',
    description: 'Complete your first workout',
    icon: 'trophy',
    color: '#FFD700',
    criteria: { workouts_completed: 1 },
  },
  week_warrior: {
    id: 'week_warrior',
    name: 'Week Warrior',
    description: 'Complete 7 workouts in a week',
    icon: 'medal',
    color: '#C0C0C0',
    criteria: { weekly_workouts: 7 },
  },
  form_master: {
    id: 'form_master',
    name: 'Form Master',
    description: 'Achieve 95%+ form score in 10 exercises',
    icon: 'star',
    color: '#CD7F32',
    criteria: { high_form_scores: 10 },
  },
  calorie_crusher: {
    id: 'calorie_crusher',
    name: 'Calorie Crusher',
    description: 'Burn 1000 calories in a single week',
    icon: 'flame',
    color: '#FF4500',
    criteria: { weekly_calories: 1000 },
  },
  consistency_king: {
    id: 'consistency_king',
    name: 'Consistency Champion',
    description: 'Maintain a 30-day workout streak',
    icon: 'calendar',
    color: '#9370DB',
    criteria: { workout_streak: 30 },
  },
  strength_seeker: {
    id: 'strength_seeker',
    name: 'Strength Seeker',
    description: 'Complete 50 strength training workouts',
    icon: 'barbell',
    color: '#B22222',
    criteria: { strength_workouts: 50 },
  },
  cardio_champion: {
    id: 'cardio_champion',
    name: 'Cardio Champion',
    description: 'Complete 25 cardio workouts',
    icon: 'heart',
    color: '#DC143C',
    criteria: { cardio_workouts: 25 },
  },
  early_bird: {
    id: 'early_bird',
    name: 'Early Bird',
    description: 'Complete 10 workouts before 8 AM',
    icon: 'sunny',
    color: '#FFA500',
    criteria: { morning_workouts: 10 },
  },
};

// Colors and themes
export const COLORS = {
  primary: '#007AFF',
  secondary: '#5856D6',
  success: '#34C759',
  warning: '#FF9500',
  error: '#FF3B30',
  info: '#5AC8FA',
  
  // Neutral colors
  background: '#F2F2F7',
  surface: '#FFFFFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  
  // Gradients
  primaryGradient: ['#007AFF', '#5856D6'],
  successGradient: ['#34C759', '#30D158'],
  warningGradient: ['#FF9500', '#FFCC02'],
  errorGradient: ['#FF3B30', '#FF6482'],
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BORDER_RADIUS = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  round: 50,
};

export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 20,
  xxl: 24,
  title: 28,
  hero: 32,
};

// Default export for easy importing
export default {
  API_BASE_URL,
  SOCKET_URL,
  APP_CONFIG,
  EXERCISE_CATEGORIES,
  MUSCLE_GROUPS,
  EQUIPMENT_TYPES,
  FITNESS_LEVELS,
  WORKOUT_TYPES,
  ACHIEVEMENTS,
  COLORS,
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
};
