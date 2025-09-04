# FitAI Pro ML Models

This directory contains the machine learning models used by the AI service for exercise form analysis and workout recommendations.

## Models

### 1. Pose Estimation Models
- **MediaPipe Pose**: Used for real-time pose detection and joint tracking
- **Custom Form Analysis**: Fine-tuned models for specific exercise form evaluation

### 2. Exercise Classification Models
- **Exercise Recognition**: Classifies different types of exercises from pose data
- **Rep Counter**: Counts repetitions for various exercises

### 3. Recommendation Models
- **Workout Recommender**: Suggests workouts based on user preferences and history
- **Progressive Overload**: Calculates optimal weight/rep progressions

## Model Files

Due to their large size, model files are not included in the repository. They should be downloaded separately and placed in this directory:

```
ml-models/
├── pose/
│   ├── pose_landmarker.task
│   └── pose_classification.tflite
├── exercise/
│   ├── exercise_classifier.h5
│   └── rep_counter.pkl
├── recommendation/
│   ├── workout_recommender.pkl
│   └── progression_model.joblib
└── preprocessing/
    ├── scaler.pkl
    └── feature_extractor.pkl
```

## Usage

Models are automatically loaded by the AI service when it starts. See `backend/ai-service/app.py` for implementation details.

## Training

Training scripts and datasets are maintained in a separate repository for security and size considerations.
