import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Async thunks
export const fetchDashboardData = createAsyncThunk(
  'dashboard/fetchDashboardData',
  async (timeRange = '30d', { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/dashboard?timeRange=${timeRange}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch dashboard data'
      );
    }
  }
);

export const fetchSystemMetrics = createAsyncThunk(
  'dashboard/fetchSystemMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/system-metrics`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch system metrics'
      );
    }
  }
);

export const fetchRecentActivities = createAsyncThunk(
  'dashboard/fetchRecentActivities',
  async (limit = 10, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/analytics/recent-activities?limit=${limit}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch recent activities'
      );
    }
  }
);

const initialState = {
  overview: {
    totalUsers: 0,
    activeUsers: 0,
    totalWorkouts: 0,
    totalCalories: 0,
    averageFormScore: 0,
    userRetention: 0,
  },
  systemMetrics: {
    cpu: 0,
    memory: 0,
    storage: 0,
    network: 0,
    responseTime: 0,
    errors: 0,
    activeConnections: 0,
  },
  userGrowth: [],
  workoutTrends: [],
  exercisePopularity: [],
  recentActivities: [],
  systemAlerts: [],
  loading: false,
  error: null,
  lastUpdated: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateOverviewStat: (state, action) => {
      const { key, value } = action.payload;
      if (state.overview.hasOwnProperty(key)) {
        state.overview[key] = value;
      }
    },
    addSystemAlert: (state, action) => {
      state.systemAlerts.unshift(action.payload);
      // Keep only last 10 alerts
      if (state.systemAlerts.length > 10) {
        state.systemAlerts = state.systemAlerts.slice(0, 10);
      }
    },
    removeSystemAlert: (state, action) => {
      state.systemAlerts = state.systemAlerts.filter(
        alert => alert.id !== action.payload
      );
    },
    updateRealtimeMetric: (state, action) => {
      const { metric, value } = action.payload;
      if (state.systemMetrics.hasOwnProperty(metric)) {
        state.systemMetrics[metric] = value;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch dashboard data cases
      .addCase(fetchDashboardData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDashboardData.fulfilled, (state, action) => {
        state.loading = false;
        state.overview = action.payload.overview || state.overview;
        state.userGrowth = action.payload.userGrowth || [];
        state.workoutTrends = action.payload.workoutTrends || [];
        state.exercisePopularity = action.payload.exercisePopularity || [];
        state.lastUpdated = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDashboardData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch system metrics cases
      .addCase(fetchSystemMetrics.pending, (state) => {
        // Don't set loading for background metric updates
      })
      .addCase(fetchSystemMetrics.fulfilled, (state, action) => {
        state.systemMetrics = {
          ...state.systemMetrics,
          ...action.payload
        };
      })
      .addCase(fetchSystemMetrics.rejected, (state, action) => {
        // Silently fail for system metrics to avoid interrupting UX
        console.error('System metrics fetch failed:', action.payload);
      })
      // Fetch recent activities cases
      .addCase(fetchRecentActivities.fulfilled, (state, action) => {
        state.recentActivities = action.payload;
      })
      .addCase(fetchRecentActivities.rejected, (state, action) => {
        console.error('Recent activities fetch failed:', action.payload);
      });
  },
});

export const {
  clearError,
  updateOverviewStat,
  addSystemAlert,
  removeSystemAlert,
  updateRealtimeMetric,
} = dashboardSlice.actions;

// Selectors
export const selectDashboard = (state) => state.dashboard;
export const selectOverview = (state) => state.dashboard.overview;
export const selectSystemMetrics = (state) => state.dashboard.systemMetrics;
export const selectUserGrowth = (state) => state.dashboard.userGrowth;
export const selectWorkoutTrends = (state) => state.dashboard.workoutTrends;
export const selectExercisePopularity = (state) => state.dashboard.exercisePopularity;
export const selectRecentActivities = (state) => state.dashboard.recentActivities;
export const selectSystemAlerts = (state) => state.dashboard.systemAlerts;
export const selectDashboardLoading = (state) => state.dashboard.loading;
export const selectDashboardError = (state) => state.dashboard.error;
export const selectLastUpdated = (state) => state.dashboard.lastUpdated;

export default dashboardSlice.reducer;
