import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import numpy as np
import pandas as pd
import joblib
import json
import requests
from dotenv import load_dotenv
import base64
import uuid
import time
from datetime import datetime, timedelta

# Load environment variables
load_dotenv()

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "https://mere-vie.vercel.app"]}})  # Enable CORS for specific origins

# Get the Gemini API key from environment variables
GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
print(f"Using Gemini API Key: {GEMINI_API_KEY[:10]}...")

# Load the preterm birth prediction model
try:
    model_path = os.path.join(os.path.dirname(__file__), 'models', 'trained_rf_model.pkl')
    preterm_model = joblib.load(model_path)
    print("Preterm birth prediction model loaded successfully")
except Exception as e:
    print(f"Error loading model: {e}")
    preterm_model = None

# Create upload directories if they don't exist
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
REPORTS_FOLDER = os.path.join(UPLOAD_FOLDER, 'reports')
PRESCRIPTIONS_FOLDER = os.path.join(UPLOAD_FOLDER, 'prescriptions')

os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(REPORTS_FOLDER, exist_ok=True)
os.makedirs(PRESCRIPTIONS_FOLDER, exist_ok=True)

# Sample data for development and testing
sample_health_data = {
    'heart_rate': [78, 82, 75, 80, 84, 79, 77, 81, 83, 76],
    'blood_sugar': [95, 98, 92, 96, 99, 94, 93, 97, 100, 91],
    'blood_oxygen': [98, 97, 99, 98, 96, 97, 99, 98, 97, 98],
    'timestamps': [(datetime.now() - timedelta(days=i)).strftime('%Y-%m-%d %H:%M:%S') for i in range(10, 0, -1)]
}

# Sample hospital data
sample_hospitals = [
    {
        "id": 1,
        "name": "City Maternity Hospital",
        "address": "123 Main St, Anytown",
        "phone": "555-123-4567",
        "specialties": ["Obstetrics", "Gynecology", "Neonatal Care"],
        "coordinates": {"lat": 40.7128, "lng": -74.0060}
    },
    {
        "id": 2,
        "name": "Mother & Child Care Center",
        "address": "456 Park Ave, Anytown",
        "phone": "555-987-6543",
        "specialties": ["High-Risk Pregnancy", "Fetal Medicine", "Postnatal Care"],
        "coordinates": {"lat": 40.7228, "lng": -74.0160}
    },
    {
        "id": 3,
        "name": "Women's Health Clinic",
        "address": "789 Broadway, Anytown",
        "phone": "555-567-8901",
        "specialties": ["Prenatal Care", "Labor & Delivery", "Breastfeeding Support"],
        "coordinates": {"lat": 40.7328, "lng": -74.0260}
    }
]

# Routes
@app.route('/')
def home():
    return jsonify({
        "status": "success",
        "message": "Maternal Health API is running",
        "endpoints": [
            "/api/chatbot",
            "/api/predict/preterm",
            "/api/health/data",
            "/api/hospitals/nearby",
            "/api/upload/report",
            "/api/upload/prescription"
        ]
    })

@app.route('/api/chatbot', methods=['POST'])
def chatbot():
    data = request.json
    if not data or 'message' not in data:
        return jsonify({"error": "No message provided"}), 400
    
    user_message = data['message']
    
    if GEMINI_API_KEY is None:
        return jsonify({
            "response": "Chatbot is currently unavailable. Please try again later.",
            "error": "Gemini API key not configured"
        }), 503
    
    try:
        # Provide pregnancy-specific context to the model
        prompt = f"""
        You are an AI maternity healthcare assistant. You provide helpful, accurate, and compassionate advice to pregnant women.
        Always prioritize suggesting consulting healthcare providers for medical concerns.
        
        User Query: {user_message}
        """
        
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        headers = {
            "Content-Type": "application/json",
        }
        
        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": prompt
                        }
                    ]
                }
            ],
            "generationConfig": {
                "temperature": 0.7,
                "topK": 40,
                "topP": 0.95,
                "maxOutputTokens": 1024,
            }
        }
        
        response = requests.post(f"{url}?key={GEMINI_API_KEY}", headers=headers, json=payload)
        
        if response.status_code == 200:
            response_data = response.json()
            if 'candidates' in response_data and len(response_data['candidates']) > 0:
                if 'content' in response_data['candidates'][0] and 'parts' in response_data['candidates'][0]['content']:
                    ai_response = response_data['candidates'][0]['content']['parts'][0]['text']
                    return jsonify({"response": ai_response})
            
            return jsonify({"response": "I received your message but couldn't generate a proper response. Please try again."})
        else:
            print(f"Error from Gemini API: Status {response.status_code}, Response: {response.text}")
            return jsonify({"response": "I'm having trouble processing your request right now. Please try again later.", 
                           "error": f"API Error: {response.status_code}"}), 500
    
    except Exception as e:
        print(f"Error with Gemini API: {e}")
        return jsonify({"response": "I'm having trouble processing your request right now. Please try again later.", "error": str(e)}), 500

@app.route('/api/predict/preterm', methods=['POST'])
def predict_preterm():
    data = request.json
    
    if preterm_model is None:
        return jsonify({
            "prediction": "Prediction service is currently unavailable.",
            "error": "Model not loaded"
        }), 503
    
    try:
        # Extract features from request
        features = np.array([
            data.get('maternal_age', 30),
            data.get('bmi', 24),
            data.get('blood_pressure_systolic', 120),
            data.get('blood_pressure_diastolic', 80),
            data.get('glucose_level', 85),
            data.get('previous_preterm_births', 0),
            data.get('history_medical_conditions', 0)
        ]).reshape(1, -1)
        
        # Make prediction
        prediction = preterm_model.predict_proba(features)[0][1]  # Probability of preterm birth
        risk_level = "Low" if prediction < 0.3 else "Medium" if prediction < 0.6 else "High"
        
        # Recommendations based on risk level
        recommendations = []
        if risk_level == "Low":
            recommendations = [
                "Continue regular prenatal check-ups",
                "Maintain a healthy diet and exercise routine",
                "Stay hydrated and get plenty of rest"
            ]
        elif risk_level == "Medium":
            recommendations = [
                "Increase frequency of prenatal visits",
                "Consider additional monitoring",
                "Reduce strenuous physical activity",
                "Ensure adequate rest and hydration"
            ]
        else:  # High risk
            recommendations = [
                "Consult with your healthcare provider immediately",
                "You may need specialized care and monitoring",
                "Discuss possible interventions with your doctor",
                "Rest and avoid unnecessary physical strain"
            ]
        
        return jsonify({
            "prediction": float(prediction),
            "risk_level": risk_level,
            "recommendations": recommendations
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/health/data', methods=['GET', 'POST'])
def health_data():
    if request.method == 'GET':
        # For demonstration, return sample data
        return jsonify(sample_health_data)
    
    elif request.method == 'POST':
        data = request.json
        
        # In a real app, you would save this to a database
        # For now, we'll just return the data with an added timestamp
        data['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Check for critical values and add alerts
        alerts = []
        if 'heart_rate' in data:
            hr = int(data['heart_rate'])
            if hr > 100 or hr < 60:
                alerts.append(f"Heart rate ({hr} bpm) is outside normal range (60-100 bpm)")
        
        if 'blood_sugar' in data:
            bs = int(data['blood_sugar'])
            if bs > 140 or bs < 70:
                alerts.append(f"Blood sugar level ({bs} mg/dL) is outside normal range (70-140 mg/dL)")
        
        if 'blood_oxygen' in data:
            bo = int(data['blood_oxygen'])
            if bo < 95:
                alerts.append(f"Blood oxygen level ({bo}%) is below normal (95-100%)")
        
        data['alerts'] = alerts
        
        return jsonify({
            "status": "success",
            "data": data
        })

@app.route('/api/hospitals/nearby', methods=['GET'])
def nearby_hospitals():
    # In a real app, you would query based on user's location
    # For now, return sample data
    return jsonify(sample_hospitals)

@app.route('/api/upload/<file_type>', methods=['POST'])
def upload_file(file_type):
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400
    
    if file:
        # Generate a unique filename
        filename = str(uuid.uuid4()) + '_' + file.filename
        
        # Determine the correct folder based on file type
        if file_type == 'report':
            save_path = os.path.join(REPORTS_FOLDER, filename)
        elif file_type == 'prescription':
            save_path = os.path.join(PRESCRIPTIONS_FOLDER, filename)
        else:
            return jsonify({"error": "Invalid file type"}), 400
        
        # Save the file
        file.save(save_path)
        
        return jsonify({
            "status": "success",
            "filename": filename,
            "message": f"{file_type.capitalize()} uploaded successfully"
        })

@app.route('/api/fetal-development/<int:week>', methods=['GET'])
def fetal_development(week):
    if week < 1 or week > 42:
        return jsonify({"error": "Invalid week. Must be between 1 and 42."}), 400
    
    # Sample fetal development data
    development_data = {
        "week": week,
        "size": f"{(week * 0.5) if week <= 12 else (week - 6)} inches",
        "weight": f"{max(0.04, (week - 10) * 0.25):.2f} pounds" if week > 10 else "Less than 0.04 pounds",
        "description": f"At week {week}, your baby's development is progressing well.",
        "milestones": []
    }
    
    # Add specific milestones based on weeks
    if week <= 4:
        development_data["milestones"] = ["Implantation occurs", "Cell layers forming"]
    elif week <= 8:
        development_data["milestones"] = ["Heart begins to beat", "Brain and spinal cord forming", "Facial features developing"]
    elif week <= 12:
        development_data["milestones"] = ["All essential organs formed", "Fingers and toes formed", "Can make a fist"]
    elif week <= 16:
        development_data["milestones"] = ["Can move arms and legs", "Facial expressions developing", "Can hear sounds"]
    elif week <= 20:
        development_data["milestones"] = ["Can hear your voice", "Hair growing", "Sleep-wake cycles beginning"]
    elif week <= 24:
        development_data["milestones"] = ["Fingerprints formed", "Lungs developing", "Responds to sounds"]
    elif week <= 28:
        development_data["milestones"] = ["Eyes opening", "Brain developing rapidly", "Can hiccup"]
    elif week <= 32:
        development_data["milestones"] = ["Can see light", "Practicing breathing movements", "Coordinated sucking and swallowing"]
    elif week <= 36:
        development_data["milestones"] = ["Gaining weight rapidly", "Preparing for birth", "Most organs fully developed"]
    else:
        development_data["milestones"] = ["Fully developed", "Ready for birth", "Continues to gain weight"]
    
    return jsonify(development_data)

@app.route('/api/journal', methods=['GET', 'POST'])
def journal():
    if request.method == 'POST':
        data = request.json
        # In a real app, save to database and associate with user
        data['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        return jsonify({"status": "success", "entry": data})
    
    # For GET, in a real app fetch from database
    # For demo, return sample entries
    sample_entries = [
        {
            "id": 1,
            "date": (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'),
            "mood": "Happy",
            "symptoms": ["Mild nausea", "Fatigue"],
            "notes": "Felt the baby kick for the first time today!",
            "timestamp": (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d %H:%M:%S')
        },
        {
            "id": 2,
            "date": (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'),
            "mood": "Tired",
            "symptoms": ["Back pain", "Heartburn"],
            "notes": "Had trouble sleeping due to back pain.",
            "timestamp": (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d %H:%M:%S')
        }
    ]
    return jsonify(sample_entries)

@app.route('/api/kick-counter', methods=['GET', 'POST'])
def kick_counter():
    if request.method == 'POST':
        data = request.json
        # In a real app, save to database with user ID
        data['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        return jsonify({"status": "success", "data": data})
    
    # For GET, return sample data
    sample_data = {
        "today": {
            "count": 15,
            "timestamps": [
                (datetime.now() - timedelta(hours=1, minutes=30)).strftime('%H:%M:%S'),
                (datetime.now() - timedelta(hours=1)).strftime('%H:%M:%S'),
                (datetime.now() - timedelta(minutes=45)).strftime('%H:%M:%S')
            ]
        },
        "history": [
            {"date": (datetime.now() - timedelta(days=1)).strftime('%Y-%m-%d'), "count": 12},
            {"date": (datetime.now() - timedelta(days=2)).strftime('%Y-%m-%d'), "count": 18},
            {"date": (datetime.now() - timedelta(days=3)).strftime('%Y-%m-%d'), "count": 10}
        ]
    }
    return jsonify(sample_data)

@app.route('/api/contraction-timer', methods=['GET', 'POST'])
def contraction_timer():
    if request.method == 'POST':
        data = request.json
        # In a real app, save to database with user ID
        data['timestamp'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        return jsonify({"status": "success", "data": data})
    
    # For GET, return sample data
    sample_data = {
        "contractions": [
            {
                "start": (datetime.now() - timedelta(minutes=45)).strftime('%H:%M:%S'),
                "end": (datetime.now() - timedelta(minutes=44)).strftime('%H:%M:%S'),
                "duration": 60,  # seconds
                "intensity": "Mild"
            },
            {
                "start": (datetime.now() - timedelta(minutes=35)).strftime('%H:%M:%S'),
                "end": (datetime.now() - timedelta(minutes=34)).strftime('%H:%M:%S'),
                "duration": 65,  # seconds
                "intensity": "Moderate"
            },
            {
                "start": (datetime.now() - timedelta(minutes=25)).strftime('%H:%M:%S'),
                "end": (datetime.now() - timedelta(minutes=23, seconds=30)).strftime('%H:%M:%S'),
                "duration": 90,  # seconds
                "intensity": "Moderate"
            }
        ],
        "summary": {
            "average_duration": 71.67,  # seconds
            "average_interval": 10,  # minutes
            "status": "Early labor"
        }
    }
    return jsonify(sample_data)

@app.route('/api/medication-reminders', methods=['GET', 'POST', 'DELETE'])
def medication_reminders():
    if request.method == 'POST':
        data = request.json
        # In a real app, save to database with user ID and set up actual reminders
        data['id'] = str(uuid.uuid4())
        return jsonify({"status": "success", "reminder": data})
    
    elif request.method == 'DELETE':
        # In a real app, delete from database
        reminder_id = request.args.get('id')
        if not reminder_id:
            return jsonify({"error": "No reminder ID provided"}), 400
        
        return jsonify({"status": "success", "message": f"Reminder {reminder_id} deleted"})
    
    # For GET, return sample reminders
    sample_reminders = [
        {
            "id": "1",
            "name": "Prenatal Vitamin",
            "time": "08:00:00",
            "days": ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            "notes": "Take with food"
        },
        {
            "id": "2",
            "name": "Iron Supplement",
            "time": "12:00:00",
            "days": ["Monday", "Wednesday", "Friday"],
            "notes": "Take 2 hours after meals"
        },
        {
            "id": "3",
            "name": "Doctor's Appointment",
            "time": "10:00:00",
            "date": (datetime.now() + timedelta(days=7)).strftime('%Y-%m-%d'),
            "notes": "Monthly checkup"
        }
    ]
    return jsonify(sample_reminders)

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
