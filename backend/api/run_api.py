import os
import sys
from pathlib import Path
from pregnancy_risk_api import app

if __name__ == '__main__':
    # Create trained_models directory if it doesn't exist
    models_dir = Path(__file__).parent.parent / 'models' / 'trained_models'
    os.makedirs(models_dir, exist_ok=True)
    
    # Check if model exists, if not, run the training script
    model_path = models_dir / 'pregnancy_risk_model.pkl'
    if not model_path.exists():
        print("Model not found. Running training script...")
        sys.path.append(str(Path(__file__).parent.parent))
        from models.train_pregnancy_risk_model import train_model
        train_model()
    
    # Run the Flask API
    port = int(os.environ.get('PORT', 5000))
    print(f"Starting MèreVie Pregnancy Risk API on port {port}")
    app.run(host='0.0.0.0', port=port, debug=True)
