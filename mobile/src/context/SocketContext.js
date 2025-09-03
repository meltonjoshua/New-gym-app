import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useSelector } from 'react-redux';
import io from 'socket.io-client';
import { SOCKET_URL } from '../config/api';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const { token, isAuthenticated } = useSelector((state) => state.auth);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (isAuthenticated && token) {
      connectSocket();
    } else {
      disconnectSocket();
    }

    return () => {
      disconnectSocket();
    };
  }, [isAuthenticated, token]);

  const connectSocket = () => {
    try {
      console.log('Connecting to socket...');
      
      const newSocket = io(SOCKET_URL, {
        auth: {
          token: token,
        },
        transports: ['websocket', 'polling'],
        timeout: 10000,
        forceNew: true,
      });

      // Connection event handlers
      newSocket.on('connect', () => {
        console.log('Socket connected:', newSocket.id);
        setIsConnected(true);
        setConnectionError(null);
        reconnectAttempts.current = 0;
      });

      newSocket.on('disconnect', (reason) => {
        console.log('Socket disconnected:', reason);
        setIsConnected(false);
        
        if (reason === 'io server disconnect') {
          // Server initiated disconnect, don't reconnect
          setConnectionError('Server disconnected');
        }
      });

      newSocket.on('connect_error', (error) => {
        console.error('Socket connection error:', error.message);
        setIsConnected(false);
        setConnectionError(error.message);
        
        reconnectAttempts.current += 1;
        if (reconnectAttempts.current >= maxReconnectAttempts) {
          console.log('Max reconnection attempts reached');
          newSocket.disconnect();
        }
      });

      // Workout-specific event handlers
      newSocket.on('workout_started_ack', (data) => {
        console.log('Workout started acknowledgment:', data);
      });

      newSocket.on('workout_completed_ack', (data) => {
        console.log('Workout completed acknowledgment:', data);
      });

      newSocket.on('motivation_boost', (message) => {
        console.log('Motivation message:', message);
        // Could trigger a notification or in-app message
      });

      // Error handler for analysis errors
      newSocket.on('analysis_error', (error) => {
        console.error('Analysis error from server:', error);
      });

      setSocket(newSocket);
    } catch (error) {
      console.error('Socket connection setup error:', error);
      setConnectionError(error.message);
    }
  };

  const disconnectSocket = () => {
    if (socket) {
      console.log('Disconnecting socket...');
      socket.disconnect();
      setSocket(null);
      setIsConnected(false);
      setConnectionError(null);
    }
  };

  const emitWorkoutStarted = (workoutData) => {
    if (socket && isConnected) {
      socket.emit('workout_started', workoutData);
    } else {
      console.warn('Socket not connected, cannot emit workout_started');
    }
  };

  const emitWorkoutCompleted = (completionData) => {
    if (socket && isConnected) {
      socket.emit('workout_completed', completionData);
    } else {
      console.warn('Socket not connected, cannot emit workout_completed');
    }
  };

  const emitAnalyzeFrame = (frameData) => {
    if (socket && isConnected) {
      socket.emit('analyze_frame', frameData);
    } else {
      console.warn('Socket not connected, cannot emit analyze_frame');
    }
  };

  const value = {
    socket,
    isConnected,
    connectionError,
    emitWorkoutStarted,
    emitWorkoutCompleted,
    emitAnalyzeFrame,
    reconnect: connectSocket,
    disconnect: disconnectSocket,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};
