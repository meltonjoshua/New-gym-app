import React, { createContext, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAuthToken, fetchUserProfile } from '../store/slices/authSlice';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading, profileSetupComplete } = useSelector(
    (state) => state.auth
  );
  
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setIsInitializing(true);
      
      // Check for stored token
      const storedToken = await AsyncStorage.getItem('authToken');
      
      if (storedToken) {
        // Set token in store
        dispatch(setAuthToken(storedToken));
        
        // Fetch user profile
        const result = await dispatch(fetchUserProfile());
        
        if (fetchUserProfile.rejected.match(result)) {
          // Token might be invalid, remove it
          await AsyncStorage.removeItem('authToken');
          dispatch(setAuthToken(null));
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setIsInitializing(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    isLoading: isLoading || isInitializing,
    profileSetupComplete,
    isInitializing,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
