import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/api';

// Async thunks for exercise operations
export const fetchExercises = createAsyncThunk(
  'exercise/fetchExercises',
  async ({ category, muscleGroup, difficulty, equipment, search }, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      
      if (category) params.append('category', category);
      if (muscleGroup) params.append('muscleGroup', muscleGroup);
      if (difficulty) params.append('difficulty', difficulty.toString());
      if (equipment) params.append('equipment', equipment);
      if (search) params.append('search', search);

      const response = await fetch(`${API_BASE_URL}/api/public/exercises?${params}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch exercises');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

export const fetchExerciseById = createAsyncThunk(
  'exercise/fetchExerciseById',
  async (exerciseId, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/public/exercises/${exerciseId}`, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return rejectWithValue(data.error || 'Failed to fetch exercise');
      }

      return data;
    } catch (error) {
      return rejectWithValue(error.message || 'Network error');
    }
  }
);

const initialState = {
  exercises: [],
  currentExercise: null,
  categories: [
    'Strength',
    'Cardio',
    'Flexibility',
    'Balance',
    'Endurance',
  ],
  muscleGroups: [
    'chest',
    'back',
    'shoulders',
    'arms',
    'core',
    'legs',
    'glutes',
    'full body',
  ],
  equipmentTypes: [
    'bodyweight',
    'dumbbells',
    'barbell',
    'resistance bands',
    'kettlebell',
    'machine',
    'cable',
    'medicine ball',
  ],
  filters: {
    category: null,
    muscleGroup: null,
    difficulty: null,
    equipment: null,
    search: '',
  },
  isLoading: false,
  error: null,
};

const exerciseSlice = createSlice({
  name: 'exercise',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentExercise: (state) => {
      state.currentExercise = null;
    },
    setFilters: (state, action) => {
      state.filters = {
        ...state.filters,
        ...action.payload,
      };
    },
    clearFilters: (state) => {
      state.filters = {
        category: null,
        muscleGroup: null,
        difficulty: null,
        equipment: null,
        search: '',
      };
    },
    setSearchQuery: (state, action) => {
      state.filters.search = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Exercises
      .addCase(fetchExercises.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExercises.fulfilled, (state, action) => {
        state.isLoading = false;
        state.exercises = action.payload.exercises;
      })
      .addCase(fetchExercises.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Exercise by ID
      .addCase(fetchExerciseById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchExerciseById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentExercise = action.payload;
      })
      .addCase(fetchExerciseById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { 
  clearError, 
  clearCurrentExercise, 
  setFilters, 
  clearFilters, 
  setSearchQuery 
} = exerciseSlice.actions;

export default exerciseSlice.reducer;
