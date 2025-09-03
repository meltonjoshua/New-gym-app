import os
import cv2
import numpy as np
import mediapipe as mp
import tensorflow as tf
from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
from psycopg2.extras import RealDictCursor
import redis
import json
import logging
from datetime import datetime
import pickle
from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Logging configuration
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Redis connection
redis_client = redis.Redis.from_url(os.getenv('REDIS_URL', 'redis://localhost:6379'))

# Database connection
def get_db_connection():
    return psycopg2.connect(
        os.getenv('DATABASE_URL'),
        cursor_factory=RealDictCursor
    )

@dataclass
class PoseAnalysisResult:
    form_score: float
    feedback: List[str]
    corrections: List[str]
    rep_count: int
    confidence: float
    landmarks: List[Dict]

@dataclass
class WorkoutRecommendation:
    exercises: List[Dict]
    estimated_duration: int
    difficulty_level: int
    adaptations: List[str]
    reasoning: str

class PoseAnalyzer:
    def __init__(self):
        self.mediapipe_model = mp.solutions.pose
        self.pose = self.mediapipe_model.Pose(
            static_image_mode=False,
            model_complexity=1,
            enable_segmentation=False,
            min_detection_confidence=0.5,
            min_tracking_confidence=0.5
        )
        self.drawing = mp.solutions.drawing_utils
        
        # Load custom form classifier models
        self.form_models = self._load_form_models()
        
        # Exercise-specific analysis parameters
        self.exercise_configs = {
            'push-ups': {
                'key_points': ['left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow', 'left_wrist', 'right_wrist'],
                'angles': ['elbow_angle', 'body_alignment'],
                'rep_threshold': 0.7
            },
            'squats': {
                'key_points': ['left_hip', 'right_hip', 'left_knee', 'right_knee', 'left_ankle', 'right_ankle'],
                'angles': ['knee_angle', 'hip_angle', 'ankle_alignment'],
                'rep_threshold': 0.6
            },
            'deadlifts': {
                'key_points': ['left_shoulder', 'right_shoulder', 'left_hip', 'right_hip', 'left_knee', 'right_knee'],
                'angles': ['back_angle', 'hip_hinge', 'knee_alignment'],
                'rep_threshold': 0.8
            },
            'burpees': {
                'key_points': ['nose', 'left_shoulder', 'right_shoulder', 'left_hip', 'right_hip'],
                'angles': ['body_position', 'jump_height'],
                'rep_threshold': 0.5
            }
        }
        
    def _load_form_models(self):
        """Load pre-trained form analysis models"""
        models = {}
        model_path = os.getenv('MODEL_PATH', '/app/models')
        
        try:
            # Load exercise-specific models
            for exercise in ['push-ups', 'squats', 'deadlifts', 'burpees']:
                model_file = f'{model_path}/{exercise}_form_classifier.h5'
                if os.path.exists(model_file):
                    models[exercise] = tf.keras.models.load_model(model_file)
                else:
                    logger.warning(f"Model not found for {exercise}: {model_file}")
                    models[exercise] = None
        except Exception as e:
            logger.error(f"Error loading models: {e}")
            
        return models
    
    def extract_pose_landmarks(self, video_frame):
        """Extract pose landmarks from video frame"""
        try:
            # Convert BGR to RGB
            rgb_frame = cv2.cvtColor(video_frame, cv2.COLOR_BGR2RGB)
            
            # Process with MediaPipe
            results = self.pose.process(rgb_frame)
            
            if results.pose_landmarks:
                # Convert to normalized coordinates
                landmarks = []
                for landmark in results.pose_landmarks.landmark:
                    landmarks.append({
                        'x': landmark.x,
                        'y': landmark.y,
                        'z': landmark.z,
                        'visibility': landmark.visibility
                    })
                return landmarks
            
            return []
        except Exception as e:
            logger.error(f"Error extracting landmarks: {e}")
            return []
    
    def calculate_angle(self, point1, point2, point3):
        """Calculate angle between three points"""
        try:
            # Vector calculations
            a = np.array([point1['x'], point1['y']])
            b = np.array([point2['x'], point2['y']])
            c = np.array([point3['x'], point3['y']])
            
            ba = a - b
            bc = c - b
            
            cosine_angle = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
            cosine_angle = np.clip(cosine_angle, -1.0, 1.0)
            angle = np.arccos(cosine_angle)
            
            return np.degrees(angle)
        except Exception as e:
            logger.error(f"Error calculating angle: {e}")
            return 0
    
    def analyze_exercise_form(self, video_frame, exercise_type: str, user_id: str = None) -> PoseAnalysisResult:
        """Main form analysis function"""
        try:
            # Extract landmarks
            landmarks = self.extract_pose_landmarks(video_frame)
            
            if not landmarks:
                return PoseAnalysisResult(
                    form_score=0.0,
                    feedback=["Unable to detect pose. Please ensure you're clearly visible in the camera."],
                    corrections=[],
                    rep_count=0,
                    confidence=0.0,
                    landmarks=[]
                )
            
            # Exercise-specific analysis
            if exercise_type.lower() in self.exercise_configs:
                form_score = self._analyze_form_quality(landmarks, exercise_type.lower())
                feedback = self._generate_feedback(landmarks, exercise_type.lower(), form_score)
                corrections = self._suggest_corrections(landmarks, exercise_type.lower())
                rep_count = self._count_reps(landmarks, exercise_type.lower(), user_id)
                confidence = self._calculate_confidence(landmarks)
                
                return PoseAnalysisResult(
                    form_score=form_score,
                    feedback=feedback,
                    corrections=corrections,
                    rep_count=rep_count,
                    confidence=confidence,
                    landmarks=landmarks
                )
            else:
                return PoseAnalysisResult(
                    form_score=0.5,
                    feedback=[f"Exercise type '{exercise_type}' not yet supported for detailed analysis."],
                    corrections=[],
                    rep_count=0,
                    confidence=0.5,
                    landmarks=landmarks
                )
                
        except Exception as e:
            logger.error(f"Error in form analysis: {e}")
            return PoseAnalysisResult(
                form_score=0.0,
                feedback=["Analysis error occurred. Please try again."],
                corrections=[],
                rep_count=0,
                confidence=0.0,
                landmarks=[]
            )
    
    def _analyze_form_quality(self, landmarks, exercise_type):
        """Analyze form quality for specific exercise"""
        try:
            config = self.exercise_configs[exercise_type]
            
            if exercise_type == 'push-ups':
                return self._analyze_pushup_form(landmarks)
            elif exercise_type == 'squats':
                return self._analyze_squat_form(landmarks)
            elif exercise_type == 'deadlifts':
                return self._analyze_deadlift_form(landmarks)
            elif exercise_type == 'burpees':
                return self._analyze_burpee_form(landmarks)
            
            return 0.5  # Default score
        except Exception as e:
            logger.error(f"Error analyzing form quality: {e}")
            return 0.0
    
    def _analyze_pushup_form(self, landmarks):
        """Specific analysis for push-ups"""
        try:
            # Key landmarks for push-ups
            left_shoulder = landmarks[11]  # MediaPipe landmark indices
            right_shoulder = landmarks[12]
            left_elbow = landmarks[13]
            right_elbow = landmarks[14]
            left_wrist = landmarks[15]
            right_wrist = landmarks[16]
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            
            # Calculate angles
            left_elbow_angle = self.calculate_angle(left_shoulder, left_elbow, left_wrist)
            right_elbow_angle = self.calculate_angle(right_shoulder, right_elbow, right_wrist)
            
            # Body alignment (straight line from shoulders to hips)
            shoulder_center_y = (left_shoulder['y'] + right_shoulder['y']) / 2
            hip_center_y = (left_hip['y'] + right_hip['y']) / 2
            body_alignment = abs(shoulder_center_y - hip_center_y)
            
            # Scoring
            angle_score = 1.0 - abs(left_elbow_angle - right_elbow_angle) / 180.0
            alignment_score = max(0, 1.0 - body_alignment * 5)  # Penalize misalignment
            
            # Combined score
            form_score = (angle_score * 0.6 + alignment_score * 0.4)
            return min(1.0, max(0.0, form_score))
            
        except Exception as e:
            logger.error(f"Error in push-up analysis: {e}")
            return 0.5
    
    def _analyze_squat_form(self, landmarks):
        """Specific analysis for squats"""
        try:
            # Key landmarks for squats
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            left_knee = landmarks[25]
            right_knee = landmarks[26]
            left_ankle = landmarks[27]
            right_ankle = landmarks[28]
            
            # Calculate knee angles
            left_knee_angle = self.calculate_angle(left_hip, left_knee, left_ankle)
            right_knee_angle = self.calculate_angle(right_hip, right_knee, right_ankle)
            
            # Hip depth (how low the squat goes)
            hip_center_y = (left_hip['y'] + right_hip['y']) / 2
            knee_center_y = (left_knee['y'] + right_knee['y']) / 2
            depth_ratio = hip_center_y / knee_center_y if knee_center_y > 0 else 1
            
            # Scoring
            angle_consistency = 1.0 - abs(left_knee_angle - right_knee_angle) / 180.0
            depth_score = min(1.0, depth_ratio) if depth_ratio <= 1.0 else max(0.5, 2.0 - depth_ratio)
            
            form_score = (angle_consistency * 0.5 + depth_score * 0.5)
            return min(1.0, max(0.0, form_score))
            
        except Exception as e:
            logger.error(f"Error in squat analysis: {e}")
            return 0.5
    
    def _analyze_deadlift_form(self, landmarks):
        """Specific analysis for deadlifts"""
        try:
            # Key landmarks for deadlifts
            left_shoulder = landmarks[11]
            right_shoulder = landmarks[12]
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            left_knee = landmarks[25]
            right_knee = landmarks[26]
            
            # Back angle (should be relatively straight)
            shoulder_center_y = (left_shoulder['y'] + right_shoulder['y']) / 2
            hip_center_y = (left_hip['y'] + right_hip['y']) / 2
            
            # Hip hinge movement
            hip_knee_ratio = hip_center_y / ((left_knee['y'] + right_knee['y']) / 2)
            
            # Scoring based on proper hip hinge and back position
            back_alignment = 1.0 - abs(shoulder_center_y - hip_center_y) * 2
            hip_movement = min(1.0, max(0.0, hip_knee_ratio - 0.5)) * 2
            
            form_score = (back_alignment * 0.6 + hip_movement * 0.4)
            return min(1.0, max(0.0, form_score))
            
        except Exception as e:
            logger.error(f"Error in deadlift analysis: {e}")
            return 0.5
    
    def _analyze_burpee_form(self, landmarks):
        """Specific analysis for burpees"""
        try:
            # Burpees have multiple phases, this is a simplified analysis
            nose = landmarks[0]
            left_shoulder = landmarks[11]
            right_shoulder = landmarks[12]
            left_hip = landmarks[23]
            right_hip = landmarks[24]
            
            # Determine phase based on body position
            nose_y = nose['y']
            shoulder_y = (left_shoulder['y'] + right_shoulder['y']) / 2
            hip_y = (left_hip['y'] + right_hip['y']) / 2
            
            # Simple form check based on body alignment
            vertical_alignment = abs(nose_y - shoulder_y) + abs(shoulder_y - hip_y)
            form_score = max(0.0, 1.0 - vertical_alignment * 3)
            
            return min(1.0, form_score)
            
        except Exception as e:
            logger.error(f"Error in burpee analysis: {e}")
            return 0.5
    
    def _generate_feedback(self, landmarks, exercise_type, form_score):
        """Generate real-time feedback based on form analysis"""
        feedback = []
        
        try:
            if form_score >= 0.9:
                feedback.append("Excellent form! Keep it up!")
            elif form_score >= 0.7:
                feedback.append("Good form. Minor adjustments needed.")
            elif form_score >= 0.5:
                feedback.append("Form needs improvement. Focus on technique.")
            else:
                feedback.append("Poor form detected. Please review exercise instructions.")
            
            # Exercise-specific feedback
            if exercise_type == 'push-ups':
                if form_score < 0.7:
                    feedback.append("Keep your body in a straight line from head to heels.")
                    feedback.append("Lower your chest closer to the ground.")
            elif exercise_type == 'squats':
                if form_score < 0.7:
                    feedback.append("Go deeper - thighs parallel to the ground.")
                    feedback.append("Keep your chest up and knees aligned with toes.")
            elif exercise_type == 'deadlifts':
                if form_score < 0.7:
                    feedback.append("Keep your back straight and chest up.")
                    feedback.append("Drive through your heels and push hips forward.")
            
        except Exception as e:
            logger.error(f"Error generating feedback: {e}")
            feedback = ["Unable to generate feedback at this time."]
        
        return feedback
    
    def _suggest_corrections(self, landmarks, exercise_type):
        """Suggest specific corrections for form improvement"""
        corrections = []
        
        try:
            # General corrections based on landmarks visibility and position
            visible_landmarks = sum(1 for l in landmarks if l['visibility'] > 0.5)
            
            if visible_landmarks < len(landmarks) * 0.7:
                corrections.append("Ensure your full body is visible in the camera frame.")
            
            # Exercise-specific corrections would be implemented here
            # This is a simplified version
            if exercise_type == 'push-ups':
                corrections.append("Focus on controlled movement up and down.")
                corrections.append("Engage your core to maintain body alignment.")
            elif exercise_type == 'squats':
                corrections.append("Initiate movement by pushing hips back.")
                corrections.append("Keep weight distributed across your feet.")
                
        except Exception as e:
            logger.error(f"Error generating corrections: {e}")
            corrections = ["Unable to generate corrections at this time."]
        
        return corrections
    
    def _count_reps(self, landmarks, exercise_type, user_id=None):
        """Count repetitions based on movement patterns"""
        try:
            # This would implement actual rep counting logic
            # For now, returning a placeholder based on cached data
            if user_id:
                cache_key = f"rep_count_{user_id}_{exercise_type}"
                cached_count = redis_client.get(cache_key)
                
                if cached_count:
                    count = int(cached_count) + 1
                    redis_client.setex(cache_key, 300, count)  # 5 minute expiry
                    return count
                else:
                    redis_client.setex(cache_key, 300, 1)
                    return 1
            
            return 0
        except Exception as e:
            logger.error(f"Error counting reps: {e}")
            return 0
    
    def _calculate_confidence(self, landmarks):
        """Calculate confidence score based on landmark visibility"""
        try:
            if not landmarks:
                return 0.0
            
            visible_count = sum(1 for l in landmarks if l['visibility'] > 0.5)
            confidence = visible_count / len(landmarks)
            return min(1.0, confidence)
        except Exception as e:
            logger.error(f"Error calculating confidence: {e}")
            return 0.0

class WorkoutGenerator:
    def __init__(self):
        self.exercise_db = self._load_exercise_database()
        
    def _load_exercise_database(self):
        """Load exercise database from PostgreSQL"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT id, name, category, muscle_groups, equipment, 
                           difficulty_level, calories_per_minute, instructions
                    FROM exercises
                """)
                exercises = cursor.fetchall()
                return [dict(exercise) for exercise in exercises]
        except Exception as e:
            logger.error(f"Error loading exercise database: {e}")
            return []
    
    def generate_personalized_workout(self, user_id: str, session_type: str = 'full_body') -> WorkoutRecommendation:
        """Generate AI-powered personalized workout"""
        try:
            # Get user data and progress
            user_data = self._get_user_data(user_id)
            progress = self._get_progress_metrics(user_id)
            
            # AI-driven exercise selection
            exercises = self._select_exercises(user_data, progress, session_type)
            
            # Dynamic parameter adjustment
            workout = self._optimize_workout_parameters(exercises, user_data)
            
            # Calculate duration and difficulty
            estimated_duration = self._calculate_duration(workout)
            difficulty_level = self._assess_difficulty(workout, user_data)
            adaptations = self._generate_adaptations(workout, user_data)
            reasoning = self._generate_reasoning(workout, user_data, session_type)
            
            return WorkoutRecommendation(
                exercises=workout,
                estimated_duration=estimated_duration,
                difficulty_level=difficulty_level,
                adaptations=adaptations,
                reasoning=reasoning
            )
            
        except Exception as e:
            logger.error(f"Error generating workout: {e}")
            return self._get_fallback_workout()
    
    def _get_user_data(self, user_id):
        """Fetch user profile and preferences"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT u.*, up.*, um.*
                    FROM users u
                    LEFT JOIN user_profiles up ON u.id = up.user_id
                    LEFT JOIN user_metrics um ON u.id = um.user_id
                    WHERE u.id = %s
                    ORDER BY um.recorded_at DESC
                    LIMIT 1
                """, (user_id,))
                
                result = cursor.fetchone()
                return dict(result) if result else {}
        except Exception as e:
            logger.error(f"Error fetching user data: {e}")
            return {}
    
    def _get_progress_metrics(self, user_id):
        """Get user's recent progress data"""
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT date, metrics, ai_insights, workout_streak
                    FROM user_progress
                    WHERE user_id = %s
                    ORDER BY date DESC
                    LIMIT 30
                """, (user_id,))
                
                results = cursor.fetchall()
                return [dict(result) for result in results]
        except Exception as e:
            logger.error(f"Error fetching progress metrics: {e}")
            return []
    
    def _select_exercises(self, user_data, progress, session_type):
        """AI-driven exercise selection based on user profile and progress"""
        try:
            # Filter exercises based on user preferences and equipment
            available_exercises = self.exercise_db.copy()
            
            # Filter by fitness level
            fitness_level = user_data.get('fitness_level', 'beginner')
            level_mapping = {'beginner': (1, 4), 'intermediate': (3, 7), 'advanced': (5, 10)}
            min_diff, max_diff = level_mapping.get(fitness_level, (1, 4))
            
            available_exercises = [
                ex for ex in available_exercises 
                if min_diff <= ex['difficulty_level'] <= max_diff
            ]
            
            # Filter by session type
            if session_type == 'cardio':
                available_exercises = [ex for ex in available_exercises if ex['category'] == 'Cardio']
            elif session_type == 'strength':
                available_exercises = [ex for ex in available_exercises if ex['category'] == 'Strength']
            
            # Select exercises based on goals and muscle groups
            goals = user_data.get('goals', [])
            selected_exercises = []
            
            # Ensure muscle group balance
            muscle_groups_covered = set()
            target_muscle_groups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core']
            
            for target_group in target_muscle_groups:
                suitable_exercises = [
                    ex for ex in available_exercises 
                    if target_group in (ex.get('muscle_groups', []) or [])
                ]
                
                if suitable_exercises:
                    # Select based on user progress and variety
                    chosen = self._smart_exercise_selection(suitable_exercises, progress, user_data)
                    if chosen:
                        selected_exercises.append(chosen)
                        muscle_groups_covered.add(target_group)
            
            # Fill remaining slots with compound movements
            if len(selected_exercises) < 6:  # Target 6 exercises for full workout
                compound_exercises = [
                    ex for ex in available_exercises 
                    if len(ex.get('muscle_groups', [])) > 2 and ex not in selected_exercises
                ]
                
                needed = 6 - len(selected_exercises)
                for _ in range(min(needed, len(compound_exercises))):
                    chosen = self._smart_exercise_selection(compound_exercises, progress, user_data)
                    if chosen and chosen not in selected_exercises:
                        selected_exercises.append(chosen)
            
            return selected_exercises[:6]  # Limit to 6 exercises
            
        except Exception as e:
            logger.error(f"Error selecting exercises: {e}")
            return self.exercise_db[:4]  # Fallback to first 4 exercises
    
    def _smart_exercise_selection(self, exercises, progress, user_data):
        """Select the best exercise from a list based on user progress and preferences"""
        try:
            if not exercises:
                return None
            
            # Score exercises based on multiple factors
            scored_exercises = []
            
            for exercise in exercises:
                score = 0
                
                # Prefer exercises not done recently
                recent_exercises = [
                    ex_name for p in progress[-7:] 
                    for ex_name in p.get('metrics', {}).get('exercises_completed', [])
                ]
                
                if exercise['name'] not in recent_exercises:
                    score += 2
                
                # Prefer exercises matching user goals
                user_goals = user_data.get('goals', [])
                if 'strength' in user_goals and exercise['category'] == 'Strength':
                    score += 1
                if 'cardio' in user_goals and exercise['category'] == 'Cardio':
                    score += 1
                if 'weight_loss' in user_goals and exercise.get('calories_per_minute', 0) > 8:
                    score += 1
                
                # Slight preference for higher difficulty for advanced users
                if user_data.get('fitness_level') == 'advanced':
                    score += exercise['difficulty_level'] * 0.1
                
                scored_exercises.append((exercise, score))
            
            # Return the highest scored exercise
            if scored_exercises:
                scored_exercises.sort(key=lambda x: x[1], reverse=True)
                return scored_exercises[0][0]
            
            return exercises[0]  # Fallback to first exercise
            
        except Exception as e:
            logger.error(f"Error in smart exercise selection: {e}")
            return exercises[0] if exercises else None
    
    def _optimize_workout_parameters(self, exercises, user_data):
        """Optimize sets, reps, and rest periods for each exercise"""
        try:
            optimized_workout = []
            
            fitness_level = user_data.get('fitness_level', 'beginner')
            preferred_duration = user_data.get('preferred_duration', 30)
            
            # Base parameters by fitness level
            base_params = {
                'beginner': {'sets': 2, 'reps': 12, 'rest': 60},
                'intermediate': {'sets': 3, 'reps': 10, 'rest': 45},
                'advanced': {'sets': 4, 'reps': 8, 'rest': 30}
            }
            
            base = base_params.get(fitness_level, base_params['beginner'])
            
            for exercise in exercises:
                # Adjust parameters based on exercise type
                sets = base['sets']
                reps = base['reps']
                rest = base['rest']
                
                # Cardio exercises get different parameters
                if exercise['category'] == 'Cardio':
                    reps = 30  # 30 seconds duration
                    rest = base['rest'] + 15  # Extra rest for cardio
                
                # High difficulty exercises get fewer reps
                if exercise['difficulty_level'] > 7:
                    reps = max(6, reps - 2)
                
                optimized_exercise = {
                    **exercise,
                    'sets': sets,
                    'reps': reps,
                    'rest_seconds': rest,
                    'notes': self._generate_exercise_notes(exercise, user_data)
                }
                
                optimized_workout.append(optimized_exercise)
            
            return optimized_workout
            
        except Exception as e:
            logger.error(f"Error optimizing workout parameters: {e}")
            return exercises
    
    def _generate_exercise_notes(self, exercise, user_data):
        """Generate personalized notes for each exercise"""
        notes = []
        
        try:
            # Add beginner tips
            if user_data.get('fitness_level') == 'beginner':
                notes.append("Focus on proper form over speed.")
                notes.append("Start with bodyweight if using equipment is too difficult.")
            
            # Add injury prevention notes
            medical_conditions = user_data.get('medical_conditions', [])
            if 'back_pain' in medical_conditions and 'back' in exercise.get('muscle_groups', []):
                notes.append("Avoid if experiencing back pain. Consider modifications.")
            
            if 'knee_issues' in medical_conditions and 'legs' in exercise.get('muscle_groups', []):
                notes.append("Use reduced range of motion if experiencing knee discomfort.")
            
            # Add motivation
            notes.append("You've got this! Focus on your breathing.")
            
        except Exception as e:
            logger.error(f"Error generating exercise notes: {e}")
        
        return notes
    
    def _calculate_duration(self, workout):
        """Calculate estimated workout duration"""
        try:
            total_time = 0
            
            for exercise in workout:
                # Exercise time: sets * (reps * 2 seconds per rep + rest time)
                exercise_time = exercise.get('sets', 3) * (
                    exercise.get('reps', 10) * 2 + exercise.get('rest_seconds', 60)
                )
                total_time += exercise_time
            
            # Add warm-up and cool-down
            total_time += 600  # 10 minutes for warm-up and cool-down
            
            return int(total_time / 60)  # Return in minutes
            
        except Exception as e:
            logger.error(f"Error calculating duration: {e}")
            return 30  # Default 30 minutes
    
    def _assess_difficulty(self, workout, user_data):
        """Assess overall workout difficulty"""
        try:
            if not workout:
                return 1
            
            avg_difficulty = sum(ex.get('difficulty_level', 5) for ex in workout) / len(workout)
            
            # Adjust based on user fitness level
            fitness_level = user_data.get('fitness_level', 'beginner')
            if fitness_level == 'beginner':
                avg_difficulty = max(1, avg_difficulty - 2)
            elif fitness_level == 'advanced':
                avg_difficulty = min(10, avg_difficulty + 1)
            
            return int(round(avg_difficulty))
            
        except Exception as e:
            logger.error(f"Error assessing difficulty: {e}")
            return 5
    
    def _generate_adaptations(self, workout, user_data):
        """Generate workout adaptations and modifications"""
        adaptations = []
        
        try:
            fitness_level = user_data.get('fitness_level', 'beginner')
            
            if fitness_level == 'beginner':
                adaptations.append("Reduce sets by 1 if feeling too challenging.")
                adaptations.append("Take extra rest between exercises if needed.")
                adaptations.append("Focus on learning proper form before increasing intensity.")
            
            elif fitness_level == 'advanced':
                adaptations.append("Add extra set if feeling too easy.")
                adaptations.append("Increase weight or resistance for strength exercises.")
                adaptations.append("Reduce rest time to increase intensity.")
            
            # Equipment adaptations
            adaptations.append("Replace equipment exercises with bodyweight alternatives if needed.")
            adaptations.append("Use household items as weights if dumbbells unavailable.")
            
        except Exception as e:
            logger.error(f"Error generating adaptations: {e}")
        
        return adaptations
    
    def _generate_reasoning(self, workout, user_data, session_type):
        """Generate explanation for workout selection"""
        try:
            goals = user_data.get('goals', [])
            fitness_level = user_data.get('fitness_level', 'beginner')
            
            reasoning = f"This {session_type} workout was designed specifically for your {fitness_level} fitness level"
            
            if goals:
                reasoning += f" and your goals: {', '.join(goals)}"
            
            reasoning += f". The workout includes {len(workout)} exercises targeting major muscle groups"
            reasoning += " with appropriate intensity and rest periods for optimal results."
            
            return reasoning
            
        except Exception as e:
            logger.error(f"Error generating reasoning: {e}")
            return "Workout customized based on your profile and preferences."
    
    def _get_fallback_workout(self):
        """Return a safe fallback workout if generation fails"""
        return WorkoutRecommendation(
            exercises=[
                {
                    'name': 'Push-ups',
                    'sets': 3,
                    'reps': 10,
                    'rest_seconds': 60,
                    'category': 'Strength',
                    'muscle_groups': ['chest', 'triceps'],
                    'difficulty_level': 3
                },
                {
                    'name': 'Squats',
                    'sets': 3,
                    'reps': 15,
                    'rest_seconds': 60,
                    'category': 'Strength',
                    'muscle_groups': ['legs', 'glutes'],
                    'difficulty_level': 2
                }
            ],
            estimated_duration=20,
            difficulty_level=3,
            adaptations=["Modify as needed based on fitness level"],
            reasoning="Basic fallback workout for general fitness"
        )

# Initialize analyzers
pose_analyzer = PoseAnalyzer()
workout_generator = WorkoutGenerator()

# API Routes
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'ai-service'})

@app.route('/analyze/form', methods=['POST'])
def analyze_form():
    """Analyze exercise form from video frame"""
    try:
        data = request.get_json()
        
        if not data or 'frame' not in data:
            return jsonify({'error': 'Video frame data required'}), 400
        
        # Decode base64 frame data
        import base64
        frame_data = base64.b64decode(data['frame'])
        nparr = np.frombuffer(frame_data, np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        exercise_type = data.get('exercise_type', 'push-ups')
        user_id = request.headers.get('X-User-ID')
        
        # Analyze form
        result = pose_analyzer.analyze_exercise_form(frame, exercise_type, user_id)
        
        # Store analysis result
        if user_id:
            try:
                with get_db_connection() as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO form_analysis (session_id, exercise_name, form_score, 
                                                 feedback_data, corrections, rep_count)
                        VALUES (gen_random_uuid(), %s, %s, %s, %s, %s)
                    """, (
                        exercise_type,
                        result.form_score,
                        json.dumps(result.feedback),
                        json.dumps(result.corrections),
                        result.rep_count
                    ))
                    conn.commit()
            except Exception as e:
                logger.error(f"Error storing analysis result: {e}")
        
        return jsonify({
            'form_score': result.form_score,
            'feedback': result.feedback,
            'corrections': result.corrections,
            'rep_count': result.rep_count,
            'confidence': result.confidence
        })
        
    except Exception as e:
        logger.error(f"Form analysis error: {e}")
        return jsonify({'error': 'Analysis failed'}), 500

@app.route('/generate/workout', methods=['POST'])
def generate_workout():
    """Generate personalized workout plan"""
    try:
        data = request.get_json()
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        session_type = data.get('session_type', 'full_body')
        
        # Generate workout
        workout = workout_generator.generate_personalized_workout(user_id, session_type)
        
        # Store generated workout
        try:
            with get_db_connection() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO workouts (user_id, name, exercises, workout_type, 
                                        estimated_duration, difficulty_level, ai_generated)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    user_id,
                    f"AI Generated {session_type.title()} Workout",
                    json.dumps(workout.exercises),
                    session_type,
                    workout.estimated_duration,
                    workout.difficulty_level,
                    True
                ))
                workout_id = cursor.fetchone()['id']
                conn.commit()
                
                # Return workout with ID
                return jsonify({
                    'workout_id': str(workout_id),
                    'exercises': workout.exercises,
                    'estimated_duration': workout.estimated_duration,
                    'difficulty_level': workout.difficulty_level,
                    'adaptations': workout.adaptations,
                    'reasoning': workout.reasoning
                })
                
        except Exception as e:
            logger.error(f"Error storing workout: {e}")
            # Return workout without storing
            return jsonify({
                'exercises': workout.exercises,
                'estimated_duration': workout.estimated_duration,
                'difficulty_level': workout.difficulty_level,
                'adaptations': workout.adaptations,
                'reasoning': workout.reasoning
            })
        
    except Exception as e:
        logger.error(f"Workout generation error: {e}")
        return jsonify({'error': 'Workout generation failed'}), 500

@app.route('/analyze/progress', methods=['POST'])
def analyze_progress():
    """Analyze user progress and provide insights"""
    try:
        user_id = request.headers.get('X-User-ID')
        
        if not user_id:
            return jsonify({'error': 'User ID required'}), 400
        
        # Get user progress data
        progress_data = workout_generator._get_progress_metrics(user_id)
        
        if not progress_data:
            return jsonify({
                'insights': ['Not enough data for analysis. Complete more workouts to see insights.'],
                'trends': {},
                'recommendations': ['Keep working out consistently to track your progress!']
            })
        
        # Analyze trends
        insights = []
        trends = {}
        recommendations = []
        
        # Workout frequency analysis
        recent_workouts = len([p for p in progress_data[:7] if p.get('total_workouts', 0) > 0])
        if recent_workouts >= 4:
            insights.append("Great job! You're maintaining a consistent workout schedule.")
        elif recent_workouts >= 2:
            insights.append("Good progress! Try to maintain regular workout frequency.")
        else:
            insights.append("Consider increasing workout frequency for better results.")
            recommendations.append("Aim for at least 3 workouts per week.")
        
        # Strength progression
        if len(progress_data) >= 7:
            recent_strength = progress_data[0].get('metrics', {}).get('strength_metrics', {})
            old_strength = progress_data[6].get('metrics', {}).get('strength_metrics', {})
            
            if recent_strength and old_strength:
                improvements = []
                for exercise, current in recent_strength.items():
                    old_value = old_strength.get(exercise, 0)
                    if current > old_value:
                        improvements.append(exercise)
                
                if improvements:
                    insights.append(f"Strength improvements in: {', '.join(improvements)}")
                    trends['strength_improvement'] = True
        
        # Calorie burn analysis
        recent_calories = sum(p.get('total_calories_burned', 0) for p in progress_data[:7])
        if recent_calories > 0:
            trends['weekly_calories'] = recent_calories
            if recent_calories > 1500:
                insights.append("Excellent calorie burn this week!")
            elif recent_calories > 1000:
                insights.append("Good calorie burn this week.")
            else:
                recommendations.append("Try adding more cardio exercises to increase calorie burn.")
        
        return jsonify({
            'insights': insights,
            'trends': trends,
            'recommendations': recommendations
        })
        
    except Exception as e:
        logger.error(f"Progress analysis error: {e}")
        return jsonify({'error': 'Progress analysis failed'}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=os.getenv('FLASK_ENV') == 'development')
