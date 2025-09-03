import { configureStore } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import workoutSlice from './slices/workoutSlice';
import exerciseSlice from './slices/exerciseSlice';
import progressSlice from './slices/progressSlice';

export const store = configureStore({
  reducer: {
    auth: authSlice,
    workout: workoutSlice,
    exercise: exerciseSlice,
    progress: progressSlice,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});
