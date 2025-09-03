import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';

// Async thunks for progress operations
export const fetchProgressAnalysis = createAsyncThunk(
  'progress/fetchProgressAnalysis',
  async (_, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/ai/analyze/progress`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch progress analysis');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const recordUserMetrics = createAsyncThunk(
  'progress/recordUserMetrics',
  async (metricsData, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/users/metrics`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metricsData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to record metrics');
      }

      return { ...metricsData, timestamp: new Date().toISOString() };
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

// Helper function to calculate progress metrics from workout stats
const calculateProgressMetrics = (stats) => {
  if (!stats) return {};

  const {
    total_sessions,
    total_calories_burned,
    total_duration_minutes,
    current_streak,
    favorite_exercises,
  } = stats.summary || {};

  // Calculate weekly averages (assuming 30-day period)
  const weeksInPeriod = 4.3; // approximately 30 days / 7
  const weeklyAverages = {
    sessions: Math.round((total_sessions || 0) / weeksInPeriod * 10) / 10,
    calories: Math.round((total_calories_burned || 0) / weeksInPeriod),
    duration: Math.round((total_duration_minutes || 0) / weeksInPeriod),
  };

  // Determine fitness trends
  const trends = {
    consistency: current_streak >= 7 ? 'excellent' : current_streak >= 3 ? 'good' : 'needs_improvement',
    intensity: total_calories_burned > 2000 ? 'high' : total_calories_burned > 1000 ? 'moderate' : 'low',
    variety: favorite_exercises?.length >= 3 ? 'good' : 'limited',
  };

  return {
    weeklyAverages,
    trends,
    totalStats: stats.summary,
  };
};

const initialState = {
  insights: [],
  trends: {},
  recommendations: [],
  weeklyAverages: {},
  progressMetrics: {},
  recentMetrics: [],
  achievements: [],
  isLoading: false,
  error: null,
  lastUpdated: null,
};

const progressSlice = createSlice({
  name: 'progress',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    addLocalMetric: (state, action) => {
      // Add metric locally before API call
      state.recentMetrics = [
        {
          ...action.payload,
          timestamp: new Date().toISOString(),
          isLocal: true,
        },
        ...state.recentMetrics.slice(0, 9), // Keep last 10 metrics
      ];
    },
    updateProgressFromWorkoutStats: (state, action) => {
      // Update progress metrics based on workout stats
      const calculatedMetrics = calculateProgressMetrics(action.payload);
      state.progressMetrics = {
        ...state.progressMetrics,
        ...calculatedMetrics,
      };
    },
    addAchievement: (state, action) => {
      // Add new achievement
      const achievement = {
        ...action.payload,
        earnedAt: new Date().toISOString(),
        isNew: true,
      };
      
      // Check if achievement already exists
      const exists = state.achievements.some(a => a.id === achievement.id);
      if (!exists) {
        state.achievements = [achievement, ...state.achievements];
      }
    },
    markAchievementAsViewed: (state, action) => {
      const achievementId = action.payload;
      const achievement = state.achievements.find(a => a.id === achievementId);
      if (achievement) {
        achievement.isNew = false;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Progress Analysis
      .addCase(fetchProgressAnalysis.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchProgressAnalysis.fulfilled, (state, action) => {
        state.isLoading = false;
        state.insights = action.payload.insights || [];
        state.trends = action.payload.trends || {};
        state.recommendations = action.payload.recommendations || [];
        state.lastUpdated = new Date().toISOString();
      })
      .addCase(fetchProgressAnalysis.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Record User Metrics
      .addCase(recordUserMetrics.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(recordUserMetrics.fulfilled, (state, action) => {
        state.isLoading = false;
        
        // Update recent metrics
        state.recentMetrics = [
          action.payload,
          ...state.recentMetrics.filter(m => !m.isLocal).slice(0, 9),
        ];
        
        // Update progress metrics if it includes current strength or body composition
        if (action.payload.currentStrength || action.payload.bodyComposition) {
          state.progressMetrics = {
            ...state.progressMetrics,
            latestMetrics: action.payload,
          };
        }
      })
      .addCase(recordUserMetrics.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        
        // Remove any local metrics that failed to sync
        state.recentMetrics = state.recentMetrics.filter(m => !m.isLocal);
      });
  },
});

export const { 
  clearError, 
  addLocalMetric, 
  updateProgressFromWorkoutStats, 
  addAchievement, 
  markAchievementAsViewed 
} = progressSlice.actions;

export default progressSlice.reducer;
