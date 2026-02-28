# 🧬 ICCIP — Model Inputs Reference Document
> Complete specification of all trained ML models, their expected inputs, encoding, and data types.

> ✅ **VERIFIED** — All feature names and orders below were extracted directly from the model `.pkl`/`.joblib` files using `model.feature_names_in_`, `model_columns.pkl`, and `preprocessor.feature_names_in_` on 2026-02-27.

---

## 1. 🫀 Heart Disease Prediction

| Property | Detail |
|----------|--------|
| **Model File** | `xgboost_model.pkl` |
| **Algorithm** | XGBoost Classifier |
| **Total Inputs** | 13 raw features + 4 engineered = **17 features** |
| **Output** | Binary (0 = No Heart Disease, 1 = Heart Disease) |

### Raw Features (13)

| # | Feature Name | Type | Range / Values | Encoding |
|---|-------------|------|----------------|----------|
| 1 | `age` | Numeric | 1–120 | As-is |
| 2 | `sex` | Categorical | Male, Female | Male=1, Female=0 |
| 3 | `cp` (Chest Pain Type) | Categorical | Typical Angina, Atypical Angina, Non-anginal Pain, Asymptomatic | 0, 1, 2, 3 |
| 4 | `trestbps` (Resting BP) | Numeric | 50–250 mmHg | As-is |
| 5 | `chol` (Cholesterol) | Numeric | 100–600 mg/dL | As-is |
| 6 | `fbs` (Fasting Blood Sugar > 120) | Binary | No, Yes | No=0, Yes=1 |
| 7 | `restecg` (Resting ECG) | Categorical | Normal, ST-T Wave Abnormality, Left Ventricular Hypertrophy | 0, 1, 2 |
| 8 | `thalach` (Max Heart Rate) | Numeric | 60–220 | As-is |
| 9 | `exang` (Exercise Induced Angina) | Binary | No, Yes | No=0, Yes=1 |
| 10 | `oldpeak` (ST Depression) | Numeric | 0.0–10.0 | As-is |
| 11 | `slope` (Slope of Peak ST) | Categorical | Upsloping, Flat, Downsloping | 0, 1, 2 |
| 12 | `ca` (Number of Major Vessels) | Numeric | 0, 1, 2, 3 | As-is |
| 13 | `thal` (Thalassemia) | Categorical | Unknown, Normal, Fixed Defect, Reversible Defect | 0, 1, 2, 3 |

### Engineered Features (4)

| # | Feature | Formula |
|---|---------|---------|
| 14 | `thalach_age_ratio` | `thalach / age` |
| 15 | `trestbps_chol_interaction` | `trestbps * chol` |
| 16 | `age_squared` | `age ** 2` |
| 17 | `chol_squared` | `chol ** 2` |

### Input Array Order
```
[age, sex, cp, trestbps, chol, fbs, restecg, thalach, exang, oldpeak, slope, ca, thal, thalach_age_ratio, trestbps_chol_interaction, age_squared, chol_squared]
```
> ✅ **Verified** from `model.feature_names_in_` — 17 features in this exact order.

---

## 2. 🫘 Kidney Disease (CKD) Prediction

| Property | Detail |
|----------|--------|
| **Model File** | `tabular_model.joblib` |
| **Algorithm** | Tabular ML Model (Random Forest pipeline) |
| **Total Inputs** | **24 raw features** (14 numerical + 10 categorical, one-hot encoded to match `model_columns.pkl`) |
| **Output** | Binary (`ckd` = Chronic Kidney Disease, `notckd` = No CKD) |

### Numerical Features (14)

| # | Feature | Description | Range | Unit |
|---|---------|-------------|-------|------|
| 1 | `age` | Patient age | 1–100 | years |
| 2 | `bp` | Blood Pressure (diastolic) | 40–200 | mm/Hg |
| 3 | `sg` | Specific Gravity | 1.005, 1.010, 1.015, 1.020, 1.025 | — |
| 4 | `al` | Albumin | 0, 1, 2, 3, 4, 5 | — |
| 5 | `su` | Sugar | 0, 1, 2, 3, 4, 5 | — |
| 6 | `bgr` | Blood Glucose Random | 50–500 | mgs/dL |
| 7 | `bu` | Blood Urea | 1–400 | mgs/dL |
| 8 | `sc` | Serum Creatinine | 0.1–80 | mgs/dL |
| 9 | `sod` | Sodium | 100–180 | mEq/L |
| 10 | `pot` | Potassium | 2–10 | mEq/L |
| 11 | `hemo` | Haemoglobin | 3–20 | gms |
| 12 | `pcv` | Packed Cell Volume | 10–60 | — |
| 13 | `wc` | White Blood Cell Count | 2000–30000 | cells/cumm |
| 14 | `rc` | Red Blood Cell Count | 2–9 | millions/cmm |

### Categorical Features (10, one-hot encoded)

| # | Feature | Options | One-Hot Column Created |
|---|---------|---------|----------------------|
| 15 | `rbc` | normal, abnormal | `rbc_normal` |
| 16 | `pc` (Pus Cell) | normal, abnormal | `pc_normal` |
| 17 | `pcc` (Pus Cell Clumps) | notpresent, present | `pcc_present` |
| 18 | `ba` (Bacteria) | notpresent, present | `ba_present` |
| 19 | `htn` (Hypertension) | no, yes | `htn_yes` |
| 20 | `dm` (Diabetes Mellitus) | no, yes | `dm_yes` |
| 21 | `cad` (Coronary Artery Disease) | no, yes | `cad_yes` |
| 22 | `appet` (Appetite) | good, poor | `appet_poor` |
| 23 | `pe` (Pedal Edema) | no, yes | `pe_yes` |
| 24 | `ane` (Anaemia) | no, yes | `ane_yes` |

> ✅ **Verified** from `model_columns.pkl` — 24 columns in this exact order.

### Encoding Note
The model uses `model_columns.pkl` which contains the exact column order after one-hot encoding. All 14 numerical features stay as-is; categorical features are one-hot encoded (e.g., `rbc_normal=1` if rbc is normal, else 0). Columns not present default to 0.

---

## 3. 🧠 Stroke Risk Prediction

| Property | Detail |
|----------|--------|
| **Model File** | `catboost_model.pkl` + `preprocessor.pkl` + `feature_columns.pkl` |
| **Algorithm** | CatBoost Classifier with ColumnTransformer preprocessor |
| **Total Inputs** | **11 features** (6 numerical + 5 categorical) — includes `id` column |
| **Preprocessor Output** | 17 features after one-hot encoding |
| **Output** | Binary (0 = No Stroke Risk, 1 = Stroke Risk) |

### Preprocessor Input Features (11) — exact order from `preprocessor.feature_names_in_`

| # | Feature | Type | Values / Range | Encoding |
|---|---------|------|----------------|----------|
| 0 | `id` | Numeric | Patient ID | Passed through (can be 0) |
| 1 | `gender` | Categorical | Male, Female, Other | One-hot by preprocessor |
| 2 | `age` | Numeric | 1–100 | Scaled by preprocessor |
| 3 | `hypertension` | Binary | 0, 1 | Scaled by preprocessor |
| 4 | `heart_disease` | Binary | 0, 1 | Scaled by preprocessor |
| 5 | `ever_married` | Categorical | No, Yes | One-hot by preprocessor |
| 6 | `work_type` | Categorical | Private, Self-employed, Govt_job, Never_worked, children | One-hot by preprocessor |
| 7 | `Residence_type` | Categorical | Urban, Rural | One-hot by preprocessor |
| 8 | `avg_glucose_level` | Numeric | 50–300 | Scaled by preprocessor |
| 9 | `bmi` | Numeric | 10–50 | Scaled by preprocessor |
| 10 | `smoking_status` | Categorical | formerly smoked, never smoked, smokes, Unknown | One-hot by preprocessor |

### Preprocessor Output Features (17) — after ColumnTransformer
```
num__id, num__age, num__hypertension, num__heart_disease, num__avg_glucose_level, num__bmi,
cat__gender_Male, cat__gender_Other, cat__ever_married_Yes,
cat__work_type_Never_worked, cat__work_type_Private, cat__work_type_Self-employed, cat__work_type_children,
cat__Residence_type_Urban,
cat__smoking_status_formerly smoked, cat__smoking_status_never smoked, cat__smoking_status_smokes
```

### Input DataFrame Column Order (MUST match this exactly)
```python
["id", "gender", "age", "hypertension", "heart_disease",
 "ever_married", "work_type", "Residence_type",
 "avg_glucose_level", "bmi", "smoking_status"]
```
> ✅ **Verified** from `preprocessor.feature_names_in_` — 11 features in this exact order.
> ⚠️ `Residence_type` has capital 'R'. `id` column must be present (can be any int value like 0).
> ⚠️ `work_type` also accepts `children` value (in training data). `gender` also accepts `Other`.

### Processing Pipeline
1. Binary fields (hypertension, heart_disease) are encoded as 0/1 before passing.
2. The `preprocessor.pkl` (ColumnTransformer) handles categorical encoding internally.
3. The `feature_columns.pkl` stores the exact feature order post-transformation.

---

## 4. 🩸 Diabetes Prediction

| Property | Detail |
|----------|--------|
| **Model File** | `unified_diabetes_model.pkl` + `unified_scaler.pkl` (trains at runtime from PIMA/Frankfurt/Iraqi datasets via `unified_diabetes_system.py`) |
| **Algorithm** | GradientBoostingClassifier (n_estimators=200, max_depth=4) |
| **Total Inputs** | **8 features** |
| **Output** | Risk Level (Low / Medium / High) + Probability |

### Features (8)

| # | Feature | Type | Range | Unit |
|---|---------|------|-------|------|
| 1 | `pregnancies` | Numeric | 0–20 | count |
| 2 | `glucose` | Numeric | 0–300 | mg/dL |
| 3 | `blood_pressure` | Numeric | 0–200 | mmHg |
| 4 | `skin_thickness` | Numeric | 0–100 | mm |
| 5 | `insulin` | Numeric | 0–900 | μU/mL |
| 6 | `bmi` | Numeric | 10–60 | kg/m² |
| 7 | `diabetes_pedigree` | Numeric | 0.0–3.0 | function value |
| 8 | `age` | Numeric | 1–120 | years |

### Input Dictionary Format
```python
{
    'pregnancies': int,
    'glucose': int,
    'blood_pressure': int,
    'skin_thickness': int,
    'insulin': int,
    'bmi': float,
    'diabetes_pedigree': float,
    'age': int
}
```
> ✅ **Verified** from `UnifiedDiabetesSystem.feature_names` in `unified_diabetes_system.py` (line 34–37) — 8 features in this exact order. Uses StandardScaler normalization.

---

## 5. 🫁 Liver Disease Prediction

| Property | Detail |
|----------|--------|
| **Model File** | Trains at runtime from `indian_liver_patient.csv` (auto-selects best model) |
| **Algorithm** | Best of: Logistic Regression, Random Forest, SVM, XGBoost, Neural Net |
| **Total Inputs** | **10 features** (target column `Dataset` is excluded) |
| **Output** | Binary (0 = Healthy Liver, 1 = Liver Disease) |

### Features (10)

| # | Feature | Type | Range | Unit |
|---|---------|------|-------|------|
| 1 | `Age` | Numeric | 1–100 | years |
| 2 | `Gender` | Binary | Male, Female | Male=1, Female=0 (LabelEncoder) |
| 3 | `Total_Bilirubin` | Numeric | 0.1–50.0 | mg/dL |
| 4 | `Direct_Bilirubin` | Numeric | 0.1–30.0 | mg/dL |
| 5 | `Alkaline_Phosphotase` | Numeric | 10–2000 | IU/L |
| 6 | `Alamine_Aminotransferase` | Numeric | 10–2000 | IU/L |
| 7 | `Aspartate_Aminotransferase` | Numeric | 10–2000 | IU/L |
| 8 | `Total_Protiens` | Numeric | 1.0–10.0 | g/dL |
| 9 | `Albumin` | Numeric | 1.0–6.0 | g/dL |
| 10 | `Albumin_and_Globulin_Ratio` | Numeric | 0.1–3.0 | ratio |

### Input DataFrame Column Order
```python
['Age', 'Gender', 'Total_Bilirubin', 'Direct_Bilirubin',
 'Alkaline_Phosphotase', 'Alamine_Aminotransferase',
 'Aspartate_Aminotransferase', 'Total_Protiens', 'Albumin',
 'Albumin_and_Globulin_Ratio']
```
> **Note:** Data is StandardScaler-normalized before prediction.
> ✅ **Verified** from `indian_liver_patient.csv` column headers — 10 input features (11 columns minus `Dataset` target). Gender is LabelEncoded (Female=0, Male=1).

---

## 6. 🦋 Thyroid Disease Prediction

| Property | Detail |
|----------|--------|
| **Model File** | `model.pkl` (loaded via `src/loader.py`) |
| **Algorithm** | RandomForestClassifier (98.17% accuracy) |
| **Model Storage** | Stored as a **dict**: `{model, feature_names, class_names}` |
| **Total Inputs** | **21 features** (7 numerical + 14 binary) |
| **Output** | Multi-class (3 classes): **Negative**, **Hyperthyroid**, **Hypothyroid** |

### Numerical Features (7)

| # | Feature | Type | Range | Unit |
|---|---------|------|-------|------|
| 1 | `age` | Numeric | 0–120 | years |
| 2 | `TSH` | Numeric | 0.0–600+ | mIU/L |
| 3 | `T3` | Numeric | 0.0–10+ | ng/dL |
| 4 | `TT4` | Numeric | 0–600+ | μg/dL |
| 5 | `T4U` | Numeric | 0.0–3.0 | ratio |
| 6 | `FTI` | Numeric | 0–600+ | index |
| 7 | `TBG` | Numeric | 0–100+ | μg/dL |

### Binary/Categorical Features (14)

| # | Feature | Options | Encoding |
|---|---------|---------|----------|
| 8 | `sex` | Female, Male | Female=0, Male=1 |
| 9 | `on_thyroxine` | No, Yes | 0, 1 |
| 10 | `query_on_thyroxine` | No, Yes | 0, 1 |
| 11 | `on_antithyroid_meds` | No, Yes | 0, 1 |
| 12 | `sick` | No, Yes | 0, 1 |
| 13 | `pregnant` | No, Yes | 0, 1 |
| 14 | `thyroid_surgery` | No, Yes | 0, 1 |
| 15 | `I131_treatment` | No, Yes | 0, 1 |
| 16 | `query_hypothyroid` | No, Yes | 0, 1 |
| 17 | `query_hyperthyroid` | No, Yes | 0, 1 |
| 18 | `lithium` | No, Yes | 0, 1 |
| 19 | `goitre` | No, Yes | 0, 1 |
| 20 | `tumor` | No, Yes | 0, 1 |
| 21 | `psych` (Psychiatric Symptoms) | No, Yes | 0, 1 |

> ⚠️ **Sex/Pregnant Dependency:** If `sex == 0` (Female), the `pregnant` field is shown and user can select Yes/No. If `sex == 1` (Male), the `pregnant` field is **hidden** on the frontend and forced to `0` on the backend. Males cannot be pregnant.

### Input Dictionary Format
```python
{
    "age": int, "sex": int, "on_thyroxine": int,
    "query_on_thyroxine": int, "on_antithyroid_meds": int,
    "sick": int, "pregnant": int, "thyroid_surgery": int,
    "I131_treatment": int, "query_hypothyroid": int,
    "query_hyperthyroid": int, "lithium": int,
    "goitre": int, "tumor": int, "psych": int,
    "TSH": float, "T3": float, "TT4": float,
    "T4U": float, "FTI": float, "TBG": float
}
```

---

## 7. 🧠 Brain Tumor Classification (Image-based)

| Property | Detail |
|----------|--------|
| **Model File** | `resnet18_brain_tumor.pth` |
| **Algorithm** | ResNet18 (Fine-tuned, Transfer Learning from ImageNet) |
| **Input Type** | **MRI Brain Image** (not tabular data) |
| **Total Inputs** | 1 image (224×224 RGB) |
| **Output** | Multi-class: `glioma`, `meningioma`, `notumor`, `pituitary` |

### Image Preprocessing
```python
1. Load image as PIL (RGB)
2. Resize to 224 × 224
3. Apply ResNet18 default transforms (normalization with ImageNet mean/std)
4. Shape: [1, 3, 224, 224] tensor
```

### Explainability
- **Grad-CAM**: Highlights regions in the MRI that influenced the prediction
- **LIME**: Superpixel-based local explanation
- **Feature Scatter**: Global pixel-level importance visualization

---

## 📊 Summary Table

| Model | # Inputs | Input Type | Algorithm | Accuracy |
|-------|----------|------------|-----------|----------|
| Heart Disease | 17 (13+4 engineered) | Tabular | XGBoost | ~85-90% |
| Kidney Disease (CKD) | 24 (14 num + 10 cat) | Tabular | Random Forest | ~95%+ |
| Stroke Risk | 11 (6 num + 5 cat) → 17 after preprocessing | Tabular | CatBoost | ~95%+ |
| Diabetes | 8 | Tabular | Unified Ensemble | ~85-90% |
| Liver Disease | 10 | Tabular | Best of 5 models | ~75-80% |
| Thyroid Disease | 21 (6 num + 15 binary) | Tabular | Random Forest/GB | ~98% |
| Brain Tumor | 1 MRI image (224×224) | Image | ResNet18 (CNN) | ~91-95% |

---

*Generated for ICCIP Hackathon Project — Last updated: 2026-02-27*
