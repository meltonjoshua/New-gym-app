import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { Camera } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSocket } from '../../context/SocketContext';
import RealtimeFeedback from '../../components/camera/RealtimeFeedback';

const { width, height } = Dimensions.get('window');

export default function CameraWorkoutScreen({ route, navigation }) {
  const { exercise } = route.params;
  const { socket } = useSocket();
  
  const [hasPermission, setHasPermission] = useState(null);
  const [cameraType, setCameraType] = useState(Camera.Constants.Type.front);
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [formFeedback, setFormFeedback] = useState(null);
  const [repCount, setRepCount] = useState(0);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  const cameraRef = useRef();
  const analysisInterval = useRef();

  useEffect(() => {
    getCameraPermissions();
    return () => {
      if (analysisInterval.current) {
        clearInterval(analysisInterval.current);
      }
    };
  }, []);

  useEffect(() => {
    if (socket) {
      socket.on('form_feedback', handleFormFeedback);
      socket.on('rep_count', handleRepCount);
      socket.on('analysis_error', handleAnalysisError);

      return () => {
        socket.off('form_feedback');
        socket.off('rep_count');
        socket.off('analysis_error');
      };
    }
  }, [socket]);

  const getCameraPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleFormFeedback = (feedback) => {
    setFormFeedback(feedback);
    setIsAnalyzing(false);
  };

  const handleRepCount = (count) => {
    setRepCount(count);
  };

  const handleAnalysisError = (error) => {
    setIsAnalyzing(false);
    Alert.alert('Analysis Error', error.message);
  };

  const startAnalysis = async () => {
    if (!socket || !cameraRef.current) return;

    setSessionStarted(true);
    setIsAnalyzing(true);

    // Start periodic frame capture and analysis
    analysisInterval.current = setInterval(async () => {
      try {
        if (cameraRef.current && socket) {
          const photo = await cameraRef.current.takePictureAsync({
            quality: 0.3,
            base64: true,
            skipProcessing: true,
          });

          socket.emit('analyze_frame', {
            frame: photo.base64,
            exercise_type: exercise.name,
            timestamp: Date.now(),
          });
        }
      } catch (error) {
        console.error('Frame capture error:', error);
      }
    }, 1000); // Analyze every second
  };

  const stopAnalysis = () => {
    if (analysisInterval.current) {
      clearInterval(analysisInterval.current);
      analysisInterval.current = null;
    }
    setSessionStarted(false);
    setIsAnalyzing(false);
    setFormFeedback(null);
    setRepCount(0);
  };

  const toggleCamera = () => {
    setCameraType(
      cameraType === Camera.Constants.Type.back
        ? Camera.Constants.Type.front
        : Camera.Constants.Type.back
    );
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera</Text>
        <TouchableOpacity
          style={styles.button}
          onPress={getCameraPermissions}
        >
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={cameraRef}
        style={styles.camera}
        type={cameraType}
        ratio="16:9"
      >
        {/* Overlay with pose guidelines */}
        <View style={styles.overlay}>
          
          {/* Exercise info header */}
          <View style={styles.header}>
            <LinearGradient
              colors={['rgba(0,0,0,0.8)', 'transparent']}
              style={styles.headerGradient}
            >
              <Text style={styles.exerciseName}>{exercise.name}</Text>
              <Text style={styles.exerciseInstructions}>
                {exercise.instructions?.steps?.[0] || 'Follow the on-screen guidance'}
              </Text>
            </LinearGradient>
          </View>

          {/* Rep counter */}
          <View style={styles.repCounter}>
            <Text style={styles.repCountText}>{repCount}</Text>
            <Text style={styles.repLabel}>REPS</Text>
          </View>

          {/* Real-time feedback */}
          <RealtimeFeedback
            feedback={formFeedback}
            isAnalyzing={isAnalyzing}
            sessionStarted={sessionStarted}
          />

          {/* Controls */}
          <View style={styles.controls}>
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.controlsGradient}
            >
              <View style={styles.controlsRow}>
                
                {/* Flip camera button */}
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={toggleCamera}
                >
                  <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>

                {/* Start/Stop analysis button */}
                <TouchableOpacity
                  style={[
                    styles.analysisButton,
                    sessionStarted ? styles.stopButton : styles.startButton
                  ]}
                  onPress={sessionStarted ? stopAnalysis : startAnalysis}
                  disabled={isAnalyzing && !sessionStarted}
                >
                  {isAnalyzing && !sessionStarted ? (
                    <ActivityIndicator color="white" size="large" />
                  ) : (
                    <>
                      <Ionicons 
                        name={sessionStarted ? "stop" : "play"} 
                        size={30} 
                        color="white" 
                      />
                      <Text style={styles.analysisButtonText}>
                        {sessionStarted ? 'STOP' : 'START'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Back button */}
                <TouchableOpacity
                  style={styles.controlButton}
                  onPress={() => {
                    stopAnalysis();
                    navigation.goBack();
                  }}
                >
                  <Ionicons name="close" size={30} color="white" />
                </TouchableOpacity>

              </View>
            </LinearGradient>
          </View>

        </View>
      </Camera>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  camera: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  headerGradient: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  exerciseInstructions: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 5,
  },
  repCounter: {
    position: 'absolute',
    top: 120,
    right: 20,
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 15,
    borderRadius: 15,
  },
  repCountText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#00FF00',
  },
  repLabel: {
    fontSize: 12,
    color: 'white',
    marginTop: 5,
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  controlsGradient: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analysisButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  startButton: {
    backgroundColor: '#00FF00',
  },
  stopButton: {
    backgroundColor: '#FF3B30',
  },
  analysisButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
