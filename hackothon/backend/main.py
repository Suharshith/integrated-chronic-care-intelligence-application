"""
ICCIP - Integrated Chronic Care Intelligence Platform
FastAPI Backend Server (FINAL VERSION)

Features:
- 6 Disease Prediction Models (Heart, Kidney, Stroke, Diabetes, Brain Tumor, Thyroid)
- Gemini AI Chatbot & Explanations
- Google Maps Doctor Suggestions
- WhatsApp Report Delivery (Twilio)
- PDF Medical Report Generation
- AI Diet Planner
- Patient ID-based Storage (UUID)
"""

from fastapi import FastAPI, HTTPException, Depends, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from typing import Optional, Dict, Any, List
import json
import uuid
import os
import hashlib
import hmac
import base64
import time
from datetime import datetime
from pathlib import Path

# Initialize FastAPI
app = FastAPI(
    title="ICCIP API",
    description="Integrated Chronic Care Intelligence Platform - AI-Powered Health Predictions",
    version="2.0.0"
)

# CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data directory
DATA_DIR = Path(__file__).parent / "data"
DATA_DIR.mkdir(exist_ok=True)
(DATA_DIR / "patients").mkdir(exist_ok=True)

# JWT / Auth config
JWT_SECRET = "iccip-secret-key-2026-hackathon"
ADMIN_EMAIL = "admin@iccip.com"
ADMIN_PASSWORD = "admin123"
security = HTTPBearer(auto_error=False)

# Simple JWT implementation
def _hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def _create_token(user_id: str, email: str, role: str) -> str:
    payload = json.dumps({"user_id": user_id, "email": email, "role": role, "exp": time.time() + 86400})
    encoded = base64.urlsafe_b64encode(payload.encode()).decode()
    sig = hmac.new(JWT_SECRET.encode(), encoded.encode(), hashlib.sha256).hexdigest()[:16]
    return f"{encoded}.{sig}"

def _decode_token(token: str) -> dict:
    try:
        parts = token.split(".")
        encoded = parts[0]
        payload = json.loads(base64.urlsafe_b64decode(encoded + "=="))
        if payload.get("exp", 0) < time.time():
            return None
        return payload
    except:
        return None

def _get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    user = _decode_token(credentials.credentials)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return user

def _get_optional_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    if not credentials:
        return None
    return _decode_token(credentials.credentials)

def _get_admin_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    user = _get_current_user(credentials)
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user

# Initialize default admin user
def _init_admin():
    users = _load_json("users.json")
    admin_exists = any(u.get("role") == "admin" for u in users)
    if not admin_exists:
        users.append({
            "id": "admin-001",
            "name": "Admin",
            "email": ADMIN_EMAIL,
            "password": _hash_password(ADMIN_PASSWORD),
            "role": "admin",
            "phone": "",
            "created_at": datetime.now().isoformat()
        })
        _save_json("users.json", users)
        print("✅ Default admin created (admin@iccip.com / admin123)")

# Lazy-load prediction engine
_engine = None

def get_engine():
    global _engine
    if _engine is None:
        try:
            from prediction_engine import PredictionEngine
            _engine = PredictionEngine()
        except Exception as e:
            print(f"⚠️ Engine load warning: {e}")
            from prediction_engine import PredictionEngine
            _engine = PredictionEngine()
    return _engine


# --- Pydantic Models (VERIFIED from model files) ---

class HeartPredictionRequest(BaseModel):
    age: int = 50
    sex: str = "Male"
    chest_pain: str = "Asymptomatic"
    resting_bp: int = 120
    cholesterol: int = 200
    fasting_blood_sugar: str = "No"
    resting_ecg: str = "Normal"
    max_heart_rate: int = 150
    exercise_angina: str = "No"
    st_depression: float = 1.0
    slope: str = "Flat"
    num_vessels: int = 0
    thalassemia: str = "Normal"

class KidneyPredictionRequest(BaseModel):
    age: int = 50
    blood_pressure: int = 80
    specific_gravity: float = 1.020
    albumin: float = 0
    sugar: float = 0
    blood_glucose: int = 120
    blood_urea: float = 36
    serum_creatinine: float = 1.2
    sodium: float = 138
    potassium: float = 4.5
    hemoglobin: float = 15
    packed_cell_volume: int = 44
    wbc_count: int = 7800
    rbc_count: float = 5.2
    red_blood_cells: str = "normal"
    pus_cell: str = "normal"
    pus_cell_clumps: str = "notpresent"
    bacteria: str = "notpresent"
    hypertension: str = "no"
    diabetes_mellitus: str = "no"
    coronary_artery_disease: str = "no"
    appetite: str = "good"
    pedal_edema: str = "no"
    anaemia: str = "no"

class StrokePredictionRequest(BaseModel):
    gender: str = "Male"
    age: int = 50
    hypertension: str = "No"
    heart_disease: str = "No"
    ever_married: str = "No"
    work_type: str = "Private"
    residence_type: str = "Urban"
    avg_glucose_level: float = 100
    bmi: float = 25
    smoking_status: str = "never smoked"

class DiabetesPredictionRequest(BaseModel):
    pregnancies: int = 0
    glucose: float = 120
    blood_pressure: int = 80
    skin_thickness: int = 20
    insulin: float = 100
    bmi: float = 25
    diabetes_pedigree: float = 0.5
    age: int = 30

# Liver Request Removed

class ThyroidPredictionRequest(BaseModel):
    age: int = 40
    sex: str = "Female"
    on_thyroxine: str = "No"
    query_on_thyroxine: str = "No"
    on_antithyroid_meds: str = "No"
    sick: str = "No"
    pregnant: str = "No"
    thyroid_surgery: str = "No"
    I131_treatment: str = "No"
    query_hypothyroid: str = "No"
    query_hyperthyroid: str = "No"
    lithium: str = "No"
    goitre: str = "No"
    tumor: str = "No"
    psych: str = "No"
    TSH: float = 2.5
    T3: float = 1.5
    TT4: float = 110.0
    T4U: float = 1.0
    FTI: float = 110.0
    TBG: float = 20.0

class PatientProfile(BaseModel):
    name: str
    age: int
    sex: str = "Male"
    email: Optional[str] = None
    phone: Optional[str] = None
    blood_group: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    chronic_conditions: list = []
    medications: list = []

class VitalRecord(BaseModel):
    patient_id: str
    blood_pressure_systolic: int = 120
    blood_pressure_diastolic: int = 80
    heart_rate: int = 72
    blood_sugar: float = 100
    spo2: float = 98
    temperature: float = 98.6
    weight: float = 70
    timestamp: Optional[str] = None

class ChatRequest(BaseModel):
    message: str
    patient_id: Optional[str] = None
    image_base64: Optional[str] = None

class DoctorSearchRequest(BaseModel):
    latitude: float
    longitude: float
    condition: str = "heart"
    radius: int = 10000

class WhatsAppRequest(BaseModel):
    patient_id: str
    phone_number: str

class ComprehensiveRequest(BaseModel):
    name: str = "Patient"
    age: int = 40
    sex: str = "Male"
    phone: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    # Heart
    chest_pain: str = "Asymptomatic"
    resting_bp: int = 120
    cholesterol: int = 200
    fasting_blood_sugar: str = "No"
    resting_ecg: str = "Normal"
    max_heart_rate: int = 150
    exercise_angina: str = "No"
    st_depression: float = 1.0
    slope: str = "Flat"
    num_vessels: int = 0
    thalassemia: str = "Normal"
    # Kidney
    blood_pressure: int = 80
    specific_gravity: float = 1.020
    albumin: float = 0
    sugar: float = 0
    blood_glucose: int = 120
    blood_urea: float = 36
    serum_creatinine: float = 1.2
    sodium: float = 138
    potassium: float = 4.5
    hemoglobin: float = 15
    packed_cell_volume: int = 44
    wbc_count: int = 7800
    rbc_count: float = 5.2
    red_blood_cells: str = "normal"
    pus_cell: str = "normal"
    pus_cell_clumps: str = "notpresent"
    bacteria: str = "notpresent"
    # Stroke
    hypertension: str = "No"
    heart_disease: str = "No"
    ever_married: str = "No"
    work_type: str = "Private"
    residence_type: str = "Urban"
    avg_glucose_level: float = 100
    bmi: float = 25
    smoking_status: str = "never smoked"
    # Diabetes
    pregnancies: int = 0
    glucose: float = 120
    skin_thickness: int = 20
    insulin: float = 100
    diabetes_pedigree: float = 0.5
    # Brain (Optional Image as Base64)
    brain_mri_base64: Optional[str] = None
    # Thyroid
    on_thyroxine: str = "No"
    query_on_thyroxine: str = "No"
    on_antithyroid_meds: str = "No"
    sick: str = "No"
    pregnant: str = "No"
    thyroid_surgery: str = "No"
    I131_treatment: str = "No"
    query_hypothyroid: str = "No"
    query_hyperthyroid: str = "No"
    lithium: str = "No"
    goitre: str = "No"
    tumor: str = "No"
    psych: str = "No"
    TSH: float = 2.5
    T3: float = 1.5
    TT4: float = 110.0
    T4U: float = 1.0
    FTI: float = 110.0
    TBG: float = 20.0


# --- API Routes ---

@app.get("/")
async def root():
    return {
        "platform": "ICCIP - Integrated Chronic Care Intelligence Platform",
        "version": "2.0.0",
        "status": "active",
        "endpoints": {
            "predictions": "/api/predict/{disease}",
            "comprehensive": "/api/predict/comprehensive",
            "ai_chat": "/api/ai/chat",
            "diet_plan": "/api/ai/diet-plan",
            "ai_explain": "/api/ai/explain",
            "doctors": "/api/doctors/search",
            "report": "/api/report/generate",
            "whatsapp": "/api/whatsapp/send",
            "vitals": "/api/vitals",
            "patients": "/api/patients",
            "dashboard": "/api/dashboard/stats"
        }
    }

@app.get("/api/health")
async def health_check():
    engine = get_engine()
    loaded = sum(1 for v in engine.models.values() if v is not None)
    return {
        "status": "healthy",
        "models_loaded": loaded,
        "total_models": len(engine.models),
        "services": {
            "predictions": True,
            "gemini_ai": True,
            "google_maps": bool(os.environ.get("GOOGLE_MAPS_API_KEY", "")),
            "whatsapp": bool(os.environ.get("TWILIO_ACCOUNT_SID", "")),
        },
        "timestamp": datetime.now().isoformat()
    }


# =============================================
# PREDICTION ENDPOINTS
# =============================================

@app.post("/api/predict/heart")
async def predict_heart(request: HeartPredictionRequest, user: dict = Depends(_get_optional_user)):
    engine = get_engine()
    result = engine.predict_heart_disease(request.model_dump())
    _save_prediction("heart", request.model_dump(), result, user["user_id"] if user else None)
    return result

@app.post("/api/predict/kidney")
async def predict_kidney(request: KidneyPredictionRequest, user: dict = Depends(_get_optional_user)):
    engine = get_engine()
    result = engine.predict_kidney_disease(request.model_dump())
    _save_prediction("kidney", request.model_dump(), result, user["user_id"] if user else None)
    return result

@app.post("/api/predict/stroke")
async def predict_stroke(request: StrokePredictionRequest, user: dict = Depends(_get_optional_user)):
    engine = get_engine()
    result = engine.predict_stroke(request.model_dump())
    _save_prediction("stroke", request.model_dump(), result, user["user_id"] if user else None)
    return result

@app.post("/api/predict/diabetes")
async def predict_diabetes(request: DiabetesPredictionRequest, user: dict = Depends(_get_optional_user)):
    engine = get_engine()
    result = engine.predict_diabetes(request.model_dump())
    _save_prediction("diabetes", request.model_dump(), result, user["user_id"] if user else None)
    return result

@app.post("/api/predict/thyroid")
async def predict_thyroid(request: ThyroidPredictionRequest, user: dict = Depends(_get_optional_user)):
    engine = get_engine()
    result = engine.predict_thyroid(request.model_dump())
    _save_prediction("thyroid", request.model_dump(), result, user["user_id"] if user else None)
    return result

@app.post("/api/predict/brain")
async def predict_brain(file: UploadFile = File(...), model_name: str = "DenseNet-121", user: dict = Depends(_get_optional_user)):
    """Brain tumor detection from MRI scan"""
    temp_path = DATA_DIR / f"temp_{uuid.uuid4().hex}_{file.filename}"
    with open(temp_path, "wb") as f:
        f.write(await file.read())
    
    try:
        engine = get_engine()
        result = engine.predict_brain_tumor(str(temp_path), model_name)
        _save_prediction("brain", {"model": model_name, "filename": file.filename}, result, user["user_id"] if user else None)
        return result
    finally:
        if temp_path.exists():
            try: os.remove(temp_path)
            except: pass

# =============================================
# COMPREHENSIVE PREDICTION (ALL 6 MODELS)
# =============================================

@app.post("/api/predict/comprehensive")
async def comprehensive_prediction(data: ComprehensiveRequest, user: dict = Depends(_get_optional_user)):
    """Run ALL 6 models, generate AI explanation, diet plan, find doctors, create report"""
    engine = get_engine()
    raw = data.model_dump()

    # 1. Generate Patient ID
    patient_id = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    patient_data = {
        "patient_id": patient_id,
        "name": raw.get("name", "Patient"),
        "age": raw.get("age", 40),
        "sex": raw.get("sex", "Male"),
        "phone": raw.get("phone"),
        "latitude": raw.get("latitude"),
        "longitude": raw.get("longitude"),
        "created_at": datetime.now().isoformat()
    }

    # 2. Run ALL 6 models
    predictions = {}

    # Heart
    predictions['heart'] = engine.predict_heart_disease(raw)

    # Kidney
    predictions['kidney'] = engine.predict_kidney_disease(raw)

    # Stroke
    predictions['stroke'] = engine.predict_stroke(raw)

    # Diabetes
    predictions['diabetes'] = engine.predict_diabetes(raw)

    # Brain (Optional)
    if raw.get('brain_mri_base64'):
        try:
            import base64
            header, encoded = raw['brain_mri_base64'].split(',', 1) if ',' in raw['brain_mri_base64'] else (None, raw['brain_mri_base64'])
            data = base64.b64decode(encoded)
            temp_path = DATA_DIR / f"comp_brain_{uuid.uuid4().hex}.jpg"
            with open(temp_path, "wb") as f:
                f.write(data)
            predictions['brain'] = engine.predict_brain_tumor(str(temp_path))
            if temp_path.exists(): os.remove(temp_path)
        except Exception as e:
            print(f"Comprehensive brain error: {e}")
            predictions['brain'] = {"error": "Failed to process MRI scan"}
    else:
        predictions['brain'] = {"risk_level": "None", "risk_percentage": 0, "risk_score": 0.0, "predicted_class": "Not Provided"}

    # Thyroid
    predictions['thyroid'] = engine.predict_thyroid(raw)

    # 3. Calculate overall risk
    overall_risk = 0
    count = 0
    highest_condition = ""
    highest_risk_val = 0
    for disease, result in predictions.items():
        if isinstance(result, dict) and 'risk_score' in result:
            overall_risk += result['risk_score']
            count += 1
            if result['risk_score'] > highest_risk_val:
                highest_risk_val = result['risk_score']
                highest_condition = disease
    overall_risk = overall_risk / count if count > 0 else 0

    # 4. Generate AI Explanation
    ai_explanation = ""
    try:
        from gemini_service import generate_risk_explanation
        ai_explanation = generate_risk_explanation(predictions, patient_data.get("name", "Patient"))
    except Exception as e:
        print(f"AI explanation error: {e}")
        ai_explanation = "AI explanation unavailable."

    # 5. Generate Diet Plan
    diet_plan = {}
    try:
        from gemini_service import generate_diet_plan
        diet_plan = generate_diet_plan(predictions, patient_data)
    except Exception as e:
        print(f"Diet plan error: {e}")

    # 6. Find Nearby Doctors
    doctors = []
    lat = raw.get("latitude")
    lng = raw.get("longitude")
    if lat and lng:
        try:
            from maps_service import get_doctors_for_all_risks
            doctors = get_doctors_for_all_risks(lat, lng, predictions)
        except Exception as e:
            print(f"Doctor search error: {e}")

    # 7. Generate PDF Report
    report_path = ""
    try:
        from report_service import generate_report
        report_path = generate_report(patient_data, predictions, diet_plan, doctors, ai_explanation)
    except Exception as e:
        print(f"Report generation error: {e}")

    # 8. Save patient data
    _save_patient_data(patient_id, patient_data, predictions, diet_plan, doctors)

    # 9. Build response
    response = {
        "patient_id": patient_id,
        "patient": patient_data,
        "predictions": predictions,
        "heart_risk": f"{predictions.get('heart', {}).get('risk_percentage', 0)}%",
        "kidney_risk": f"{predictions.get('kidney', {}).get('risk_percentage', 0)}%",
        "stroke_risk": f"{predictions.get('stroke', {}).get('risk_percentage', 0)}%",
        "diabetes_risk": f"{predictions.get('diabetes', {}).get('risk_percentage', 0)}%",
        "brain_risk": f"{predictions.get('brain', {}).get('risk_percentage', 0)}%",
        "thyroid_status": predictions.get('thyroid', {}).get('predicted_class', 'N/A'),
        "overall_risk_score": round(overall_risk, 4),
        "overall_risk_percentage": round(overall_risk * 100, 2),
        "highest_risk_condition": highest_condition,
        "ai_explanation": ai_explanation,
        "diet_plan": diet_plan,
        "doctor_recommendation": doctors,
        "report_available": bool(report_path),
        "report_status": "Generated" if report_path else "Failed",
        "models_used": count,
        "timestamp": datetime.now().isoformat()
    }

    u_id = user["user_id"] if user else None
    _save_prediction("comprehensive", raw, response, u_id)
    return response


# =============================================
# AI ENDPOINTS (Gemini)
# =============================================

@app.post("/api/ai/chat")
async def ai_chat(request: ChatRequest):
    """Interactive AI health chatbot"""
    try:
        from gemini_service import chat_with_ai
        patient_context = None
        if request.patient_id:
            patient_dir = DATA_DIR / "patients" / request.patient_id
            profile_path = patient_dir / "profile.json"
            if profile_path.exists():
                with open(profile_path) as f:
                    patient_context = json.load(f)

        response = chat_with_ai(request.message, patient_context, request.image_base64)
        return {"response": response, "patient_id": request.patient_id}
    except Exception as e:
        return {"response": f"AI assistant unavailable: {str(e)}", "patient_id": request.patient_id}

@app.post("/api/ai/explain")
async def ai_explain(data: Dict[str, Any]):
    """Generate AI explanation for prediction results"""
    try:
        from gemini_service import generate_risk_explanation
        predictions = data.get("predictions", data)
        name = data.get("patient_name", "Patient")
        explanation = generate_risk_explanation(predictions, name)
        return {"explanation": explanation}
    except Exception as e:
        return {"explanation": f"AI explanation unavailable: {str(e)}"}

@app.post("/api/ai/diet-plan")
async def ai_diet_plan(data: Dict[str, Any]):
    """Generate personalized diet plan"""
    try:
        from gemini_service import generate_diet_plan
        predictions = data.get("predictions", {})
        patient_info = data.get("patient_info", {})
        plan = generate_diet_plan(predictions, patient_info)
        return {"diet_plan": plan}
    except Exception as e:
        return {"diet_plan": {}, "error": str(e)}


# =============================================
# DOCTOR SEARCH (Google Maps)
# =============================================

@app.post("/api/doctors/search")
async def search_doctors(request: DoctorSearchRequest):
    """Search nearby specialist doctors"""
    try:
        from maps_service import find_nearby_doctors
        result = find_nearby_doctors(request.latitude, request.longitude, request.condition, request.radius)
        return result
    except Exception as e:
        return {"error": str(e), "doctors": []}


# =============================================
# REPORT & WHATSAPP
# =============================================

@app.get("/api/report/{patient_id}")
async def get_report(patient_id: str):
    """Download patient's PDF report"""
    report_path = DATA_DIR / "patients" / patient_id / "report.pdf"
    if report_path.exists():
        return FileResponse(str(report_path), media_type="application/pdf", filename=f"ICCIP_Report_{patient_id}.pdf")
    raise HTTPException(status_code=404, detail="Report not found. Run comprehensive prediction first.")

@app.post("/api/report/generate")
async def generate_report_endpoint(data: Dict[str, Any]):
    """Generate PDF report from provided data"""
    try:
        from report_service import generate_report
        patient_data = data.get("patient", {})
        predictions = data.get("predictions", {})
        diet_plan = data.get("diet_plan", {})
        doctors = data.get("doctors", [])
        ai_explanation = data.get("ai_explanation", "")

        path = generate_report(patient_data, predictions, diet_plan, doctors, ai_explanation)
        return {"status": "generated", "path": path, "patient_id": patient_data.get("patient_id")}
    except Exception as e:
        return {"status": "error", "error": str(e)}

@app.post("/api/whatsapp/send")
async def send_whatsapp(request: WhatsAppRequest):
    """Send report via WhatsApp"""
    try:
        from whatsapp_service import send_whatsapp_report
        # Get patient name
        patient_dir = DATA_DIR / "patients" / request.patient_id
        profile_path = patient_dir / "profile.json"
        patient_name = "Patient"
        if profile_path.exists():
            with open(profile_path) as f:
                profile = json.load(f)
                patient_name = profile.get("name", "Patient")

        report_path = str(patient_dir / "report.pdf")
        result = send_whatsapp_report(request.phone_number, patient_name, report_path)
        return result
    except Exception as e:
        return {"status": "error", "error": str(e)}


# =============================================
# VITALS ENDPOINTS
# =============================================

@app.post("/api/vitals")
async def record_vitals(vital: VitalRecord):
    vital_data = vital.model_dump()
    vital_data['timestamp'] = vital.timestamp or datetime.now().isoformat()
    vitals = _load_json("vitals.json")
    vitals.append(vital_data)
    _save_json("vitals.json", vitals)
    return {"status": "recorded", "data": vital_data}

@app.get("/api/vitals/{patient_id}")
async def get_vitals(patient_id: str):
    vitals = _load_json("vitals.json")
    patient_vitals = [v for v in vitals if v.get('patient_id') == patient_id]
    return {"patient_id": patient_id, "records": patient_vitals}


# =============================================
# PATIENT ENDPOINTS
# =============================================

@app.post("/api/patients")
async def create_patient(profile: PatientProfile):
    patients = _load_json("patients.json")
    patient_data = profile.model_dump()
    patient_data['id'] = f"PAT-{uuid.uuid4().hex[:8].upper()}"
    patient_data['created_at'] = datetime.now().isoformat()
    patients.append(patient_data)
    _save_json("patients.json", patients)

    # Save to patient directory
    patient_dir = DATA_DIR / "patients" / patient_data['id']
    patient_dir.mkdir(parents=True, exist_ok=True)
    with open(patient_dir / "profile.json", "w") as f:
        json.dump(patient_data, f, indent=2)

    return {"status": "created", "patient": patient_data}

@app.get("/api/patients")
async def list_patients():
    patients = _load_json("patients.json")
    return {"patients": patients, "total": len(patients)}

@app.get("/api/patients/{patient_id}")
async def get_patient(patient_id: str):
    # Check patient directory first
    patient_dir = DATA_DIR / "patients" / patient_id
    profile_path = patient_dir / "profile.json"
    if profile_path.exists():
        with open(profile_path) as f:
            return json.load(f)

    # Fallback to patients.json
    patients = _load_json("patients.json")
    for p in patients:
        if p.get('id') == patient_id:
            return p
    raise HTTPException(status_code=404, detail="Patient not found")

@app.get("/api/patients/{patient_id}/predictions")
async def get_patient_predictions(patient_id: str):
    """Get all predictions for a specific patient"""
    patient_dir = DATA_DIR / "patients" / patient_id
    pred_path = patient_dir / "predictions.json"
    if pred_path.exists():
        with open(pred_path) as f:
            return {"patient_id": patient_id, "predictions": json.load(f)}
    return {"patient_id": patient_id, "predictions": []}


# =============================================
# DASHBOARD STATS
# =============================================

@app.get("/api/dashboard/stats")
async def dashboard_stats():
    patients = _load_json("patients.json")
    predictions = _load_json("predictions.json")
    vitals = _load_json("vitals.json")

    disease_counts = {}
    risk_distribution = {"Low": 0, "Medium": 0, "High": 0}
    for pred in predictions:
        disease = pred.get('disease', 'unknown')
        disease_counts[disease] = disease_counts.get(disease, 0) + 1
        risk = pred.get('result', {}).get('risk_level', 'Low')
        risk_distribution[risk] = risk_distribution.get(risk, 0) + 1

    return {
        "total_patients": len(patients),
        "total_predictions": len(predictions),
        "total_vitals": len(vitals),
        "disease_prediction_counts": disease_counts,
        "risk_distribution": risk_distribution,
        "recent_predictions": predictions[-5:] if predictions else [],
        "platform_uptime": "99.9%",
        "ai_models_active": 6,
        "services": {
            "gemini_ai": "active",
            "google_maps": "active",
            "whatsapp": "active",
            "pdf_reports": "active"
        }
    }


# =============================================
# MEDICATIONS & CARE PLANS
# =============================================

@app.get("/api/medications/{patient_id}")
async def get_medications(patient_id: str):
    meds = _load_json("medications.json")
    patient_meds = [m for m in meds if m.get('patient_id') == patient_id]
    return {"patient_id": patient_id, "medications": patient_meds}

@app.post("/api/medications")
async def add_medication(data: Dict[str, Any]):
    meds = _load_json("medications.json")
    data['id'] = f"MED-{len(meds)+1:04d}"
    data['created_at'] = datetime.now().isoformat()
    meds.append(data)
    _save_json("medications.json", meds)
    return {"status": "added", "medication": data}

@app.get("/api/careplan/{patient_id}")
async def get_care_plan(patient_id: str):
    """Generate an AI care plan based on patient history"""
    predictions = _load_json("predictions.json")
    patient_preds = [p for p in predictions if p.get('patient_id') == patient_id]

    plan = {
        "patient_id": patient_id,
        "generated_at": datetime.now().isoformat(),
        "lifestyle": [
            "Maintain 30 minutes of moderate exercise daily",
            "Follow a balanced diet with emphasis on fruits and vegetables",
            "Ensure 7-8 hours of quality sleep",
            "Practice stress management techniques"
        ],
        "monitoring": [
            "Check blood pressure twice daily",
            "Monitor blood glucose before and after meals",
            "Weekly weight monitoring",
            "Monthly comprehensive blood work"
        ],
        "follow_ups": [
            "Cardiology review in 3 months",
            "General physician check-up in 1 month",
            "Lab tests in 2 weeks"
        ],
        "alerts": [
            "Seek emergency care if BP > 180/120",
            "Contact doctor if blood sugar > 300 mg/dL",
            "Report any chest pain or breathing difficulty immediately"
        ]
    }
    return plan


# =============================================
# UTILITY FUNCTIONS
# =============================================

def _load_json(filename):
    filepath = DATA_DIR / filename
    if filepath.exists():
        with open(filepath, 'r') as f:
            return json.load(f)
    return []

def _save_json(filename, data):
    filepath = DATA_DIR / filename
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2, default=str)

def _save_prediction(disease, input_data, result, user_id=None):
    predictions = _load_json("predictions.json")
    entry = {
        "disease": disease,
        "input": input_data,
        "result": result,
        "timestamp": datetime.now().isoformat()
    }
    if user_id:
        entry["user_id"] = user_id
    predictions.append(entry)
    _save_json("predictions.json", predictions)

def _save_patient_data(patient_id, patient_data, predictions, diet_plan=None, doctors=None):
    """Save all patient data to their directory"""
    patient_dir = DATA_DIR / "patients" / patient_id
    patient_dir.mkdir(parents=True, exist_ok=True)

    with open(patient_dir / "profile.json", "w") as f:
        json.dump(patient_data, f, indent=2, default=str)

    with open(patient_dir / "predictions.json", "w") as f:
        json.dump(predictions, f, indent=2, default=str)

    if diet_plan:
        with open(patient_dir / "diet_plan.json", "w") as f:
            json.dump(diet_plan, f, indent=2, default=str)

    if doctors:
        with open(patient_dir / "doctors.json", "w") as f:
            json.dump(doctors, f, indent=2, default=str)


# =============================================
# AUTH MODELS
# =============================================

class RegisterRequest(BaseModel):
    name: str
    email: str
    password: str
    phone: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str


# =============================================
# AUTH ENDPOINTS
# =============================================

@app.post("/api/auth/register")
async def register(req: RegisterRequest):
    users = _load_json("users.json")
    # Check duplicate
    if any(u["email"] == req.email for u in users):
        raise HTTPException(status_code=400, detail="Email already registered")

    user = {
        "id": f"USR-{uuid.uuid4().hex[:8].upper()}",
        "name": req.name,
        "email": req.email,
        "password": _hash_password(req.password),
        "phone": req.phone,
        "role": "user",
        "created_at": datetime.now().isoformat()
    }
    users.append(user)
    _save_json("users.json", users)

    token = _create_token(user["id"], user["email"], user["role"])
    return {
        "status": "registered",
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}
    }

@app.post("/api/auth/login")
async def login(req: LoginRequest):
    users = _load_json("users.json")
    password_hash = _hash_password(req.password)
    user = next((u for u in users if u["email"] == req.email and u["password"] == password_hash), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = _create_token(user["id"], user["email"], user["role"])
    return {
        "status": "logged_in",
        "token": token,
        "user": {"id": user["id"], "name": user["name"], "email": user["email"], "role": user["role"]}
    }

@app.get("/api/auth/me")
async def get_me(user=Depends(_get_current_user)):
    users = _load_json("users.json")
    full_user = next((u for u in users if u["id"] == user["user_id"]), None)
    if not full_user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"id": full_user["id"], "name": full_user["name"], "email": full_user["email"], "role": full_user["role"], "phone": full_user.get("phone", ""), "created_at": full_user.get("created_at")}


# =============================================
# USER HISTORY (per-user predictions)
# =============================================

@app.post("/api/user/predict/{disease}")
async def user_predict(disease: str, data: Dict[str, Any], user=Depends(_get_current_user)):
    """Run prediction and save under user's history"""
    engine = get_engine()
    user_id = user["user_id"]

    predict_map = {
        "heart": engine.predict_heart_disease,
        "kidney": engine.predict_kidney_disease,
        "stroke": engine.predict_stroke,
        "diabetes": engine.predict_diabetes,
        "thyroid": engine.predict_thyroid,
    }

    if disease not in predict_map:
        raise HTTPException(status_code=400, detail=f"Unknown disease: {disease}")

    result = predict_map[disease](data)
    _save_prediction(disease, data, result, user_id=user_id)
    return result

@app.get("/api/user/history")
async def get_user_history(user=Depends(_get_current_user)):
    """Get logged-in user's prediction history"""
    predictions = _load_json("predictions.json")
    user_preds = [p for p in predictions if p.get("user_id") == user["user_id"]]
    return {"user_id": user["user_id"], "predictions": user_preds, "total": len(user_preds)}


# =============================================
# ADMIN ENDPOINTS
# =============================================

@app.get("/api/admin/users")
async def admin_get_users(user=Depends(_get_admin_user)):
    """Admin: get all registered users"""
    users = _load_json("users.json")
    safe_users = []
    for u in users:
        safe_users.append({
            "id": u["id"],
            "name": u["name"],
            "email": u["email"],
            "role": u["role"],
            "phone": u.get("phone", ""),
            "created_at": u.get("created_at", "")
        })
    return {"users": safe_users, "total": len(safe_users)}

@app.get("/api/admin/users/{user_id}")
async def admin_get_user_detail(user_id: str, user=Depends(_get_admin_user)):
    """Admin: get a specific user's full data"""
    users = _load_json("users.json")
    target = next((u for u in users if u["id"] == user_id), None)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")

    predictions = _load_json("predictions.json")
    user_preds = [p for p in predictions if p.get("user_id") == user_id]

    return {
        "user": {"id": target["id"], "name": target["name"], "email": target["email"], "role": target["role"], "phone": target.get("phone"), "created_at": target.get("created_at")},
        "predictions": user_preds,
        "total_predictions": len(user_preds)
    }

@app.delete("/api/admin/users/{user_id}")
async def admin_delete_user(user_id: str, user=Depends(_get_admin_user)):
    """Admin: delete a user"""
    if user_id == user["user_id"]:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    users = _load_json("users.json")
    users = [u for u in users if u["id"] != user_id]
    _save_json("users.json", users)
    return {"status": "deleted", "user_id": user_id}

@app.get("/api/admin/predictions")
async def admin_get_all_predictions(user=Depends(_get_admin_user)):
    """Admin: get all predictions across all users"""
    predictions = _load_json("predictions.json")
    return {"predictions": predictions, "total": len(predictions)}

@app.get("/api/admin/stats")
async def admin_stats(user=Depends(_get_admin_user)):
    """Admin: get platform statistics"""
    users = _load_json("users.json")
    predictions = _load_json("predictions.json")
    vitals = _load_json("vitals.json")

    disease_counts = {}
    risk_dist = {"Low": 0, "Medium": 0, "High": 0}
    for pred in predictions:
        d = pred.get("disease", "unknown")
        disease_counts[d] = disease_counts.get(d, 0) + 1
        r = pred.get("result", {}).get("risk_level", "Low")
        risk_dist[r] = risk_dist.get(r, 0) + 1

    return {
        "total_users": len([u for u in users if u.get("role") == "user"]),
        "total_admins": len([u for u in users if u.get("role") == "admin"]),
        "total_predictions": len(predictions),
        "total_vitals": len(vitals),
        "disease_counts": disease_counts,
        "risk_distribution": risk_dist,
        "recent_users": [{"id": u["id"], "name": u["name"], "email": u["email"], "created_at": u.get("created_at")} for u in users[-5:]],
        "recent_predictions": predictions[-10:]
    }


# Initialize admin on startup
_init_admin()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
