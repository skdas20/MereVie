import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
import pickle
import os
import matplotlib.pyplot as plt
import seaborn as sns
from sklearn.metrics import roc_curve, auc

def train_model():
    # Set random seed for reproducibility
    np.random.seed(42)

    # Create a directory for the trained model if it doesn't exist
    os.makedirs('trained_models', exist_ok=True)

    # Number of samples for synthetic data
    n_samples = 2000

    # Generate synthetic features with realistic distributions
    data = {
        'age': np.random.normal(30, 6, n_samples).clip(18, 45).astype(int),  # Age between 18-45
        'weight': np.random.normal(65, 12, n_samples).clip(45, 120).astype(int),  # Weight in kg
        'height': np.random.normal(165, 8, n_samples).clip(145, 190).astype(int),  # Height in cm
        'systolic_bp': np.random.normal(120, 15, n_samples).clip(90, 180).astype(int),  # Systolic BP
        'diastolic_bp': np.random.normal(80, 10, n_samples).clip(50, 110).astype(int),  # Diastolic BP
        'glucose': np.random.normal(100, 25, n_samples).clip(70, 200).astype(int),  # Glucose in mg/dL
        'heart_rate': np.random.normal(85, 12, n_samples).clip(60, 130).astype(int),  # Heart rate (BPM)
        'previous_pregnancies': np.random.choice([0, 1, 2, 3, 4, 5], n_samples, p=[0.3, 0.3, 0.2, 0.1, 0.05, 0.05]),
        'has_diabetes': np.random.choice([0, 1], n_samples, p=[0.85, 0.15]),
        'has_hypertension': np.random.choice([0, 1], n_samples, p=[0.8, 0.2]),
    }

    # Create a DataFrame
    df = pd.DataFrame(data)

    # Calculate BMI (Body Mass Index)
    df['bmi'] = df['weight'] / ((df['height'] / 100) ** 2)

    # Create risk factors based on medical guidelines
    risk_factors = {
        'age_risk': ((df['age'] < 20) | (df['age'] > 35)).astype(int) * 15,
        'bmi_risk': ((df['bmi'] < 18.5) | (df['bmi'] > 30)).astype(int) * 15,
        'bp_risk': ((df['systolic_bp'] > 140) | (df['diastolic_bp'] > 90)).astype(int) * 20,
        'glucose_risk': (df['glucose'] > 140).astype(int) * 20,
        'heart_rate_risk': ((df['heart_rate'] < 60) | (df['heart_rate'] > 100)).astype(int) * 10,
        'medical_history_risk': (df['has_diabetes'] * 15 + df['has_hypertension'] * 15),
        'pregnancy_history_risk': (df['previous_pregnancies'] > 3).astype(int) * 10
    }

    # Add risk factors to the dataframe
    for factor, values in risk_factors.items():
        df[factor] = values

    # Calculate total risk score
    df['risk_score'] = sum(risk_factors.values())

    # Convert to risk percentage (capped at 100%)
    df['risk_percentage'] = (df['risk_score'] / 100 * 100).clip(0, 100)

    # Create binary risk target (high risk if percentage >= 40%)
    df['high_risk'] = (df['risk_percentage'] >= 40).astype(int)

    # Print data summary
    print("Data Summary:")
    print(f"Total samples: {n_samples}")
    print(f"High risk pregnancies: {df['high_risk'].sum()} ({df['high_risk'].mean()*100:.1f}%)")
    print("\nFeature distributions:")
    print(df.describe().round(2))

    # Prepare features and target for model training
    features = ['age', 'weight', 'height', 'systolic_bp', 'diastolic_bp', 
                'glucose', 'heart_rate', 'bmi', 'previous_pregnancies', 
                'has_diabetes', 'has_hypertension']

    X = df[features]
    y = df['high_risk']

    # Split data into training and testing sets
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    # Train Random Forest model
    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=10,
        min_samples_split=5,
        min_samples_leaf=2,
        random_state=42,
        class_weight='balanced'
    )

    model.fit(X_train, y_train)

    # Evaluate model
    y_pred = model.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    conf_matrix = confusion_matrix(y_test, y_pred)

    print("\nModel Evaluation:")
    print(f"Accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred))

    print("\nConfusion Matrix:")
    print(conf_matrix)

    # Feature importance
    feature_importance = pd.DataFrame({
        'Feature': features,
        'Importance': model.feature_importances_
    }).sort_values('Importance', ascending=False)

    print("\nFeature Importance:")
    print(feature_importance)

    # Save the trained model
    model_path = os.path.join('trained_models', 'pregnancy_risk_model.pkl')
    with open(model_path, 'wb') as f:
        pickle.dump(model, f)

    # Save feature importance for reference
    feature_importance.to_csv(os.path.join('trained_models', 'feature_importance.csv'), index=False)

    # Save the risk calculation logic
    risk_logic = {
        'features': features,
        'thresholds': {
            'age_young': 20,
            'age_old': 35,
            'bmi_low': 18.5,
            'bmi_high': 30,
            'systolic_bp_high': 140,
            'diastolic_bp_high': 90,
            'glucose_high': 140,
            'heart_rate_low': 60,
            'heart_rate_high': 100,
            'high_previous_pregnancies': 3
        },
        'weights': {
            'age_risk': 15,
            'bmi_risk': 15,
            'bp_risk': 20,
            'glucose_risk': 20,
            'heart_rate_risk': 10,
            'diabetes_risk': 15,
            'hypertension_risk': 15,
            'pregnancy_history_risk': 10
        }
    }

    with open(os.path.join('trained_models', 'risk_calculation_logic.pkl'), 'wb') as f:
        pickle.dump(risk_logic, f)

    # Create visualizations
    plt.figure(figsize=(12, 10))

    # Plot feature importance
    plt.subplot(2, 2, 1)
    sns.barplot(x='Importance', y='Feature', data=feature_importance)
    plt.title('Feature Importance')
    plt.tight_layout()

    # Plot risk distribution
    plt.subplot(2, 2, 2)
    sns.histplot(df['risk_percentage'], bins=20)
    plt.title('Risk Percentage Distribution')
    plt.xlabel('Risk Percentage')
    plt.ylabel('Count')

    # Plot confusion matrix
    plt.subplot(2, 2, 3)
    sns.heatmap(conf_matrix, annot=True, fmt='d', cmap='Blues', 
                xticklabels=['Low Risk', 'High Risk'], 
                yticklabels=['Low Risk', 'High Risk'])
    plt.title('Confusion Matrix')
    plt.xlabel('Predicted')
    plt.ylabel('Actual')

    # Plot ROC curve
    y_proba = model.predict_proba(X_test)[:, 1]
    fpr, tpr, _ = roc_curve(y_test, y_proba)
    roc_auc = auc(fpr, tpr)

    plt.subplot(2, 2, 4)
    plt.plot(fpr, tpr, label=f'ROC curve (AUC = {roc_auc:.3f})')
    plt.plot([0, 1], [0, 1], 'k--')
    plt.xlabel('False Positive Rate')
    plt.ylabel('True Positive Rate')
    plt.title('ROC Curve')
    plt.legend(loc='lower right')

    plt.tight_layout()
    plt.savefig(os.path.join('trained_models', 'model_evaluation.png'))

    print(f"\nModel and visualizations saved to 'trained_models' directory")
    print(f"Model file: {model_path}")
    print("To use this model in your application, load it with pickle.load()")
    
    return model, risk_logic

if __name__ == "__main__":
    train_model()
