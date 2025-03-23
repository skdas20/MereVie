from flask import Flask, request, jsonify
import pickle
import numpy as np
import os
import sys
from pathlib import Path

# Add the parent directory to the path to import from models
sys.path.append(str(Path(__file__).parent.parent))

app = Flask(__name__)

# CORS setup
@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE')
    return response

# Load the trained model
model_path = Path(__file__).parent.parent / 'models' / 'trained_models' / 'pregnancy_risk_model.pkl'
risk_logic_path = Path(__file__).parent.parent / 'models' / 'trained_models' / 'risk_calculation_logic.pkl'

try:
    with open(model_path, 'rb') as f:
        model = pickle.load(f)
    
    with open(risk_logic_path, 'rb') as f:
        risk_logic = pickle.load(f)
    
    print(f"Loaded pregnancy risk model from {model_path}")
except Exception as e:
    print(f"Error loading model: {e}")
    model = None
    risk_logic = None

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify API is running"""
    return jsonify({"status": "healthy", "model_loaded": model is not None})

@app.route('/api/predict-risk', methods=['POST'])
def predict_risk():
    """Endpoint to predict pregnancy risk based on health metrics"""
    if model is None:
        return jsonify({"error": "Model not loaded"}), 500
    
    try:
        # Get data from request
        data = request.json
        
        # Required fields
        required_fields = ['age', 'weight', 'height', 'systolic_bp', 'diastolic_bp', 
                          'glucose', 'heart_rate', 'previous_pregnancies', 
                          'has_diabetes', 'has_hypertension']
        
        # Validate input
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Calculate BMI
        height_m = float(data['height']) / 100  # Convert cm to m
        weight_kg = float(data['weight'])
        bmi = weight_kg / (height_m ** 2)
        
        # Prepare features for prediction
        features = [
            float(data['age']),
            float(data['weight']),
            float(data['height']),
            float(data['systolic_bp']),
            float(data['diastolic_bp']),
            float(data['glucose']),
            float(data['heart_rate']),
            float(bmi),
            float(data['previous_pregnancies']),
            float(data['has_diabetes']),
            float(data['has_hypertension'])
        ]
        
        # Make prediction
        features_array = np.array([features])
        risk_probability = model.predict_proba(features_array)[0, 1]
        is_high_risk = model.predict(features_array)[0]
        
        # Calculate risk percentage using risk logic
        risk_score = 0
        
        # Age risk
        if float(data['age']) < risk_logic['thresholds']['age_young'] or float(data['age']) > risk_logic['thresholds']['age_old']:
            risk_score += risk_logic['weights']['age_risk']
        
        # BMI risk
        if bmi < risk_logic['thresholds']['bmi_low'] or bmi > risk_logic['thresholds']['bmi_high']:
            risk_score += risk_logic['weights']['bmi_risk']
        
        # Blood pressure risk
        if float(data['systolic_bp']) > risk_logic['thresholds']['systolic_bp_high'] or float(data['diastolic_bp']) > risk_logic['thresholds']['diastolic_bp_high']:
            risk_score += risk_logic['weights']['bp_risk']
        
        # Glucose risk
        if float(data['glucose']) > risk_logic['thresholds']['glucose_high']:
            risk_score += risk_logic['weights']['glucose_risk']
        
        # Heart rate risk
        if float(data['heart_rate']) < risk_logic['thresholds']['heart_rate_low'] or float(data['heart_rate']) > risk_logic['thresholds']['heart_rate_high']:
            risk_score += risk_logic['weights']['heart_rate_risk']
        
        # Medical history risks
        if int(data['has_diabetes']) == 1:
            risk_score += risk_logic['weights']['diabetes_risk']
        
        if int(data['has_hypertension']) == 1:
            risk_score += risk_logic['weights']['hypertension_risk']
        
        # Pregnancy history risk
        if float(data['previous_pregnancies']) > risk_logic['thresholds']['high_previous_pregnancies']:
            risk_score += risk_logic['weights']['pregnancy_history_risk']
        
        # Cap risk percentage at 100%
        risk_percentage = min(risk_score, 100)
        
        # Get feature importance
        feature_importance = dict(zip(risk_logic['features'], model.feature_importances_))
        
        # Return prediction results
        return jsonify({
            "is_high_risk": bool(is_high_risk),
            "risk_probability": float(risk_probability),
            "risk_percentage": float(risk_percentage),
            "risk_factors": {
                "age": float(data['age']),
                "bmi": float(bmi),
                "blood_pressure": f"{data['systolic_bp']}/{data['diastolic_bp']}",
                "glucose": float(data['glucose']),
                "heart_rate": float(data['heart_rate']),
                "medical_history": {
                    "diabetes": bool(int(data['has_diabetes'])),
                    "hypertension": bool(int(data['has_hypertension'])),
                    "previous_pregnancies": int(data['previous_pregnancies'])
                }
            },
            "feature_importance": feature_importance
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
