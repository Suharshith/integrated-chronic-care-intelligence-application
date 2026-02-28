# 🤖 ICCIP — Trained Models Reference

> Complete reference of all trained ML models used in the Integrated Chronic Care Intelligence Platform.  
> Last verified: **2026-02-27**

---

## 📂 Model Files Location

All pre-trained model files are stored in:
```
backend/models/
├── heart/
│   └── xgboost_model.pkl
├── kidney/
│   ├── tabular_model.joblib
│   └── model_columns.pkl
├── stroke/
│   ├── best_stroke_model.pkl
│   └── preprocessor.pkl
└── thyroid/
    └── model.pkl
```

> **Note:** Diabetes and Liver models train at **runtime** from their datasets — no `.pkl` files needed.

---

## 1. 🫀 Heart Disease Model

| Property | Value |
|----------|-------|
| **File** | `backend/models/heart/xgboost_model.pkl` |
| **Format** | Pickle (`.pkl`) |
| **Algorithm** | XGBoost Classifier |
| **Library** | `xgboost` |
| **Input Features** | 17 (13 raw + 4 engineered) |
| **Output** | Binary — `0` (No Heart Disease), `1` (Heart Disease) |
| **Loading Method** | `joblib.load()` |
| **Key Attributes** | `model.feature_names_in_` → returns 17 feature names |
| **Preprocessing** | Manual encoding (categorical → int), manual feature engineering |

### Feature Order (verified from `model.feature_names_in_`)
```python
['age', 'sex', 'cp', 'trestbps', 'chol', 'fbs', 'restecg', 'thalach',
 'exang', 'oldpeak', 'slope', 'ca', 'thal',
 'thalach_age_ratio', 'trestbps_chol_interaction', 'age_squared', 'chol_squared']
```

### Engineered Features (computed in backend)
| Feature | Formula |
|---------|---------|
| `thalach_age_ratio` | `thalach / age` |
| `trestbps_chol_interaction` | `trestbps * chol` |
| `age_squared` | `age ** 2` |
| `chol_squared` | `chol ** 2` |

### How It's Used
```python
model = joblib.load('backend/models/heart/xgboost_model.pkl')
input_df = pd.DataFrame([features], columns=list(model.feature_names_in_))
proba = model.predict_proba(input_df)[0]
risk_score = float(proba[1])  # probability of heart disease
```

---

## 2. 🫘 Kidney Disease Model

| Property | Value |
|----------|-------|
| **File** | `backend/models/kidney/tabular_model.joblib` |
| **Format** | Joblib (`.joblib`) |
| **Columns File** | `backend/models/kidney/model_columns.pkl` |
| **Algorithm** | Random Forest (pipeline) |
| **Library** | `scikit-learn` |
| **Input Features** | 24 (14 numerical + 10 one-hot categorical) |
| **Output** | Class label — `'ckd'` (Chronic Kidney Disease) or `'notckd'` |
| **Loading Method** | `joblib.load()` for model, `joblib.load()` for columns |
| **Key Attributes** | `model.classes_` → `['ckd', 'notckd']` |
| **Preprocessing** | One-hot encoding for categorical features |

### Column Order (verified from `model_columns.pkl`)
```python
['age', 'bp', 'sg', 'al', 'su', 'bgr', 'bu', 'sc', 'sod', 'pot',
 'hemo', 'pcv', 'wc', 'rc',
 'rbc_normal', 'pc_normal', 'pcc_present', 'ba_present',
 'htn_yes', 'dm_yes', 'cad_yes', 'appet_poor', 'pe_yes', 'ane_yes']
```

### Categorical Encoding
| Original Feature | One-Hot Column | Condition |
|-----------------|----------------|-----------|
| Red Blood Cells | `rbc_normal` | `1` if "normal" |
| Pus Cell | `pc_normal` | `1` if "normal" |
| Pus Cell Clumps | `pcc_present` | `1` if "present" |
| Bacteria | `ba_present` | `1` if "present" |
| Hypertension | `htn_yes` | `1` if "yes" |
| Diabetes Mellitus | `dm_yes` | `1` if "yes" |
| Coronary Artery Disease | `cad_yes` | `1` if "yes" |
| Appetite | `appet_poor` | `1` if "poor" |
| Pedal Edema | `pe_yes` | `1` if "yes" |
| Anaemia | `ane_yes` | `1` if "yes" |

### How It's Used
```python
model = joblib.load('backend/models/kidney/tabular_model.joblib')
model_columns = joblib.load('backend/models/kidney/model_columns.pkl')
input_dict = {col: 0 for col in model_columns}  # initialize all to 0
# ... fill numerical and categorical values ...
input_df = pd.DataFrame([input_dict])[model_columns]  # enforce column order
prediction = model.predict(input_df)[0]  # 'ckd' or 'notckd'
proba = model.predict_proba(input_df)[0]
```

---

## 3. 🧠 Stroke Risk Model

| Property | Value |
|----------|-------|
| **Model File** | `backend/models/stroke/best_stroke_model.pkl` |
| **Preprocessor File** | `backend/models/stroke/preprocessor.pkl` |
| **Format** | Pickle (`.pkl`) |
| **Algorithm** | CatBoost Classifier |
| **Library** | `catboost` |
| **Raw Input Features** | 11 (including `id`) |
| **After Preprocessing** | 17 features (one-hot encoded) |
| **Output** | Binary — `0` (No Stroke), `1` (Stroke) |
| **Threshold** | `0.3` (custom, not default 0.5) |
| **Loading Method** | `joblib.load()` for both model and preprocessor |
| **Key Attributes** | `preprocessor.feature_names_in_` → 11 raw feature names |
| **Preprocessing** | ColumnTransformer with OneHotEncoder + StandardScaler |

### Preprocessor Input Order (verified from `preprocessor.feature_names_in_`)
```python
['id', 'gender', 'age', 'hypertension', 'heart_disease', 'ever_married',
 'work_type', 'Residence_type', 'avg_glucose_level', 'bmi', 'smoking_status']
```

> ⚠️ **Note:** `id` is required by the preprocessor but is not used for prediction logic. It is set to `0` in the backend. `Residence_type` has a capital `R`.

### Categorical Values the Preprocessor Expects
| Feature | Possible Values |
|---------|----------------|
| `gender` | Male, Female, Other |
| `ever_married` | Yes, No |
| `work_type` | Private, Self-employed, Govt_job, Never_worked, children |
| `Residence_type` | Urban, Rural |
| `smoking_status` | formerly smoked, never smoked, smokes, Unknown |

### How It's Used
```python
model = joblib.load('backend/models/stroke/best_stroke_model.pkl')
preprocessor = joblib.load('backend/models/stroke/preprocessor.pkl')

input_raw = pd.DataFrame([{...}])  # 11 columns in preprocessor order
input_raw = input_raw[list(preprocessor.feature_names_in_)]  # enforce order
input_processed = preprocessor.transform(input_raw)  # → 17 features
proba = model.predict_proba(input_processed)[0]
risk_score = float(proba[1])
prediction = int(risk_score >= 0.3)  # custom threshold
```

---

## 4. 🩸 Diabetes Prediction Model

| Property | Value |
|----------|-------|
| **File** | ⚡ **Trains at runtime** (no saved .pkl) |
| **Source Code** | `unified_diabetes_system.py` |
| **Data Sources** | PIMA Indian Diabetes + Frankfurt + Iraqi datasets |
| **Algorithm** | GradientBoostingClassifier (n_estimators=200, max_depth=4) |
| **Library** | `scikit-learn` |
| **Input Features** | 8 |
| **Output** | Risk Level — Low / Medium / High + probability |
| **Scaler** | StandardScaler (trained and saved as `unified_scaler.pkl`) |

### Feature Order (verified from `UnifiedDiabetesSystem.feature_names`)
```python
['pregnancies', 'glucose', 'blood_pressure', 'skin_thickness',
 'insulin', 'bmi', 'diabetes_pedigree', 'age']
```

### Feature Details
| # | Feature | Type | Unit |
|---|---------|------|------|
| 1 | `pregnancies` | Integer | count |
| 2 | `glucose` | Float | mg/dL |
| 3 | `blood_pressure` | Integer | mmHg |
| 4 | `skin_thickness` | Integer | mm |
| 5 | `insulin` | Float | μU/mL |
| 6 | `bmi` | Float | kg/m² |
| 7 | `diabetes_pedigree` | Float | function value |
| 8 | `age` | Integer | years |

### How It's Used (in ICCIP backend)
```python
# Currently uses rule-based assessment in prediction_engine.py
# The original system trains at runtime:
# from unified_diabetes_system import UnifiedDiabetesSystem
# system = UnifiedDiabetesSystem()
# result = system.predict(input_array)
```

---

## 5. 🫁 Liver Disease Prediction Model

| Property | Value |
|----------|-------|
| **File** | ⚡ **Trains at runtime** (no saved .pkl) |
| **Dataset** | `indian_liver_patient.csv` (583 rows, 11 columns) |
| **Algorithm** | Best of: Logistic Regression, Random Forest, SVM, XGBoost, Neural Net |
| **Library** | `scikit-learn`, `xgboost` |
| **Input Features** | 10 (target column `Dataset` is excluded) |
| **Output** | Binary — `0` (Healthy Liver), `1` (Liver Disease) |
| **Scaler** | StandardScaler |
| **Gender Encoding** | LabelEncoder (Female=0, Male=1) |

### Feature Order (verified from `indian_liver_patient.csv` columns)
```python
['Age', 'Gender', 'Total_Bilirubin', 'Direct_Bilirubin',
 'Alkaline_Phosphotase', 'Alamine_Aminotransferase',
 'Aspartate_Aminotransferase', 'Total_Protiens',
 'Albumin', 'Albumin_and_Globulin_Ratio']
```

### Feature Details
| # | Feature | Type | Unit |
|---|---------|------|------|
| 1 | `Age` | Integer | years |
| 2 | `Gender` | Categorical | Male=1, Female=0 |
| 3 | `Total_Bilirubin` | Float | mg/dL |
| 4 | `Direct_Bilirubin` | Float | mg/dL |
| 5 | `Alkaline_Phosphotase` | Integer | IU/L |
| 6 | `Alamine_Aminotransferase` | Integer | IU/L |
| 7 | `Aspartate_Aminotransferase` | Integer | IU/L |
| 8 | `Total_Protiens` | Float | g/dL |
| 9 | `Albumin` | Float | g/dL |
| 10 | `Albumin_and_Globulin_Ratio` | Float | ratio |

### How It's Used (in ICCIP backend)
```python
# Currently uses rule-based assessment in prediction_engine.py
# The original system auto-selects the best model at runtime
```

---

## 6. 🦋 Thyroid Disease Model

| Property | Value |
|----------|-------|
| **File** | `backend/models/thyroid/model.pkl` |
| **Format** | Pickle (`.pkl`) — stored as a **Python dict** |
| **Algorithm** | RandomForestClassifier |
| **Library** | `scikit-learn` |
| **Accuracy** | 98.17% |
| **Input Features** | 21 (7 numerical + 14 binary) |
| **Output** | 3 classes — `Negative`, `Hyperthyroid`, `Hypothyroid` |
| **Loading Method** | `joblib.load()` → returns dict |

### Dict Structure
```python
model_data = joblib.load('backend/models/thyroid/model.pkl')
# model_data = {
#     'model': RandomForestClassifier(...),      # the trained model
#     'feature_names': ['age', 'sex', ...],      # 21 feature names
#     'class_names': ['Negative', 'Hyperthyroid', 'Hypothyroid']  # 3 classes
# }
model = model_data['model']
feature_names = model_data['feature_names']
class_names = model_data['class_names']
```

### Feature Order (verified from `model_data['feature_names']`)
```python
['age', 'sex', 'on_thyroxine', 'query_on_thyroxine', 'on_antithyroid_meds',
 'sick', 'pregnant', 'thyroid_surgery', 'I131_treatment', 'query_hypothyroid',
 'query_hyperthyroid', 'lithium', 'goitre', 'tumor', 'psych',
 'TSH', 'T3', 'TT4', 'T4U', 'FTI', 'TBG']
```

### Feature Details
| # | Feature | Type | Values | Encoding |
|---|---------|------|--------|----------|
| 1 | `age` | Numeric | 1–120 | As-is |
| 2 | `sex` | Binary | Female, Male | Female=0, Male=1 |
| 3 | `on_thyroxine` | Binary | No, Yes | 0, 1 |
| 4 | `query_on_thyroxine` | Binary | No, Yes | 0, 1 |
| 5 | `on_antithyroid_meds` | Binary | No, Yes | 0, 1 |
| 6 | `sick` | Binary | No, Yes | 0, 1 |
| 7 | `pregnant` | Binary | No, Yes | 0, 1 |
| 8 | `thyroid_surgery` | Binary | No, Yes | 0, 1 |
| 9 | `I131_treatment` | Binary | No, Yes | 0, 1 |
| 10 | `query_hypothyroid` | Binary | No, Yes | 0, 1 |
| 11 | `query_hyperthyroid` | Binary | No, Yes | 0, 1 |
| 12 | `lithium` | Binary | No, Yes | 0, 1 |
| 13 | `goitre` | Binary | No, Yes | 0, 1 |
| 14 | `tumor` | Binary | No, Yes | 0, 1 |
| 15 | `psych` | Binary | No, Yes | 0, 1 |
| 16 | `TSH` | Numeric | mIU/L | As-is (Normal: 0.4–4.5) |
| 17 | `T3` | Numeric | ng/dL | As-is (Normal: 0.8–2.0) |
| 18 | `TT4` | Numeric | μg/dL | As-is (Normal: 5–12) |
| 19 | `T4U` | Numeric | ratio | As-is (Normal: 0.7–1.2) |
| 20 | `FTI` | Numeric | index | As-is (Normal: 60–160) |
| 21 | `TBG` | Numeric | μg/dL | As-is (Normal: 12–30) |

> ⚠️ **Sex/Pregnant Rule:** If `sex == 1` (Male), `pregnant` is forced to `0` on the backend.

### How It's Used
```python
model_data = joblib.load('backend/models/thyroid/model.pkl')
model = model_data['model']
feature_names = model_data['feature_names']
class_names = model_data['class_names']

input_df = pd.DataFrame([features_dict])[feature_names]  # enforce order
proba = model.predict_proba(input_df)[0]
neg_idx = class_names.index('Negative')
risk_score = 1.0 - float(proba[neg_idx])
predicted_class = class_names[np.argmax(proba)]
```

---

## 📊 Summary Table

| # | Model | Algorithm | File | Features | Output | Status |
|---|-------|-----------|------|----------|--------|--------|
| 1 | 🫀 Heart | XGBoost | `heart/xgboost_model.pkl` | 17 | Binary (0/1) | ✅ Pre-trained |
| 2 | 🫘 Kidney | Random Forest | `kidney/tabular_model.joblib` | 24 | ckd / notckd | ✅ Pre-trained |
| 3 | 🧠 Stroke | CatBoost | `stroke/best_stroke_model.pkl` | 11→17 | Binary (0/1) | ✅ Pre-trained |
| 4 | 🩸 Diabetes | GradientBoosting | _Runtime_ | 8 | Low/Med/High | ⚡ Runtime |
| 5 | 🫁 Liver | Auto-select | _Runtime_ | 10 | Binary (0/1) | ⚡ Runtime |
| 6 | 🦋 Thyroid | RandomForest | `thyroid/model.pkl` | 21 | 3 classes | ✅ Pre-trained |

### Total Files
- **Pre-trained model files:** 6 files (across 4 models)
- **Runtime models:** 2 (Diabetes, Liver — train from datasets each time)
- **All files directory:** `backend/models/`

---

## 🔧 Loading Code Reference

```python
import joblib
from pathlib import Path

MODELS_DIR = Path('backend/models')

# Heart
heart_model = joblib.load(MODELS_DIR / 'heart' / 'xgboost_model.pkl')

# Kidney
kidney_model = joblib.load(MODELS_DIR / 'kidney' / 'tabular_model.joblib')
kidney_columns = joblib.load(MODELS_DIR / 'kidney' / 'model_columns.pkl')

# Stroke
stroke_model = joblib.load(MODELS_DIR / 'stroke' / 'best_stroke_model.pkl')
stroke_preprocessor = joblib.load(MODELS_DIR / 'stroke' / 'preprocessor.pkl')

# Thyroid
thyroid_data = joblib.load(MODELS_DIR / 'thyroid' / 'model.pkl')
thyroid_model = thyroid_data['model']
thyroid_features = thyroid_data['feature_names']
thyroid_classes = thyroid_data['class_names']
```
