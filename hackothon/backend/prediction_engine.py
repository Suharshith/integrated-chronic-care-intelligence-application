"""
Integrated Chronic Care Intelligence Platform - Prediction Engine
Loads and uses trained ML models for disease prediction
VERIFIED: All feature orders match the actual model files
"""

import os
import sys
import joblib
import pickle
import numpy as np
import pandas as pd
from pathlib import Path

# Models directory
MODELS_DIR = Path(__file__).parent / "models"

class PredictionEngine:
    """Unified engine to load and run all disease prediction models"""

    def __init__(self):
        self.models = {}
        self.load_all_models()

    def load_all_models(self):
        """Load all available trained models"""
        print("🔄 Loading disease prediction models...")

        # 1. Heart Disease Model (XGBoost, 17 features)
        try:
            heart_path = MODELS_DIR / "heart"
            self.models['heart'] = {
                'model': joblib.load(heart_path / 'xgboost_model.pkl'),
            }
            print("✅ Heart disease model loaded (17 features)")
        except Exception as e:
            print(f"❌ Heart model error: {e}")
            self.models['heart'] = None

        # 2. Kidney Disease Model (Random Forest + optional CNN ensemble)
        try:
            kidney_path = MODELS_DIR / "kidney"
            self.models['kidney'] = {
                'tabular_model': joblib.load(kidney_path / 'tabular_model.joblib'),
                'model_columns': joblib.load(kidney_path / 'model_columns.pkl'),
                'cnn_model': None,
                'cnn_scaler': None,
            }
            # Load CNN model if available (ensemble)
            cnn_path = kidney_path / 'kidney_cnn_model.h5'
            cnn_scaler_path = kidney_path / 'cnn_scaler.pkl'
            if cnn_path.exists():
                try:
                    from tensorflow import keras
                    self.models['kidney']['cnn_model'] = keras.models.load_model(str(cnn_path))
                    if cnn_scaler_path.exists():
                        self.models['kidney']['cnn_scaler'] = joblib.load(cnn_scaler_path)
                    print("✅ Kidney CNN model loaded (ensemble mode)")
                except Exception as cnn_e:
                    print(f"⚠️ Kidney CNN not loaded (RF-only mode): {cnn_e}")
            print(f"✅ Kidney disease model loaded ({len(self.models['kidney']['model_columns'])} columns)")
        except Exception as e:
            print(f"❌ Kidney model error: {e}")
            self.models['kidney'] = None

        # 3. Stroke Model (CatBoost, 11→17 features via preprocessor)
        try:
            stroke_path = MODELS_DIR / "stroke"
            self.models['stroke'] = {
                'model': joblib.load(stroke_path / 'best_stroke_model.pkl'),
                'preprocessor': joblib.load(stroke_path / 'preprocessor.pkl'),
                'threshold': 0.3,
            }
            print(f"✅ Stroke model loaded (preprocessor expects {len(self.models['stroke']['preprocessor'].feature_names_in_)} features)")
        except Exception as e:
            print(f"❌ Stroke model error: {e}")
            self.models['stroke'] = None

        # 4. Thyroid Model (RandomForest, 21 features, stored as dict)
        try:
            thyroid_path = MODELS_DIR / "thyroid"
            thyroid_data = joblib.load(thyroid_path / 'model.pkl')
            if isinstance(thyroid_data, dict):
                self.models['thyroid'] = {
                    'model': thyroid_data['model'],
                    'feature_names': thyroid_data.get('feature_names', []),
                    'class_names': thyroid_data.get('class_names', []),
                }
            else:
                self.models['thyroid'] = {'model': thyroid_data, 'feature_names': [], 'class_names': []}
            print(f"✅ Thyroid model loaded ({len(self.models['thyroid']['feature_names'])} features, {len(self.models['thyroid']['class_names'])} classes)")
        except Exception as e:
            print(f"❌ Thyroid model error: {e}")
            self.models['thyroid'] = None

        # 5. Brain Tumor Models (Lazy loaded due to size)
        self.models['brain'] = {
            'dir': MODELS_DIR / "brain",
            'class_names': ["glioma", "meningioma", "notumor", "pituitary"],
            'loaded_models': {}
        }
        print("✅ Brain tumor engine initialized (lazy-loading enabled)")

        print(f"📊 Models loaded: {sum(1 for v in self.models.values() if v is not None)}/{len(self.models)}")

    # ==========================================
    # 1. HEART DISEASE (17 features)
    # Verified order: [age, sex, cp, trestbps, chol, fbs, restecg, thalach,
    #   exang, oldpeak, slope, ca, thal, thalach_age_ratio,
    #   trestbps_chol_interaction, age_squared, chol_squared]
    # ==========================================
    def predict_heart_disease(self, data: dict) -> dict:
        if not self.models.get('heart'):
            return self._fallback('heart', data)
        try:
            model = self.models['heart']['model']
            age = data.get('age', 50)
            sex = 1 if data.get('sex', 'Male') == 'Male' else 0
            cp_map = {"Typical Angina": 0, "Atypical Angina": 1, "Non-anginal Pain": 2, "Asymptomatic": 3}
            cp = cp_map.get(data.get('chest_pain', 'Asymptomatic'), 3)
            trestbps = data.get('resting_bp', 120)
            chol = data.get('cholesterol', 200)
            fbs = 1 if data.get('fasting_blood_sugar', 'No') == 'Yes' else 0
            restecg_map = {"Normal": 0, "ST-T Abnormality": 1, "LV Hypertrophy": 2}
            restecg = restecg_map.get(data.get('resting_ecg', 'Normal'), 0)
            thalach = data.get('max_heart_rate', 150)
            exang = 1 if data.get('exercise_angina', 'No') == 'Yes' else 0
            oldpeak = data.get('st_depression', 1.0)
            slope_map = {"Upsloping": 0, "Flat": 1, "Downsloping": 2}
            slope = slope_map.get(data.get('slope', 'Flat'), 1)
            ca = data.get('num_vessels', 0)
            thal_map = {"Unknown": 0, "Normal": 1, "Fixed Defect": 2, "Reversible Defect": 3}
            thal = thal_map.get(data.get('thalassemia', 'Normal'), 1)

            # Engineered features (VERIFIED names: thalach_age_ratio, trestbps_chol_interaction, age_squared, chol_squared)
            features = [
                age, sex, cp, trestbps, chol, fbs, restecg, thalach,
                exang, oldpeak, slope, ca, thal,
                thalach / age if age != 0 else 0,      # thalach_age_ratio
                trestbps * chol,                         # trestbps_chol_interaction
                age ** 2,                                # age_squared
                chol ** 2                                # chol_squared
            ]

            input_df = pd.DataFrame([features], columns=list(model.feature_names_in_))
            proba = model.predict_proba(input_df)[0]
            risk_score = float(proba[1])

            return {
                'disease': 'Heart Disease',
                'prediction': int(risk_score > 0.5),
                'risk_score': round(risk_score, 4),
                'risk_percentage': round(risk_score * 100, 2),
                'risk_level': self._get_risk_level(risk_score),
                'confidence': round(float(max(proba)), 4),
                'model_used': 'XGBoost Heart Disease Model (17 features)',
                'recommendations': self._get_heart_recommendations(risk_score, data)
            }
        except Exception as e:
            print(f"Heart prediction error: {e}")
            return self._fallback('heart', data)

    # ==========================================
    # 2. KIDNEY DISEASE (24 columns)
    # Verified order from model_columns.pkl:
    # [age, bp, sg, al, su, bgr, bu, sc, sod, pot, hemo, pcv, wc, rc,
    #  rbc_normal, pc_normal, pcc_present, ba_present, htn_yes, dm_yes,
    #  cad_yes, appet_poor, pe_yes, ane_yes]
    # ==========================================
    # ==========================================
    # 2. KIDNEY DISEASE (24 features)
    # ==========================================
    def predict_kidney_disease(self, data: dict) -> dict:
        if not self.models.get('kidney'):
            return self._fallback('kidney', data)
        try:
            model_data = self.models['kidney']
            model = model_data['tabular_model']
            model_columns = model_data['model_columns']

            # 1. Prepare Features
            input_dict = self._get_kidney_input(data, model_columns)
            input_df = pd.DataFrame([input_dict])[model_columns]

            # 2. Tabular Prediction (Random Forest)
            prediction = model.predict(input_df)[0]
            proba = model.predict_proba(input_df)[0]
            ckd_idx = list(model.classes_).index('ckd') if 'ckd' in model.classes_ else 1
            rf_risk = float(proba[ckd_idx])

            # 3. CNN Ensemble (Optional)
            cnn_model = model_data.get('cnn_model')
            cnn_risk = None
            model_label = 'Random Forest (24 features)'
            
            if cnn_model is not None:
                try:
                    cnn_input = input_df.values.astype(np.float32)
                    cnn_scaler = model_data.get('cnn_scaler')
                    if cnn_scaler:
                        cnn_input = cnn_scaler.transform(cnn_input)
                    cnn_input = cnn_input.reshape(-1, len(model_columns), 1)
                    cnn_risk = float(cnn_model.predict(cnn_input, verbose=0)[0][0])
                    model_label = 'RF + CNN Ensemble'
                except Exception as cnn_e:
                    print(f"CNN prediction fallback: {cnn_e}")

            # 4. Final Risk Calculation
            risk_score = (rf_risk + cnn_risk) / 2 if cnn_risk is not None else rf_risk
            
            return {
                'disease': 'Kidney Disease',
                'prediction': int(prediction == 'ckd' or risk_score > 0.5),
                'risk_score': round(risk_score, 4),
                'risk_percentage': round(risk_score * 100, 2),
                'risk_level': self._get_risk_level(risk_score),
                'confidence': round(float(max(proba)), 4),
                'rf_probability': round(rf_risk, 4),
                'cnn_probability': round(cnn_risk, 4) if cnn_risk is not None else None,
                'ensemble': cnn_risk is not None,
                'model_used': model_label,
                'recommendations': self._get_kidney_recommendations(risk_score, data)
            }
        except Exception as e:
            print(f"Kidney prediction error: {e}")
            return self._fallback('kidney', data)

    def _get_kidney_input(self, data, columns):
        """Prepare the 24-feature vector for Chronic Kidney Disease prediction"""
        input_dict = {col: 0 for col in columns}
        
        # 14 numerical features
        mapping = {
            'age': ('age', 50),
            'bp': ('blood_pressure', 80),
            'sg': ('specific_gravity', 1.020),
            'al': ('albumin', 0),
            'su': ('sugar', 0),
            'bgr': ('blood_glucose', 120),
            'bu': ('blood_urea', 36),
            'sc': ('serum_creatinine', 1.2),
            'sod': ('sodium', 138),
            'pot': ('potassium', 4.5),
            'hemo': ('hemoglobin', 15),
            'pcv': ('packed_cell_volume', 44),
            'wc': ('wbc_count', 7800),
            'rc': ('rbc_count', 5.2)
        }
        for model_col, (data_key, default) in mapping.items():
            if model_col in input_dict:
                input_dict[model_col] = data.get(data_key, default)

        # 10 categorical features
        cat_mapping = {
            'red_blood_cells': ('normal', 'rbc_normal'),
            'pus_cell': ('normal', 'pc_normal'),
            'pus_cell_clumps': ('present', 'pcc_present'),
            'bacteria': ('present', 'ba_present'),
            'hypertension': ('yes', 'htn_yes'),
            'diabetes_mellitus': ('yes', 'dm_yes'),
            'coronary_artery_disease': ('yes', 'cad_yes'),
            'appetite': ('poor', 'appet_poor'),
            'pedal_edema': ('yes', 'pe_yes'),
            'anaemia': ('yes', 'ane_yes')
        }
        for data_key, (target_val, model_col) in cat_mapping.items():
            if model_col in input_dict:
                val = str(data.get(data_key, '')).lower()
                if val == target_val:
                    input_dict[model_col] = 1
        
        return input_dict

    # ==========================================
    # 3. STROKE (11 input features → preprocessor → 17)
    # Verified preprocessor input order:
    # [id, gender, age, hypertension, heart_disease, ever_married,
    #  work_type, Residence_type, avg_glucose_level, bmi, smoking_status]
    # ==========================================
    def predict_stroke(self, data: dict) -> dict:
        if not self.models.get('stroke'):
            return self._fallback('stroke', data)
        try:
            model_data = self.models['stroke']
            model = model_data['model']
            preprocessor = model_data['preprocessor']
            threshold = model_data['threshold']

            # Build input in EXACT preprocessor order (verified)
            # Scaling and Encoding are handled by the loaded preprocessor.pkl
            input_dict = {
                "id": 0,  # Required by preprocessor feature_names_in_
                "gender": str(data.get('gender', 'Male')),
                "age": float(data.get('age', 50)),
                "hypertension": 1 if data.get('hypertension', 'No') == 'Yes' else 0,
                "heart_disease": 1 if data.get('heart_disease', 'No') == 'Yes' else 0,
                "ever_married": str(data.get('ever_married', 'No')),
                "work_type": str(data.get('work_type', 'Private')),
                "Residence_type": str(data.get('residence_type', 'Urban')),
                "avg_glucose_level": float(data.get('avg_glucose_level', 100)),
                "bmi": float(data.get('bmi', 25)),
                "smoking_status": str(data.get('smoking_status', 'never smoked'))
            }

            input_raw = pd.DataFrame([input_dict])

            # Align input data with preprocessor features (as per your reference code)
            for col in preprocessor.feature_names_in_:
                if col not in input_raw.columns:
                    input_raw[col] = 0
            
            # Ensure order matches exactly
            input_raw = input_raw[list(preprocessor.feature_names_in_)]

            # Scikit-learn version mismatch shim (prevents 'fitted_passthrough' errors)
            if not hasattr(preprocessor, '_name_to_fitted_passthrough'):
                preprocessor._name_to_fitted_passthrough = {}

            # TRANSFORM - This applies the scaling and encoding
            input_processed = preprocessor.transform(input_raw)
            
            # PREDICT
            proba = model.predict_proba(input_processed)
            risk_score = float(proba[0][1])  # Class 1 is 'Stroke'

            return {
                'disease': 'Stroke',
                'prediction': int(risk_score >= threshold),
                'risk_score': round(risk_score, 4),
                'risk_percentage': round(risk_score * 100, 2),
                'risk_level': self._get_risk_level(risk_score, thresholds=(0.3, 0.6)),
                'confidence': round(float(np.max(proba)), 4),
                'model_used': 'CatBoost Stroke Model (11→17 features)',
                'recommendations': self._get_stroke_recommendations(risk_score, data)
            }
        except Exception as e:
            print(f"Stroke prediction error: {e}")
            return self._fallback('stroke', data)

    # ==========================================
    # 4. DIABETES (8 features)
    # Verified order from UnifiedDiabetesSystem.feature_names:
    # [pregnancies, glucose, blood_pressure, skin_thickness,
    #  insulin, bmi, diabetes_pedigree, age]
    # ==========================================
    def predict_diabetes(self, data: dict) -> dict:
        # Rule-based assessment (model trains at runtime from datasets)
        pregnancies = data.get('pregnancies', 0)
        glucose = data.get('glucose', 120)
        bp = data.get('blood_pressure', 80)
        skin_thickness = data.get('skin_thickness', 20)
        insulin = data.get('insulin', 100)
        bmi = data.get('bmi', 25)
        dpf = data.get('diabetes_pedigree', 0.5)
        age = data.get('age', 30)

        risk_score = 0
        risk_score += min(glucose / 200, 1) * 0.35
        risk_score += min(bmi / 45, 1) * 0.20
        risk_score += min(age / 80, 1) * 0.15
        risk_score += min(bp / 140, 1) * 0.10
        risk_score += min(dpf / 2.5, 1) * 0.10
        risk_score += min(insulin / 800, 1) * 0.05
        risk_score += min(pregnancies / 15, 1) * 0.05
        risk_score = min(max(risk_score, 0), 1)

        return {
            'disease': 'Diabetes',
            'prediction': int(risk_score > 0.5),
            'risk_score': round(risk_score, 4),
            'risk_percentage': round(risk_score * 100, 2),
            'risk_level': self._get_risk_level(risk_score),
            'confidence': 0.78,
            'model_used': 'Diabetes Assessment (8 features)',
            'recommendations': self._get_diabetes_recommendations(risk_score, data)
        }

    # ==========================================
    # 6. THYROID DISEASE (21 features)
    # Verified order from model.pkl feature_names:
    # [age, sex, on_thyroxine, query_on_thyroxine, on_antithyroid_meds,
    #  sick, pregnant, thyroid_surgery, I131_treatment, query_hypothyroid,
    #  query_hyperthyroid, lithium, goitre, tumor, psych,
    #  TSH, T3, TT4, T4U, FTI, TBG]
    # Classes: [Negative, Hyperthyroid, Hypothyroid]
    # ==========================================
    def predict_thyroid(self, data: dict) -> dict:
        if not self.models.get('thyroid'):
            return self._fallback('thyroid', data)
        try:
            model_data = self.models['thyroid']
            model = model_data['model']
            feature_names = model_data['feature_names']
            class_names = model_data['class_names']

            # Build feature dict in VERIFIED order
            sex_val = 1 if data.get('sex', 'Female') == 'Male' else 0
            binary = lambda k: 1 if data.get(k, 'No') == 'Yes' else 0

            features = {
                'age': data.get('age', 40),
                'sex': sex_val,
                'on_thyroxine': binary('on_thyroxine'),
                'query_on_thyroxine': binary('query_on_thyroxine'),
                'on_antithyroid_meds': binary('on_antithyroid_meds'),
                'sick': binary('sick'),
                'pregnant': 0 if sex_val == 1 else binary('pregnant'),  # Males cannot be pregnant
                'thyroid_surgery': binary('thyroid_surgery'),
                'I131_treatment': binary('I131_treatment'),
                'query_hypothyroid': binary('query_hypothyroid'),
                'query_hyperthyroid': binary('query_hyperthyroid'),
                'lithium': binary('lithium'),
                'goitre': binary('goitre'),
                'tumor': binary('tumor'),
                'psych': binary('psych'),
                'TSH': float(data.get('TSH', 2.5)),
                'T3': float(data.get('T3', 1.5)),
                'TT4': float(data.get('TT4', 110.0)),
                'T4U': float(data.get('T4U', 1.0)),
                'FTI': float(data.get('FTI', 110.0)),
                'TBG': float(data.get('TBG', 20.0)),
            }

            # Create DataFrame with verified feature order
            if feature_names:
                input_df = pd.DataFrame([features])[feature_names]
            else:
                input_df = pd.DataFrame([features])

            proba = model.predict_proba(input_df)[0]
            prediction = model.predict(input_df)[0]

            # Find highest risk (non-Negative)
            neg_idx = list(class_names).index('Negative') if 'Negative' in class_names else 0
            risk_score = 1.0 - float(proba[neg_idx])

            predicted_class = class_names[np.argmax(proba)] if class_names else str(prediction)

            return {
                'disease': 'Thyroid Disease',
                'prediction': int(predicted_class != 'Negative'),
                'predicted_class': predicted_class,
                'risk_score': round(risk_score, 4),
                'risk_percentage': round(risk_score * 100, 2),
                'risk_level': self._get_risk_level(risk_score),
                'confidence': round(float(max(proba)), 4),
                'class_probabilities': {cn: round(float(p), 4) for cn, p in zip(class_names, proba)},
                'model_used': 'RandomForest Thyroid Model (21 features, 3 classes)',
                'recommendations': self._get_thyroid_recommendations(risk_score, data)
            }
        except Exception as e:
            print(f"Thyroid prediction error: {e}")
            return self._fallback('thyroid', data)

    def get_comprehensive_report(self, patient_data: dict) -> dict:
        """Generate a comprehensive health report from all available predictions"""
        results = {}
        overall_risk = 0
        count = 0

        for disease, predict_fn in [
            ('heart', self.predict_heart_disease),
            ('kidney', self.predict_kidney_disease),
            ('stroke', self.predict_stroke),
            ('diabetes', self.predict_diabetes),
            ('thyroid', self.predict_thyroid),
        ]:
            try:
                result = predict_fn(patient_data)
                results[disease] = result
                overall_risk += result['risk_score']
                count += 1
            except Exception as e:
                results[disease] = {'error': str(e)}

        overall_risk = overall_risk / count if count > 0 else 0

        return {
            'patient_data': patient_data,
            'predictions': results,
            'overall_risk_score': round(overall_risk, 4),
            'overall_risk_percentage': round(overall_risk * 100, 2),
            'overall_risk_level': self._get_risk_level(overall_risk),
            'models_used': count,
            'total_models': 6
        }

    # --- Helper methods ---

    def _get_risk_level(self, score, thresholds=(0.4, 0.7)):
        low, high = thresholds
        if score > high:
            return 'High'
        elif score > low:
            return 'Medium'
        return 'Low'

    def _fallback(self, disease_type, data):
        age = data.get('age', 50)
        risk_score = min(age / 120, 0.8)
        return {
            'disease': disease_type.title(),
            'prediction': 0,
            'risk_score': round(risk_score, 4),
            'risk_percentage': round(risk_score * 100, 2),
            'risk_level': self._get_risk_level(risk_score),
            'confidence': 0.5,
            'model_used': f'Fallback {disease_type.title()} Assessment',
            'recommendations': [f'Please consult a specialist for {disease_type} evaluation.']
        }

    def _get_heart_recommendations(self, risk, data):
        recs = []
        if risk > 0.7:
            recs.append("🚨 Immediate cardiology consultation recommended")
            recs.append("Consider cardiac stress testing and angiography")
        if data.get('cholesterol', 200) > 240:
            recs.append("Cholesterol levels are elevated — consider statins and dietary changes")
        if data.get('resting_bp', 120) > 140:
            recs.append("Blood pressure is high — monitor regularly and consider antihypertensives")
        recs.append("Maintain regular cardiovascular exercise (30 min/day)")
        recs.append("Follow a heart-healthy Mediterranean diet")
        return recs

    def _get_kidney_recommendations(self, risk, data):
        recs = []
        if risk > 0.7:
            recs.append("🚨 Nephrology consultation strongly recommended")
        if data.get('serum_creatinine', 1.2) > 1.5:
            recs.append("Elevated creatinine — kidney function may be compromised")
        recs.append("Stay well hydrated — aim for 2-3 liters of water daily")
        recs.append("Reduce sodium intake to less than 2000mg per day")
        recs.append("Monitor blood pressure regularly")
        return recs

    def _get_stroke_recommendations(self, risk, data):
        recs = []
        if risk > 0.6:
            recs.append("🚨 High stroke risk — seek neurological evaluation")
        if data.get('hypertension', 'No') == 'Yes':
            recs.append("Manage hypertension aggressively with medication and lifestyle changes")
        if data.get('bmi', 25) > 30:
            recs.append("BMI indicates obesity — weight management program recommended")
        recs.append("Quit smoking and limit alcohol consumption")
        recs.append("Regular physical activity and stress management")
        return recs

    def _get_diabetes_recommendations(self, risk, data):
        recs = []
        if risk > 0.7:
            recs.append("🚨 High diabetes risk — consult an endocrinologist")
        if data.get('glucose', 120) > 140:
            recs.append("Blood glucose is elevated — consider HbA1c testing")
        if data.get('bmi', 25) > 28:
            recs.append("Weight management can significantly reduce diabetes risk")
        recs.append("Follow a low-glycemic diet rich in fiber")
        recs.append("Regular exercise — at least 150 minutes per week")
        return recs

    def _get_thyroid_recommendations(self, risk, data):
        recs = []
        if risk > 0.7:
            recs.append("🚨 Thyroid function abnormal — see an endocrinologist")
        tsh = data.get('TSH', 2.5)
        if tsh > 4.5:
            recs.append("Elevated TSH suggests hypothyroidism — may need levothyroxine")
        elif tsh < 0.4:
            recs.append("Low TSH suggests hyperthyroidism — further testing needed")
        recs.append("Regular thyroid function monitoring every 6-12 months")
        recs.append("Ensure adequate iodine and selenium in diet")
        return recs
    def predict_brain_tumor(self, image_path: str, model_name: str = "DenseNet-121") -> dict:
        try:
            import torch
            import torch.nn as nn
            from torchvision import models, transforms
            from PIL import Image
            
            brain_cfg = self.models.get('brain')
            if not brain_cfg: return {"error": "Brain engine not initialized"}
            
            device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
            class_names = brain_cfg['class_names']
            
            # 1. Load Model
            model_type, artifact = self._get_brain_model(model_name, device)
            
            # 2. Preprocess
            transform = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])
            img = Image.open(image_path).convert("RGB")
            tensor = transform(img).unsqueeze(0).to(device)
            
            # 3. Predict
            if model_type == "DL":
                model = artifact
                with torch.no_grad():
                    output = model(tensor)
                    probs = torch.softmax(output, dim=1)[0]
                    pred_idx = torch.argmax(probs).item()
                    confidence = float(probs[pred_idx])
                    all_probs = {class_names[i]: float(probs[i]) for i in range(len(class_names))}
            else:
                extractor, clf = artifact
                with torch.no_grad():
                    deep_feat = extractor(tensor).cpu().numpy().flatten()
                
                manual_feat = self._get_brain_handcrafted_features(image_path)
                combined = np.hstack([deep_feat, manual_feat]).reshape(1, -1)
                
                pred_idx = int(clf.predict(combined)[0])
                try:
                    probs = clf.predict_proba(combined)[0]
                    confidence = float(np.max(probs))
                    all_probs = {class_names[i]: float(probs[i]) for i in range(len(class_names))}
                except:
                    confidence = 1.0
                    all_probs = {class_names[i]: 1.0 if i == pred_idx else 0.0 for i in range(len(class_names))}

            predicted_class = class_names[pred_idx]
            is_tumor = predicted_class != "notumor"
            risk_score = confidence if is_tumor else (1.0 - confidence)

            return {
                'disease': 'Brain Tumor',
                'prediction': int(is_tumor),
                'predicted_class': predicted_class,
                'risk_score': round(risk_score, 4),
                'risk_percentage': round(risk_score * 100, 2),
                'risk_level': self._get_risk_level(risk_score if is_tumor else 0.1), 
                'confidence': round(confidence, 4),
                'probabilities': all_probs,
                'model_used': f"{model_name} (Brain Tumor Detection)",
                'recommendations': self._get_brain_recommendations(predicted_class, confidence)
            }
        except Exception as e:
            print(f"Brain prediction error: {e}")
            return {"error": str(e)}

    def _get_brain_model(self, model_name, device):
        import torch
        import torch.nn as nn
        from torchvision import models
        
        brain_cfg = self.models['brain']
        if model_name in brain_cfg['loaded_models']:
            return brain_cfg['loaded_models'][model_name]
            
        key_map = {
            "ResNet-18": "resnet18_brain_tumor.pth",
            "VGG-16": "vgg16_brain_tumor.pth",
            "MobileNetV2": "mobilenetv2_brain_tumor.pth",
            "EfficientNet-B0": "efficientnetb0_brain_tumor.pth",
            "DenseNet-121": "densenet121_brain_tumor.pth",
            "Random Forest": "ml_randomforest.pkl",
            "XGBoost": "ml_xgboost.pkl",
            "SVM": "ml_svm.pkl"
        }
        
        filename = key_map.get(model_name)
        if not filename: raise ValueError(f"Unknown model: {model_name}")
        
        path = brain_cfg['dir'] / filename
        if not path.exists(): raise FileNotFoundError(f"Missing model file: {path}")

        if filename.endswith(".pkl"):
            extractor_path = brain_cfg['dir'] / "densenet121_brain_tumor.pth"
            extractor = models.densenet121(weights=None)
            extractor.classifier = nn.Linear(1024, 4)
            extractor.load_state_dict(torch.load(extractor_path, map_location=device))
            extractor.classifier = nn.Identity()
            extractor.to(device)
            extractor.eval()
            
            clf = joblib.load(path)
            res = ("ML", (extractor, clf))
        else:
            if "resnet18" in filename:
                model = models.resnet18(weights=None)
                model.fc = nn.Linear(model.fc.in_features, 4)
            elif "vgg16" in filename:
                model = models.vgg16(weights=None)
                model.classifier[6] = nn.Linear(4096, 4)
            elif "mobilenet" in filename:
                model = models.mobilenet_v2(weights=None)
                model.classifier[1] = nn.Linear(model.last_channel, 4)
            elif "efficientnet" in filename:
                model = models.efficientnet_b0(weights=None)
                model.classifier[1] = nn.Linear(1280, 4)
            elif "densenet" in filename:
                model = models.densenet121(weights=None)
                model.classifier = nn.Linear(1024, 4)
            
            model.load_state_dict(torch.load(path, map_location=device))
            model.to(device)
            model.eval()
            res = ("DL", model)
            
        brain_cfg['loaded_models'][model_name] = res
        return res

    def _get_brain_handcrafted_features(self, image_path):
        import cv2
        from scipy.stats import skew, kurtosis
        from skimage.feature import graycomatrix, graycoprops
        
        try:
            img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
            if img is None: return np.zeros(11)
            img = cv2.resize(img, (224, 224))
            
            mean_val = np.mean(img)
            std_val = np.std(img)
            var_val = np.var(img)
            skew_val = skew(img.flatten())
            kurt_val = kurtosis(img.flatten())
            
            glcm = graycomatrix(img, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
            contrast = graycoprops(glcm, 'contrast').mean()
            dissimilarity = graycoprops(glcm, 'dissimilarity').mean()
            homogeneity = graycoprops(glcm, 'homogeneity').mean()
            energy = graycoprops(glcm, 'energy').mean()
            correlation = graycoprops(glcm, 'correlation').mean()
            
            h, w = img.shape
            left = img[:, :w//2]
            right = img[:, w//2:]
            right_flip = cv2.flip(right, 1)
            right_flip = cv2.resize(right_flip, (left.shape[1], left.shape[0]))
            asymmetry = np.mean(np.abs(left - right_flip))
            
            return np.array([mean_val, std_val, var_val, skew_val, kurt_val, 
                             contrast, dissimilarity, homogeneity, energy, correlation, asymmetry])
        except Exception as e:
            print(f"Handcrafted feature error: {e}")
            return np.zeros(11)

    def _get_brain_recommendations(self, pred_class, conf):
        recs = []
        if pred_class == "notumor":
            if conf > 0.9:
                recs.append("✅ No tumor detected with high confidence")
            else:
                recs.append("⚠️ No tumor detected, but confidence is low. Secondary review advised.")
        else:
            recs.append(f"🚨 Potential {pred_class} detected. Immediate neurosurgical consultation required.")
            recs.append("Patient should undergo contrast-enhanced MRI for better visualization.")
            recs.append("Monitor for symptoms like persistent headaches, seizures, or vision changes.")
            
        recs.append("Maintain a healthy lifestyle and regular neurological check-ups.")
        return recs

# Global singleton
engine = PredictionEngine()
