import joblib
import pandas as pd
from pathlib import Path
import warnings
warnings.filterwarnings("ignore")

# Load assets
MODELS_DIR = Path("c:/Users/suhar/OneDrive/Desktop/hackothon/backend/models")
stroke_path = MODELS_DIR / "stroke"
preprocessor = joblib.load(stroke_path / 'preprocessor.pkl')
model = joblib.load(stroke_path / 'best_stroke_model.pkl')

data = {'gender': 'Male', 'age': 55, 'hypertension': 'Yes', 'heart_disease': 'No', 'ever_married': 'Yes', 'work_type': 'Private', 'residence_type': 'Urban', 'avg_glucose_level': 140, 'bmi': 28, 'smoking_status': 'formerly smoked'}

input_raw = pd.DataFrame([{
    "id": 0,
    "gender": data.get('gender', 'Male'),
    "age": data.get('age', 50),
    "hypertension": 1 if data.get('hypertension', 'No') == 'Yes' else 0,
    "heart_disease": 1 if data.get('heart_disease', 'No') == 'Yes' else 0,
    "ever_married": data.get('ever_married', 'No'),
    "work_type": data.get('work_type', 'Private'),
    "Residence_type": data.get('residence_type', 'Urban'),
    "avg_glucose_level": data.get('avg_glucose_level', 100),
    "bmi": data.get('bmi', 25),
    "smoking_status": data.get('smoking_status', 'never smoked')
}])

for col in preprocessor.feature_names_in_:
    if col not in input_raw.columns:
        input_raw[col] = 0
input_raw = input_raw[list(preprocessor.feature_names_in_)]

if not hasattr(preprocessor, '_name_to_fitted_passthrough'):
    preprocessor._name_to_fitted_passthrough = {}
try:
    input_processed = preprocessor.transform(input_raw)
    prob = model.predict_proba(input_processed)[0][1]
    print(f"SUCCESS! Probability: {prob}")
except Exception as e:
    import traceback
    traceback.print_exc()

