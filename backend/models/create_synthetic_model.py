import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle
import os

# Create synthetic data for pregnancy risk prediction
np.random.seed(42)

# Number of samples
n_samples = 1000

# Generate synthetic features
data = {
    'age': np.random.normal(30, 5, n_samples).astype(int),  # Age between ~20-40
    'systolic_bp': np.random.normal(120, 15, n_samples).astype(int),  # Systolic BP
    'diastolic_bp': np.random.normal(80, 10, n_samples).astype(int),  # Diastolic BP
    'blood_sugar': np.random.normal(5.5, 1.5, n_samples),  # Blood sugar (mmol/L)
    'body_temp': np.random.normal(37, 0.5, n_samples),  # Body temperature (°C)
    'heart_rate': np.random.normal(85, 10, n_samples).astype(int),  # Heart rate (BPM)
}

# Create a DataFrame
df = pd.DataFrame(data)

# Create target variable (risk) based on medical rules
# Higher risk if:
# - Age > 35
# - Systolic BP > 140 or Diastolic BP > 90 (hypertension)
# - Blood sugar > 7.0 (gestational diabetes)
# - Body temp > 37.5 (potential infection)
# - Heart rate > 100 (tachycardia)

# Calculate risk scores
risk_scores = (
    (df['age'] > 35).astype(int) * 1 +
    ((df['systolic_bp'] > 140) | (df['diastolic_bp'] > 90)).astype(int) * 2 +
    (df['blood_sugar'] > 7.0).astype(int) * 2 +
    (df['body_temp'] > 37.5).astype(int) * 1 +
    (df['heart_rate'] > 100).astype(int) * 1
)

# Convert risk scores to binary target (0 = low risk, 1 = high risk)
df['risk'] = (risk_scores >= 3).astype(int)

# Calculate risk percentage (for demonstration)
df['risk_percentage'] = (risk_scores / 7 * 100).clip(0, 100)

# Train a Random Forest model
X = df.drop(['risk', 'risk_percentage'], axis=1)
y = df['risk']

# Train the model
model = RandomForestClassifier(n_estimators=100, max_depth=5, random_state=42)
model.fit(X, y)

# Save the model
with open('trained_rf_model.pkl', 'wb') as f:
    pickle.dump(model, f)

# Save the risk percentage calculation logic
with open('risk_percentage_model.pkl', 'wb') as f:
    pickle.dump({'feature_weights': {
        'age': 1/7,
        'systolic_bp': 1/7,
        'diastolic_bp': 1/7,
        'blood_sugar': 2/7,
        'body_temp': 1/7,
        'heart_rate': 1/7
    }, 'thresholds': {
        'age': 35,
        'systolic_bp': 140,
        'diastolic_bp': 90,
        'blood_sugar': 7.0,
        'body_temp': 37.5,
        'heart_rate': 100
    }}, f)

print("Models created successfully!")
print(f"Model accuracy on training data: {model.score(X, y):.2f}")
print(f"Feature importances: {dict(zip(X.columns, model.feature_importances_))}")
