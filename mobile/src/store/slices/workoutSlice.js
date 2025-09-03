import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';

// Async thunks for workout operations
export const fetchWorkouts = createAsyncThunk(
  'workout/fetchWorkouts',
  async ({ page = 1, limit = 10, status }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(status && { status }),
      });

      const response = await fetch(`${API_BASE_URL}/api/workouts?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch workouts');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchWorkoutById = createAsyncThunk(
  'workout/fetchWorkoutById',
  async (workoutId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/workouts/${workoutId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch workout');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const createWorkout = createAsyncThunk(
  'workout/createWorkout',
  async (workoutData, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/workouts`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(workoutData),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to create workout');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const generateAIWorkout = createAsyncThunk(
  'workout/generateAIWorkout',
  async ({ sessionType = 'full_body' }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/ai/generate/workout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ session_type: sessionType }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to generate AI workout');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const startWorkoutSession = createAsyncThunk(
  'workout/startWorkoutSession',
  async (workoutId, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/workouts/${workoutId}/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to start workout session');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const completeWorkoutSession = createAsyncThunk(
  'workout/completeWorkoutSession',
  async ({ sessionId, exercisesCompleted, caloriesBurned, notes }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          exercisesCompleted,
          caloriesBurned,
          notes,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to complete workout session');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchWorkoutStats = createAsyncThunk(
  'workout/fetchWorkoutStats',
  async ({ period = 30 }, { rejectWithValue }) => {
    try {
      const token = await AsyncStorage.getItem('authToken');

      const response = await fetch(`${API_BASE_URL}/api/workouts/stats?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch workout stats');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  workouts: [],
  currentWorkout: null,
  currentSession: null,
  aiGeneratedWorkout: null,
  stats: null,
  isLoading: false,
  isGenerating: false,
  error: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const workoutSlice = createSlice({
  name: 'workout',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentWorkout: (state) => {
      state.currentWorkout = null;
    },
    clearCurrentSession: (state) => {
      state.currentSession = null;
    },
    clearAIWorkout: (state) => {
      state.aiGeneratedWorkout = null;
    },
    updateSessionProgress: (state, action) => {
      if (state.currentSession) {
        state.currentSession = {
          ...state.currentSession,
          ...action.payload,
        };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Workouts
      .addCase(fetchWorkouts.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkouts.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workouts = action.payload.workouts;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchWorkouts.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Workout by ID
      .addCase(fetchWorkoutById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkoutById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentWorkout = action.payload;
      })
      .addCase(fetchWorkoutById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Create Workout
      .addCase(createWorkout.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createWorkout.fulfilled, (state, action) => {
        state.isLoading = false;
        state.workouts = [action.payload, ...state.workouts];
        state.currentWorkout = action.payload;
      })
      .addCase(createWorkout.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Generate AI Workout
      .addCase(generateAIWorkout.pending, (state) => {
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateAIWorkout.fulfilled, (state, action) => {
        state.isGenerating = false;
        state.aiGeneratedWorkout = action.payload;
      })
      .addCase(generateAIWorkout.rejected, (state, action) => {
        state.isGenerating = false;
        state.error = action.payload;
      })
      
      // Start Workout Session
      .addCase(startWorkoutSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(startWorkoutSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = {
          ...action.payload,
          startTime: new Date().toISOString(),
          exercisesCompleted: {},
          currentExerciseIndex: 0,
        };
      })
      .addCase(startWorkoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Complete Workout Session
      .addCase(completeWorkoutSession.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(completeWorkoutSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentSession = null;
        // Update the current workout's session count if applicable
        if (state.currentWorkout) {
          state.currentWorkout.session_count = (state.currentWorkout.session_count || 0) + 1;
          state.currentWorkout.last_completed = action.payload.session.completed_at;
        }
      })
      .addCase(completeWorkoutSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Workout Stats
      .addCase(fetchWorkoutStats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchWorkoutStats.fulfilled, (state, action) => {
        state.isLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchWorkoutStats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearCurrentWorkout, 
  clearCurrentSession, 
  clearAIWorkout, 
  updateSessionProgress 
} = workoutSlice.actions;

export default workoutSlice.reducer;
