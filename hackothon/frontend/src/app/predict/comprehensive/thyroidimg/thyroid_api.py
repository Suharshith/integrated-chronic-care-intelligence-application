from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import io
from PIL import Image
import numpy as np

# Import existing modular logic from your project
from src.loader import load_class_names, load_features
from src.predict import single_prediction, image_prediction

app = FastAPI(title="ThyroidAI API", description="Backend for Thyroid Prediction (Clinical & Image)")

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this to your Next.js URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load metadata once
class_names = load_class_names()
feature_names = load_features()

class ClinicalData(BaseModel):
    age: int
    sex: str  # "Female" or "Male"
    TSH: float
    T3: float
    TT4: float
    sick: bool
    # Add other fields as needed based on your model requirements

@app.get("/")
def read_root():
    return {"message": "ThyroidAI API is running. Visit /docs for Swagger UI."}

@app.post("/predict/text")
async def predict_text(data: ClinicalData):
    """Predict thyroid condition from clinical text/data."""
    try:
        # Map simple inputs to the 21+ features required by the model
        # Fill missing features with defaults as the user wants "just predict"
        input_dict = {
            "age": data.age, "sex": 0 if data.sex == "Female" else 1,
            "TSH": data.TSH, "T3": data.T3, "TT4": data.TT4, "sick": 1 if data.sick else 0,
            "on_thyroxine": 0, "query_on_thyroxine": 0, "on_antithyroid_meds": 0,
            "pregnant": 0, "thyroid_surgery": 0, "I131_treatment": 0,
            "query_hypothyroid": 0, "query_hyperthyroid": 0, "lithium": 0,
            "goitre": 0, "tumor": 0, "psych": 0, "T4U": 1.0, "FTI": 110.0, "TBG": 20.0
        }
        
        idx, conf, _ = single_prediction(input_dict, feature_names)
        return {
            "prediction": class_names[idx],
            "confidence": float(conf),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict/image")
async def predict_image(file: UploadFile = File(...)):
    """Predict thyroid condition from ultrasound image scanning."""
    try:
        if not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="File must be an image.")
            
        contents = await file.read()
        img = Image.open(io.BytesIO(contents)).convert("RGB")
        
        idx, conf, _ = image_prediction(img)
        
        return {
            "prediction": class_names[idx],
            "confidence": float(conf),
            "status": "success"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
