import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Async thunks
export const fetchWorkouts = createAsyncThunk(
  'workouts/fetchWorkouts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const { page = 1, limit = 10, search = '', type = '', difficulty = '' } = params;
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search }),
        ...(type && { type }),
        ...(difficulty && { difficulty }),
      });
      
      const response = await axios.get(`${API_BASE_URL}/workouts?${queryParams}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch workouts'
      );
    }
  }
);

export const fetchWorkoutById = createAsyncThunk(
  'workouts/fetchWorkoutById',
  async (workoutId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/workouts/${workoutId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to fetch workout'
      );
    }
  }
);

export const createWorkout = createAsyncThunk(
  'workouts/createWorkout',
  async (workoutData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/workouts`, workoutData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to create workout'
      );
    }
  }
);

export const updateWorkout = createAsyncThunk(
  'workouts/updateWorkout',
  async ({ workoutId, workoutData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`${API_BASE_URL}/workouts/${workoutId}`, workoutData);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update workout'
      );
    }
  }
);

export const deleteWorkout = createAsyncThunk(
  'workouts/deleteWorkout',
  async (workoutId, { rejectWithValue }) => {
    try {
      await axios.delete(`${API_BASE_URL}/workouts/${workoutId}`);
      return workoutId;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to delete workout'
      );
    }
  }
);

export const duplicateWorkout = createAsyncThunk(
  'workouts/duplicateWorkout',
  async (workoutId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/workouts/${workoutId}/duplicate`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to duplicate workout'
      );
    }
  }
);

export const toggleWorkoutStatus = createAsyncThunk(
  'workouts/toggleWorkoutStatus',
  async (workoutId, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/workouts/${workoutId}/toggle-status`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to toggle workout status'
      );
    }
  }
);

export const generateAIWorkout = createAsyncThunk(
  'workouts/generateAIWorkout',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/ai/generate-workout`, preferences);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to generate AI workout'
      );
    }
  }
);

export const bulkUpdateWorkouts = createAsyncThunk(
  'workouts/bulkUpdateWorkouts',
  async ({ workoutIds, action, data }, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/workouts/bulk-update`, {
        workoutIds,
        action,
        data
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || 'Failed to update workouts'
      );
    }
  }
);

const initialState = {
  workouts: [],
  selectedWorkout: null,
  totalWorkouts: 0,
  currentPage: 1,
  totalPages: 1,
  loading: false,
  error: null,
  filters: {
    search: '',
    type: '',
    difficulty: '',
  },
  selectedWorkouts: [],
  aiGenerating: false,
  workoutTypes: ['HIIT', 'Strength', 'Cardio', 'Yoga', 'Core', 'Flexibility'],
  difficultyLevels: ['Beginner', 'Intermediate', 'Advanced'],
};

const workoutSlice = createSlice({
  name: 'workouts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        search: '',
        type: '',
        difficulty: '',
      };
    },
    setSelectedWorkouts: (state, action) => {
      state.selectedWorkouts = action.payload;
    },
    addSelectedWorkout: (state, action) => {
      if (!state.selectedWorkouts.includes(action.payload)) {
        state.selectedWorkouts.push(action.payload);
      }
    },
    removeSelectedWorkout: (state, action) => {
      state.selectedWorkouts = state.selectedWorkouts.filter(id => id !== action.payload);
    },
    clearSelectedWorkouts: (state) => {
      state.selectedWorkouts = [];
    },
    setSelectedWorkout: (state, action) => {
      state.selectedWorkout = action.payload;
    },
    clearSelectedWorkout: (state) => {
      state.selectedWorkout = null;
    },
    updateWorkoutInList: (state, action) => {
      const { workoutId, updates } = action.payload;
      const workoutIndex = state.workouts.findIndex(workout => workout.id === workoutId);
      if (workoutIndex !== -1) {
        state.workouts[workoutIndex] = { ...state.workouts[workoutIndex], ...updates };
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch workouts cases
      .addCase(fetchWorkouts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkouts.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts = action.payload.workouts || [];
        state.totalWorkouts = action.payload.total || 0;
        state.currentPage = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.error = null;
      })
      .addCase(fetchWorkouts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch workout by ID cases
      .addCase(fetchWorkoutById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWorkoutById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedWorkout = action.payload;
        state.error = null;
      })
      .addCase(fetchWorkoutById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Create workout cases
      .addCase(createWorkout.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createWorkout.fulfilled, (state, action) => {
        state.loading = false;
        state.workouts.unshift(action.payload);
        state.totalWorkouts += 1;
        state.error = null;
      })
      .addCase(createWorkout.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Update workout cases
      .addCase(updateWorkout.fulfilled, (state, action) => {
        const workoutIndex = state.workouts.findIndex(workout => workout.id === action.payload.id);
        if (workoutIndex !== -1) {
          state.workouts[workoutIndex] = action.payload;
        }
        if (state.selectedWorkout && state.selectedWorkout.id === action.payload.id) {
          state.selectedWorkout = action.payload;
        }
      })
      .addCase(updateWorkout.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Delete workout cases
      .addCase(deleteWorkout.fulfilled, (state, action) => {
        state.workouts = state.workouts.filter(workout => workout.id !== action.payload);
        state.totalWorkouts -= 1;
        state.selectedWorkouts = state.selectedWorkouts.filter(id => id !== action.payload);
        if (state.selectedWorkout && state.selectedWorkout.id === action.payload) {
          state.selectedWorkout = null;
        }
      })
      .addCase(deleteWorkout.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Duplicate workout cases
      .addCase(duplicateWorkout.fulfilled, (state, action) => {
        state.workouts.unshift(action.payload);
        state.totalWorkouts += 1;
      })
      .addCase(duplicateWorkout.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Toggle workout status cases
      .addCase(toggleWorkoutStatus.fulfilled, (state, action) => {
        const workoutIndex = state.workouts.findIndex(workout => workout.id === action.payload.id);
        if (workoutIndex !== -1) {
          state.workouts[workoutIndex] = action.payload;
        }
        if (state.selectedWorkout && state.selectedWorkout.id === action.payload.id) {
          state.selectedWorkout = action.payload;
        }
      })
      .addCase(toggleWorkoutStatus.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Generate AI workout cases
      .addCase(generateAIWorkout.pending, (state) => {
        state.aiGenerating = true;
        state.error = null;
      })
      .addCase(generateAIWorkout.fulfilled, (state, action) => {
        state.aiGenerating = false;
        state.workouts.unshift(action.payload);
        state.totalWorkouts += 1;
        state.error = null;
      })
      .addCase(generateAIWorkout.rejected, (state, action) => {
        state.aiGenerating = false;
        state.error = action.payload;
      })
      // Bulk update cases
      .addCase(bulkUpdateWorkouts.fulfilled, (state, action) => {
        // Update affected workouts in the list
        action.payload.updatedWorkouts?.forEach(updatedWorkout => {
          const workoutIndex = state.workouts.findIndex(workout => workout.id === updatedWorkout.id);
          if (workoutIndex !== -1) {
            state.workouts[workoutIndex] = updatedWorkout;
          }
        });
        // Clear selection after bulk update
        state.selectedWorkouts = [];
      })
      .addCase(bulkUpdateWorkouts.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const {
  clearError,
  setFilters,
  clearFilters,
  setSelectedWorkouts,
  addSelectedWorkout,
  removeSelectedWorkout,
  clearSelectedWorkouts,
  setSelectedWorkout,
  clearSelectedWorkout,
  updateWorkoutInList,
} = workoutSlice.actions;

// Selectors
export const selectWorkouts = (state) => state.workouts.workouts;
export const selectSelectedWorkout = (state) => state.workouts.selectedWorkout;
export const selectTotalWorkouts = (state) => state.workouts.totalWorkouts;
export const selectCurrentPage = (state) => state.workouts.currentPage;
export const selectTotalPages = (state) => state.workouts.totalPages;
export const selectWorkoutsLoading = (state) => state.workouts.loading;
export const selectWorkoutsError = (state) => state.workouts.error;
export const selectWorkoutFilters = (state) => state.workouts.filters;
export const selectSelectedWorkouts = (state) => state.workouts.selectedWorkouts;
export const selectAIGenerating = (state) => state.workouts.aiGenerating;
export const selectWorkoutTypes = (state) => state.workouts.workoutTypes;
export const selectDifficultyLevels = (state) => state.workouts.difficultyLevels;

// Complex selectors
export const selectFilteredWorkouts = (state) => {
  const { workouts, filters } = state.workouts;
  return workouts.filter(workout => {
    const matchesSearch = !filters.search || 
      workout.name.toLowerCase().includes(filters.search.toLowerCase()) ||
      workout.description.toLowerCase().includes(filters.search.toLowerCase());
    const matchesType = !filters.type || workout.type === filters.type;
    const matchesDifficulty = !filters.difficulty || workout.difficulty === filters.difficulty;
    
    return matchesSearch && matchesType && matchesDifficulty;
  });
};

export const selectWorkoutStats = (state) => {
  const workouts = state.workouts.workouts;
  const stats = {
    total: workouts.length,
    active: workouts.filter(w => w.isActive).length,
    inactive: workouts.filter(w => !w.isActive).length,
    aiGenerated: workouts.filter(w => w.aiGenerated).length,
    byType: {},
    byDifficulty: {},
    avgCompletions: 0,
    avgRating: 0,
  };

  // Calculate type distribution
  workouts.forEach(workout => {
    stats.byType[workout.type] = (stats.byType[workout.type] || 0) + 1;
    stats.byDifficulty[workout.difficulty] = (stats.byDifficulty[workout.difficulty] || 0) + 1;
  });

  // Calculate averages
  if (workouts.length > 0) {
    stats.avgCompletions = Math.round(
      workouts.reduce((sum, w) => sum + (w.completions || 0), 0) / workouts.length
    );
    stats.avgRating = (
      workouts.reduce((sum, w) => sum + (w.averageRating || 0), 0) / workouts.length
    ).toFixed(1);
  }

  return stats;
};

export default workoutSlice.reducer;
