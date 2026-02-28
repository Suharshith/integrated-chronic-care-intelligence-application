import sys
import traceback
import pprint
from prediction_engine import engine

data = {'gender': 'Male', 'age': 55, 'hypertension': 'Yes', 'heart_disease': 'No', 'ever_married': 'Yes', 'work_type': 'Private', 'residence_type': 'Urban', 'avg_glucose_level': 140, 'bmi': 28, 'smoking_status': 'formerly smoked'}

try:
    res = engine.predict_stroke(data)
    pprint.pprint(res)
except Exception:
    traceback.print_exc()
