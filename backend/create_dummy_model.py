import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
import joblib
import os

# Create a synthetic dataset for preterm birth prediction
np.random.seed(42)

# Number of samples
n_samples = 1000

# Create features
maternal_age = np.random.normal(30, 5, n_samples)  # Maternal age
bmi = np.random.normal(24, 4, n_samples)  # BMI
blood_pressure_systolic = np.random.normal(120, 10, n_samples)  # Systolic BP
blood_pressure_diastolic = np.random.normal(80, 8, n_samples)  # Diastolic BP
glucose_level = np.random.normal(85, 10, n_samples)  # Glucose level
previous_preterm_births = np.random.binomial(2, 0.1, n_samples)  # Previous preterm births
history_medical_conditions = np.random.binomial(1, 0.2, n_samples)  # History of medical conditions

# Combine features into a DataFrame
X = pd.DataFrame({
    'maternal_age': maternal_age,
    'bmi': bmi,
    'blood_pressure_systolic': blood_pressure_systolic,
    'blood_pressure_diastolic': blood_pressure_diastolic,
    'glucose_level': glucose_level,
    'previous_preterm_births': previous_preterm_births,
    'history_medical_conditions': history_medical_conditions
})

# Create target variable (preterm birth: 0=No, 1=Yes)
# Higher risk with higher age, previous preterm births, and existing medical conditions
risk_score = (
    0.01 * (maternal_age - 30) +
    0.02 * (bmi - 24) +
    0.005 * (blood_pressure_systolic - 120) +
    0.005 * (blood_pressure_diastolic - 80) +
    0.01 * (glucose_level - 85) +
    0.2 * previous_preterm_births +
    0.15 * history_medical_conditions
)

# Convert risk score to probability
probability = 1 / (1 + np.exp(-risk_score))  # Sigmoid function
y = np.random.binomial(1, probability)  # Generate 0 or 1 based on probability

# Split data into training and test sets
X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

# Train a Random Forest model
rf = RandomForestClassifier(n_estimators=100, random_state=42)
rf.fit(X_train, y_train)

# Evaluate the model
train_accuracy = rf.score(X_train, y_train)
test_accuracy = rf.score(X_test, y_test)

print(f"Training accuracy: {train_accuracy:.4f}")
print(f"Test accuracy: {test_accuracy:.4f}")

# Save the model
model_path = os.path.join('models', 'trained_rf_model.pkl')
joblib.dump(rf, model_path)
print(f"Model saved to {model_path}")
