import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

export default function RealtimeFeedback({ feedback, isAnalyzing, sessionStarted }) {
  const [slideAnim] = useState(new Animated.Value(-200));
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (feedback && sessionStarted) {
      // Slide in and fade in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after 3 seconds if good form
      if (feedback.form_score >= 0.8) {
        setTimeout(() => {
          Animated.parallel([
            Animated.timing(slideAnim, {
              toValue: -200,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(fadeAnim, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
          ]).start();
        }, 3000);
      }
    } else {
      // Hide feedback
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -200,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [feedback, sessionStarted]);

  const getFormScoreColor = (score) => {
    if (score >= 0.8) return '#00FF00'; // Green
    if (score >= 0.6) return '#FFD700'; // Yellow
    return '#FF3B30'; // Red
  };

  const getFormScoreText = (score) => {
    if (score >= 0.8) return 'Excellent Form!';
    if (score >= 0.6) return 'Good Form';
    if (score >= 0.4) return 'Needs Improvement';
    return 'Poor Form';
  };

  const getFormIcon = (score) => {
    if (score >= 0.8) return 'checkmark-circle';
    if (score >= 0.6) return 'warning';
    return 'close-circle';
  };

  if (!sessionStarted) {
    return (
      <View style={styles.instructionContainer}>
        <LinearGradient
          colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.3)']}
          style={styles.instructionGradient}
        >
          <Ionicons name="body" size={40} color="white" />
          <Text style={styles.instructionTitle}>Position Yourself</Text>
          <Text style={styles.instructionText}>
            Stand in full view of the camera and press START to begin form analysis
          </Text>
        </LinearGradient>
      </View>
    );
  }

  if (isAnalyzing && !feedback) {
    return (
      <View style={styles.analyzingContainer}>
        <LinearGradient
          colors={['rgba(0,123,255,0.8)', 'rgba(0,123,255,0.4)']}
          style={styles.analyzingGradient}
        >
          <Animated.View style={{ transform: [{ rotate: '360deg' }] }}>
            <Ionicons name="sync" size={30} color="white" />
          </Animated.View>
          <Text style={styles.analyzingText}>Analyzing form...</Text>
        </LinearGradient>
      </View>
    );
  }

  if (!feedback) return null;

  return (
    <Animated.View
      style={[
        styles.feedbackContainer,
        {
          transform: [{ translateY: slideAnim }],
          opacity: fadeAnim,
        },
      ]}
    >
      <LinearGradient
        colors={[
          `${getFormScoreColor(feedback.form_score)}CC`,
          `${getFormScoreColor(feedback.form_score)}66`,
        ]}
        style={styles.feedbackGradient}
      >
        <View style={styles.scoreContainer}>
          <Ionicons
            name={getFormIcon(feedback.form_score)}
            size={30}
            color="white"
          />
          <View style={styles.scoreTextContainer}>
            <Text style={styles.scoreText}>
              {getFormScoreText(feedback.form_score)}
            </Text>
            <Text style={styles.scorePercentage}>
              {Math.round(feedback.form_score * 100)}%
            </Text>
          </View>
        </View>

        {feedback.feedback && feedback.feedback.length > 0 && (
          <View style={styles.feedbackTextContainer}>
            {feedback.feedback.slice(0, 2).map((text, index) => (
              <Text key={index} style={styles.feedbackText}>
                • {text}
              </Text>
            ))}
          </View>
        )}

        {feedback.corrections && feedback.corrections.length > 0 && (
          <View style={styles.correctionsContainer}>
            <Text style={styles.correctionsTitle}>💡 Quick Tips:</Text>
            {feedback.corrections.slice(0, 1).map((correction, index) => (
              <Text key={index} style={styles.correctionText}>
                {correction}
              </Text>
            ))}
          </View>
        )}
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  instructionContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -100 }],
  },
  instructionGradient: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
  },
  instructionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    marginTop: 10,
    marginBottom: 5,
  },
  instructionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 22,
  },
  analyzingContainer: {
    position: 'absolute',
    top: '50%',
    left: 20,
    right: 20,
    transform: [{ translateY: -50 }],
  },
  analyzingGradient: {
    padding: 15,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingText: {
    fontSize: 16,
    color: 'white',
    marginLeft: 10,
    fontWeight: '600',
  },
  feedbackContainer: {
    position: 'absolute',
    top: 180,
    left: 20,
    right: 20,
  },
  feedbackGradient: {
    padding: 15,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  scoreTextContainer: {
    marginLeft: 10,
    flex: 1,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  scorePercentage: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  feedbackTextContainer: {
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: 'white',
    lineHeight: 18,
    marginBottom: 2,
  },
  correctionsContainer: {
    marginTop: 5,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.3)',
  },
  correctionsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  correctionText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 17,
    fontStyle: 'italic',
  },
});
