import streamlit as st
import torch
import torch.nn as nn
from torchvision import models, transforms
import cv2
import numpy as np
from PIL import Image, ImageOps
import pandas as pd
import matplotlib.pyplot as plt
from matplotlib.colors import ListedColormap
import plotly.express as px
import plotly.graph_objects as go
import os
import json
import joblib
import sys
import asyncio
import hashlib
from scipy.stats import skew, kurtosis
from skimage.feature import graycomatrix, graycoprops
from skimage.segmentation import mark_boundaries
try:
    from lime import lime_image
except Exception:
    lime_image = None
try:
    import shap
except Exception:
    shap = None
import requests

# --- CONFIGURATION & PATHS ---
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = BASE_DIR
METRICS_PATH = os.path.join(BASE_DIR, "model_metrics.json")

# --- PAGE CONFIG ---
st.set_page_config(
    page_title="Brain Tumor Classifier Pro",
    page_icon="🧠",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- CUSTOM CSS (Instagram Theme + Floating Chatbot) ---
st.markdown(
    """
    <style>
    /* Main Background */
    .stApp {
        background: linear-gradient(135deg, #1e1e2f, #252540);
        color: white;
    }
    /* Sidebar */
    [data-testid="stSidebar"] {
        background-color: #161625;
        border-right: 1px solid #333;
    }
    /* Cards */
    .metric-card {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 15px;
        padding: 15px;
        border: 1px solid rgba(255, 255, 255, 0.1);
        margin-bottom: 10px;
    }
    /* Floating Chat Button */
    .float-chat-btn {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background-color: #E1306C;
        color: white;
        padding: 15px;
        border-radius: 50%;
        font-size: 24px;
        box-shadow: 0 4px 15px rgba(225, 48, 108, 0.4);
        z-index: 9999;
        text-decoration: none;
        display: flex;
        align-items: center;
        justify_content: center;
        transition: transform 0.2s;
    }
    .float-chat-btn:hover {
        transform: scale(1.1);
        color: white;
    }
    /* Headers */
    h1, h2, h3 { color: #ffffff !important; }
    p, label { color: #dddddd !important; }
    </style>
    
    <a href="#medical-ai-chatbot" class="float-chat-btn" title="Open Chatbot">💬</a>
    """,
    unsafe_allow_html=True
)

# --- DEVICE ---
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- LABELS ---
class_names = ["glioma", "meningioma", "notumor", "pituitary"]

def call_gemini_chat(user_text, system_text=None):
    api_key = ""
    try:
        api_key = str(st.secrets.get("GEMINI_API_KEY", "")).strip()
    except Exception:
        api_key = ""
    if not api_key:
        api_key = os.getenv("GEMINI_API_KEY", "").strip()

    if not api_key:
        return None, "Missing GEMINI_API_KEY."

    preferred_model = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()

    def _clean_model_name(name: str) -> str:
        name = (name or "").strip()
        if name.startswith("models/"):
            name = name.split("/", 1)[1]
        return name

    def _extract_text(data: dict):
        candidates = data.get("candidates", [])
        if not candidates:
            return None
        parts = candidates[0].get("content", {}).get("parts", [])
        text = "\n".join([p.get("text", "") for p in parts if p.get("text")]).strip()
        return text or None

    prompt = user_text if not system_text else f"{system_text}\n\nUser: {user_text}"
    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "generationConfig": {"temperature": 0.3, "maxOutputTokens": 500},
    }
    headers = {"Content-Type": "application/json"}

    # Try likely models first
    model_candidates = [
        _clean_model_name(preferred_model),
        "gemini-2.0-flash",
        "gemini-2.0-flash-lite",
        "gemini-1.5-flash",
    ]
    model_candidates = [m for i, m in enumerate(model_candidates) if m and m not in model_candidates[:i]]

    errors = []
    for api_ver in ["v1", "v1beta"]:
        for model_name in model_candidates:
            url = f"https://generativelanguage.googleapis.com/{api_ver}/models/{model_name}:generateContent"
            try:
                r = requests.post(url, headers=headers, params={"key": api_key}, json=payload, timeout=45)
                if r.status_code == 404:
                    errors.append(f"{api_ver}/{model_name}: 404")
                    continue
                r.raise_for_status()
                data = r.json()
                text = _extract_text(data)
                if text:
                    return text, None
                errors.append(f"{api_ver}/{model_name}: empty response")
            except Exception as e:
                errors.append(f"{api_ver}/{model_name}: {e}")

    # Dynamic fallback: list available models and try first that supports generateContent
    for api_ver in ["v1", "v1beta"]:
        try:
            list_url = f"https://generativelanguage.googleapis.com/{api_ver}/models"
            lr = requests.get(list_url, params={"key": api_key}, timeout=30)
            if lr.status_code != 200:
                continue
            models_data = lr.json().get("models", [])
            available = []
            for m in models_data:
                methods = m.get("supportedGenerationMethods", [])
                if "generateContent" in methods:
                    name = _clean_model_name(m.get("name", ""))
                    if name.startswith("gemini"):
                        available.append(name)

            for model_name in available:
                url = f"https://generativelanguage.googleapis.com/{api_ver}/models/{model_name}:generateContent"
                try:
                    r = requests.post(url, headers=headers, params={"key": api_key}, json=payload, timeout=45)
                    if r.status_code != 200:
                        continue
                    data = r.json()
                    text = _extract_text(data)
                    if text:
                        return text, None
                except Exception:
                    pass
        except Exception:
            pass

    return None, "Gemini model not found/accessible. Tried: " + " | ".join(errors[-8:])

def get_image_hash(uploaded_file):
    data = uploaded_file.getvalue()
    return hashlib.md5(data).hexdigest()

def get_or_init_xai_cache():
    if "xai_cache" not in st.session_state:
        st.session_state.xai_cache = {}
    return st.session_state.xai_cache

def get_best_model_name(metrics_data):
    if not metrics_data:
        return "DenseNet-121"

    key_to_model = {
        "resnet18": "ResNet-18",
        "vgg16": "VGG-16",
        "mobilenetv2": "MobileNetV2",
        "efficientnetb0": "EfficientNet-B0",
        "densenet121": "DenseNet-121",
        "ml_randomforest": "Random Forest",
        "ml_xgboost": "XGBoost",
        "ml_svm": "SVM"
    }

    best_key = None
    best_acc = -1.0
    for key, value in metrics_data.items():
        acc = float(value.get("accuracy", -1.0))
        if acc > best_acc:
            best_acc = acc
            best_key = key

    return key_to_model.get(best_key, "DenseNet-121")

def summarize_explanation(importance_map):
    if importance_map is None:
        return "No explanation map available."

    m = importance_map.astype(np.float32)
    m = (m - m.min()) / (m.max() - m.min() + 1e-8)
    h, w = m.shape
    center = m[h//4:3*h//4, w//4:3*w//4]
    edges = np.concatenate([
        m[:h//8, :].ravel(),
        m[-h//8:, :].ravel(),
        m[:, :w//8].ravel(),
        m[:, -w//8:].ravel()
    ])

    strong = (m >= np.percentile(m, 90)).mean() * 100.0
    center_mean = float(center.mean())
    edge_mean = float(edges.mean())

    if center_mean > edge_mean * 1.15:
        region_text = "central brain region"
    elif edge_mean > center_mean * 1.15:
        region_text = "peripheral brain region"
    else:
        region_text = "mixed central and peripheral regions"

    return f"Strong evidence covers ~{strong:.1f}% of image, concentrated mainly in the {region_text}."

def get_combined_feature_names(deep_dim=1024):
    handcrafted_names = [
        "mean_intensity", "std_intensity", "var_intensity", "skewness", "kurtosis",
        "glcm_contrast", "glcm_dissimilarity", "glcm_homogeneity",
        "glcm_energy", "glcm_correlation", "hemisphere_asymmetry"
    ]
    deep_names = [f"deep_feat_{i}" for i in range(deep_dim)]
    return deep_names + handcrafted_names

def safe_class_scores(clf, feature_row):
    if hasattr(clf, "predict_proba"):
        try:
            return clf.predict_proba(feature_row)[0]
        except Exception:
            pass

    if hasattr(clf, "decision_function"):
        try:
            scores = clf.decision_function(feature_row)
            if np.ndim(scores) == 1:
                s = np.array(scores, dtype=np.float32)
                s = s - np.min(s)
                denom = np.sum(s) + 1e-8
                return s / denom
            s = np.array(scores[0], dtype=np.float32)
            s = s - np.min(s)
            denom = np.sum(s) + 1e-8
            return s / denom
        except Exception:
            pass

    return None

# --- HELPER: FEATURE EXTRACTION (For ML Models) ---
def get_handcrafted_features(img_cv):
    try:
        if img_cv is None: return np.zeros(11)
        gray = cv2.cvtColor(img_cv, cv2.COLOR_RGB2GRAY)
        gray = cv2.resize(gray, (224, 224))
        
        # Stats
        mean_val = np.mean(gray)
        std_val = np.std(gray)
        var_val = np.var(gray)
        skew_val = skew(gray.flatten())
        kurt_val = kurtosis(gray.flatten())
        
        # Texture (GLCM)
        glcm = graycomatrix(gray, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
        contrast = graycoprops(glcm, 'contrast').mean()
        dissimilarity = graycoprops(glcm, 'dissimilarity').mean()
        homogeneity = graycoprops(glcm, 'homogeneity').mean()
        energy = graycoprops(glcm, 'energy').mean()
        correlation = graycoprops(glcm, 'correlation').mean()
        
        # Symmetry
        h, w = gray.shape
        left = gray[:, :w//2]
        right = gray[:, w//2:]
        right_flip = cv2.flip(right, 1)
        right_flip = cv2.resize(right_flip, (left.shape[1], left.shape[0]))
        asymmetry = np.mean(np.abs(left - right_flip))
        
        return np.array([mean_val, std_val, var_val, skew_val, kurt_val, 
                         contrast, dissimilarity, homogeneity, energy, correlation, asymmetry])
    except:
        return np.zeros(11)

# --- HELPER: IMAGE VALIDATION ---
def is_valid_mri(image_pil):
    """
    Heuristic check: MRIs are mostly grayscale. 
    If an image has high color saturation, it's likely a random photo.
    """
    img_hsv = cv2.cvtColor(np.array(image_pil), cv2.COLOR_RGB2HSV)
    saturation = img_hsv[:, :, 1]
    mean_sat = np.mean(saturation)
    
    # Threshold: Natural images usually have Saturation > 20-30. MRIs are usually < 10.
    if mean_sat > 25: 
        return False, f"Detected High Color Saturation ({mean_sat:.1f}). MRIs are typically grayscale."
    return True, ""

# --- MODEL LOADING LOGIC ---
@st.cache_resource
def load_pipeline(model_name):
    # Map friendly name to file key
    key_map = {
        "ResNet-18": "resnet18", "VGG-16": "vgg16", "MobileNetV2": "mobilenetv2",
        "EfficientNet-B0": "efficientnetb0", "DenseNet-121": "densenet121",
        "Random Forest": "ml_randomforest", "XGBoost": "ml_xgboost", "SVM": "ml_svm"
    }
    file_key = key_map.get(model_name)
    
    # 1. Setup Architecture
    target_layer = None
    model = None
    
    # DL Models
    if model_name == "ResNet-18":
        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, 4)
        target_layer = model.layer4[-1]
    elif model_name == "VGG-16":
        model = models.vgg16(weights=None)
        model.classifier[6] = nn.Linear(4096, 4)
        target_layer = model.features[-1]
    elif model_name == "MobileNetV2":
        model = models.mobilenet_v2(weights=None)
        model.classifier[1] = nn.Linear(model.last_channel, 4)
        target_layer = model.features[-1]
    elif model_name == "EfficientNet-B0":
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(1280, 4)
        target_layer = model.features[-1]
    elif model_name == "DenseNet-121":
        model = models.densenet121(weights=None)
        model.classifier = nn.Linear(1024, 4)
        target_layer = model.features[-1]
    
    # Load Weights (DL)
    if "ml_" not in file_key:
        path = os.path.join(MODELS_DIR, f"{file_key}_brain_tumor.pth")
        if not os.path.exists(path): return None, None, f"File not found: {path}"
        try:
            model.load_state_dict(torch.load(path, map_location=device))
            model.to(device)
            model.eval()
            return "DL", (model, target_layer), None
        except Exception as e: return None, None, str(e)

    # Load Weights (ML)
    else:
        # Load DenseNet Extractor
        ext_path = os.path.join(MODELS_DIR, "densenet121_brain_tumor.pth")
        if not os.path.exists(ext_path): return None, None, "DenseNet backbone missing for ML"
        
        extractor = models.densenet121(weights=None)
        extractor.classifier = nn.Linear(1024, 4)
        extractor.load_state_dict(torch.load(ext_path, map_location=device))
        extractor.classifier = nn.Identity() # Remove head
        extractor.to(device)
        extractor.eval()
        
        # Load ML Model
        ml_path = os.path.join(MODELS_DIR, f"{file_key}.pkl")
        if not os.path.exists(ml_path): return None, None, f"ML file {file_key}.pkl missing"
        
        try:
            clf = joblib.load(ml_path)
        except ModuleNotFoundError as e:
            if "xgboost" in str(e).lower():
                return None, None, "XGBoost is not installed. Install it with: pip install xgboost"
            return None, None, str(e)
        return "ML", (extractor, clf), None

# --- GRAD-CAM & VISUALIZATION ---
def generate_grad_cam_box(model, target_layer, tensor, img_np, class_idx=None, cam_percentile=90, min_area=100, box_shrink=0.9):
    # Grad-CAM Logic
    activations = []; gradients = []
    def forward_hook(module, input, output):
        # Clone to avoid inplace ops on views (DenseNet uses inplace ReLU in forward)
        output_clone = output.clone()
        activations.append(output_clone)
        output_clone.register_hook(lambda grad: gradients.append(grad))
        return output_clone

    h1 = target_layer.register_forward_hook(forward_hook)

    output = model(tensor)
    pred_idx = output.argmax(1).item()
    target_idx = pred_idx if class_idx is None else int(class_idx)
    model.zero_grad()
    output[0, target_idx].backward()

    h1.remove()

    grads = gradients[0].detach().squeeze(0)
    acts = activations[0].detach().squeeze(0)
    weights = torch.mean(grads, dim=(1, 2))

    cam = (weights[:, None, None] * acts).sum(dim=0)
    cam = torch.relu(cam)
    cam = cam.cpu().numpy()
    p_low, p_high = np.percentile(cam, [5, 95])
    cam = (cam - p_low) / (p_high - p_low + 1e-8)
    cam = np.clip(cam, 0, 1)
    
    # Resize CAM to image size
    cam_resized = cv2.resize(cam, (224, 224))
    cam_resized = cv2.GaussianBlur(cam_resized, (5, 5), 0)
    
    # Create Heatmap
    heatmap = cv2.applyColorMap(np.uint8(255 * cam_resized), cv2.COLORMAP_JET)
    overlay = cv2.addWeighted(img_np, 0.55, heatmap, 0.45, 0)
    
    # Create Green Box (Thresholding)
    thresh_val = np.percentile(cam_resized, cam_percentile)
    thresh = (cam_resized >= thresh_val).astype(np.uint8) * 255
    kernel = np.ones((3, 3), np.uint8)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel, iterations=1)
    thresh = cv2.morphologyEx(thresh, cv2.MORPH_CLOSE, kernel, iterations=2)
    contours, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    img_box = img_np.copy()
    if contours:
        # Find largest contour
        c = max(contours, key=cv2.contourArea)
        if cv2.contourArea(c) >= min_area:
            x, y, w, h = cv2.boundingRect(c)
            cx, cy = x + w / 2.0, y + h / 2.0
            w2, h2 = max(1, int(w * box_shrink)), max(1, int(h * box_shrink))
            x2 = max(0, int(cx - w2 / 2))
            y2 = max(0, int(cy - h2 / 2))
            x3 = min(img_box.shape[1] - 1, x2 + w2)
            y3 = min(img_box.shape[0] - 1, y2 + h2)
            cv2.rectangle(img_box, (x2, y2), (x3, y3), (0, 255, 0), 2) # Green Box
        
    return overlay, img_box

def generate_shap_overlay(model, tensor, img_np, class_idx, nsamples=50):
    if shap is None:
        return None, None, "SHAP is not installed."

    model.eval()
    background = torch.zeros_like(tensor)
    try:
        explainer = shap.GradientExplainer(model, background)
        shap_values = explainer.shap_values(tensor, nsamples=nsamples)
    except Exception as e:
        return None, None, str(e)

    if isinstance(shap_values, list):
        sv = np.array(shap_values[int(class_idx)])
    else:
        sv = np.array(shap_values)

    if sv.ndim >= 1 and sv.shape[0] == 1:
        sv = sv[0]

    sv_abs = np.abs(sv)
    if sv_abs.ndim == 3:
        if sv_abs.shape[0] in (1, 3, 4):
            sv_abs = sv_abs.mean(axis=0)
        elif sv_abs.shape[-1] in (1, 3, 4):
            sv_abs = sv_abs.mean(axis=-1)
        else:
            sv_abs = sv_abs.mean(axis=0)
    elif sv_abs.ndim > 3:
        while sv_abs.ndim > 2:
            sv_abs = sv_abs.mean(axis=0)

    if sv_abs.ndim != 2:
        return None, None, f"Unexpected SHAP map shape: {np.array(sv_abs).shape}"

    p_low, p_high = np.percentile(sv_abs, [5, 95])
    sv_abs = (sv_abs - p_low) / (p_high - p_low + 1e-8)
    sv_abs = np.clip(sv_abs, 0, 1)

    sv_resized = cv2.resize(sv_abs.astype(np.float32), (img_np.shape[1], img_np.shape[0]), interpolation=cv2.INTER_LINEAR)
    sv_uint8 = np.ascontiguousarray(np.clip(sv_resized * 255.0, 0, 255).astype(np.uint8))
    if sv_uint8.ndim == 3:
        sv_uint8 = cv2.cvtColor(sv_uint8, cv2.COLOR_BGR2GRAY)

    heatmap = cv2.applyColorMap(sv_uint8, cv2.COLORMAP_TURBO)
    base_img = np.ascontiguousarray(img_np.astype(np.uint8))
    overlay = cv2.addWeighted(base_img, 0.6, heatmap, 0.4, 0)

    return overlay, sv_resized, None

def generate_lime_overlay(model, img_np, class_idx, num_samples=800):
    if lime_image is None:
        return None, None, "LIME is not installed."

    model.eval()

    def classifier_fn(images):
        batch = []
        for im in images:
            pil_im = Image.fromarray(im.astype(np.uint8)).convert("RGB")
            t = transforms.Compose([
                transforms.Resize((224, 224)),
                transforms.ToTensor(),
                transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
            ])(pil_im)
            batch.append(t)

        x = torch.stack(batch).to(device)
        with torch.no_grad():
            out = model(x)
            probs = torch.softmax(out, dim=1).cpu().numpy()
        return probs

    try:
        explainer = lime_image.LimeImageExplainer()
        explanation = explainer.explain_instance(
            img_np.astype(np.double),
            classifier_fn,
            top_labels=4,
            hide_color=0,
            num_samples=num_samples
        )

        lime_img, mask = explanation.get_image_and_mask(
            label=int(class_idx),
            positive_only=True,
            hide_rest=False,
            num_features=8,
            min_weight=0.0
        )

        lime_vis = mark_boundaries(lime_img / 255.0, mask)
        lime_vis = np.uint8(np.clip(lime_vis, 0, 1) * 255)

        importance_map = (mask > 0).astype(np.float32)
        return lime_vis, importance_map, None
    except Exception as e:
        return None, None, str(e)

# ==========================================================
# 🖥️ SIDEBAR: MODEL SELECTION & CHATBOT
# ==========================================================

st.sidebar.title("⚙️ Configuration")

# 1. Load Metrics from JSON
metrics_data = {}
try:
    with open(METRICS_PATH, "r") as f:
        metrics_data = json.load(f)
except Exception as e:
    st.sidebar.error(f"Could not load metrics file. {e}")

# 2. Model Selector (with auto-best by accuracy)
model_options = ["Auto (Best Accuracy)", "DenseNet-121", "ResNet-18", "VGG-16", "MobileNetV2", "EfficientNet-B0", "XGBoost", "Random Forest", "SVM"]
selected_model_ui = st.sidebar.selectbox("Select AI Model", model_options)
best_model_name = get_best_model_name(metrics_data)
selected_model_name = best_model_name if selected_model_ui == "Auto (Best Accuracy)" else selected_model_ui

if selected_model_ui == "Auto (Best Accuracy)":
    st.sidebar.success(f"Auto-selected: {selected_model_name}")

# 3. Show selected model metrics
key_map = {
    "ResNet-18": "resnet18", "VGG-16": "vgg16", "MobileNetV2": "mobilenetv2",
    "EfficientNet-B0": "efficientnetb0", "DenseNet-121": "densenet121",
    "Random Forest": "ml_randomforest", "XGBoost": "ml_xgboost", "SVM": "ml_svm"
}
m_key = key_map.get(selected_model_name)

if m_key and m_key in metrics_data:
    m = metrics_data[m_key]
    st.sidebar.markdown(f"### 📊 Performance ({selected_model_name})")
    c1, c2 = st.sidebar.columns(2)
    c1.metric("Accuracy", f"{m['accuracy']*100:.1f}%")
    c2.metric("F1 Score", f"{m['f1_score']:.2f}")
    st.sidebar.caption(f"AUC-ROC: {m['auc_roc']:.3f}")
    st.sidebar.info(m['description'])
else:
    st.sidebar.warning("Metrics not found for this model.")

# 3. Load Model Pipeline
pipeline_type, artifacts, error = load_pipeline(selected_model_name)
if error: st.error(f"Model Load Error: {error}")

# 3b. Explainability Controls
gradcam_choice = "Predicted"
show_shap = True
show_lime = True
shap_nsamples = 20
lime_samples = 300
enable_heavy_xai = False
if pipeline_type == "DL":
    st.sidebar.markdown("### Explainability")
    gradcam_choice = st.sidebar.selectbox("Grad-CAM class", ["Predicted"] + class_names)
    enable_heavy_xai = st.sidebar.checkbox("Enable SHAP/LIME generation", value=False)
    shap_nsamples = st.sidebar.slider("SHAP samples", min_value=20, max_value=120, value=20, step=10)
    lime_samples = st.sidebar.slider("LIME samples", min_value=300, max_value=2000, value=300, step=100)

# ------------------------------------------------------------------
# 💬 CHATBOT SECTION (PRESERVED & ENHANCED)
# ------------------------------------------------------------------
st.sidebar.markdown("---")
st.sidebar.markdown('<a id="medical-ai-chatbot"></a>', unsafe_allow_html=True)
st.sidebar.title("💬 Medical AI Chatbot")

# Diet Plan Logic (Placeholder for now, dynamic updates later)
if "risk_level" not in st.session_state:
    st.session_state.risk_level = "General"

resource_choice = st.sidebar.selectbox(
    "Resource Center",
    ["Precautions", "Food Recommendations & Plan", "Explainable AI Guide"],
    help="Quick access to supportive information"
)

if resource_choice == "Precautions":
    st.sidebar.info("- Avoid smoking/alcohol.\n- Regular checkups.\n- Report headaches immediately.")
elif resource_choice == "Food Recommendations & Plan":
    # Dynamic Diet Plan based on Risk
    if st.session_state.risk_level == "High":
        st.sidebar.error("⚠️ **Strict Oncology Diet Recommended:**")
        st.sidebar.markdown("- **Focus:** High antioxidant, anti-inflammatory.")
        st.sidebar.markdown("- **Eat:** Berries, leafy greens, turmeric, fatty fish.")
        st.sidebar.markdown("- **Avoid:** All processed sugars, red meat, alcohol.")
    else:
        st.sidebar.success("✅ **Maintenance Diet:**")
        st.sidebar.markdown("- Balanced meals with whole grains and proteins.")
        st.sidebar.markdown("- Stay hydrated.")

else:
    st.sidebar.info("Grad-CAM shows where the model looks. XGBoost uses mathematical texture features.")

user_q = st.sidebar.text_area("Ask Dr. AI:", placeholder="E.g., What are glioma symptoms?")

if st.sidebar.button("Ask AI"):
    if not user_q: st.sidebar.warning("Type a question first.")
    else:
        with st.spinner("Asking Gemini..."):
            try:
                system_prompt = (
                    "You are a medical imaging assistant for brain tumor classification support. "
                    "Give concise, educational responses and do not provide definitive diagnosis."
                )
                ans, err = call_gemini_chat(user_q.strip(), system_prompt)
                if err:
                    st.sidebar.error(f"Gemini API error: {err}")
                else:
                    st.sidebar.markdown(f"**AI:** {ans}")
            except: st.sidebar.error("AI error.")

# ==========================================================
# 🏠 MAIN DASHBOARD
# ==========================================================

st.title("🧠 Brain Tumor Classifier Pro")
st.markdown("Multi-Model Analysis | Deep Learning & Machine Learning")

# Image Upload
uploaded_file = st.file_uploader("Upload MRI Scan", type=["jpg", "png", "jpeg"])

if uploaded_file and artifacts:
    # 1. Load & Validate Image
    image = Image.open(uploaded_file).convert("RGB")
    
    # Validation Check
    is_valid, msg = is_valid_mri(image)
    if not is_valid:
        st.error(f"❌ Invalid Image: {msg}")
        st.image(image, width=200, caption="Uploaded Image")
        st.stop()

    # Layout
    col1, col2 = st.columns([1, 1.5])
    
    with col1:
        st.image(image, caption="Original MRI", use_container_width=True)
    
    # 2. Preprocessing
    transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    tensor = transform(image).unsqueeze(0).to(device)
    img_cv = np.array(image.resize((224, 224)))
    
    # 3. Prediction Pipeline
    
    # --- DEEP LEARNING ---
    if pipeline_type == "DL":
        model, layer = artifacts
        with torch.no_grad():
            output = model(tensor)
            probs = torch.softmax(output, dim=1)
            conf, pred_idx = torch.max(probs, 1)
        
        prediction = class_names[pred_idx.item()]
        confidence = conf.item()
        
        # Visuals (Green Box & Heatmap)
        gradcam_class_idx = None
        if gradcam_choice != "Predicted":
            gradcam_class_idx = class_names.index(gradcam_choice)
        heatmap_img, box_img = generate_grad_cam_box(model, layer, tensor, img_cv, class_idx=gradcam_class_idx)
        gradcam_map = cv2.cvtColor(heatmap_img, cv2.COLOR_RGB2GRAY)

        shap_img = None
        shap_map = None
        shap_error = None
        if show_shap and enable_heavy_xai:
            target_idx = pred_idx.item() if gradcam_class_idx is None else gradcam_class_idx
            image_hash = get_image_hash(uploaded_file)
            cache = get_or_init_xai_cache()
            shap_key = f"shap::{selected_model_name}::{image_hash}::{target_idx}::{shap_nsamples}"
            if shap_key in cache:
                shap_img, shap_map, shap_error = cache[shap_key]
            else:
                with st.spinner("Computing SHAP (this may take a moment)..."):
                    shap_img, shap_map, shap_error = generate_shap_overlay(model, tensor, img_cv, target_idx, nsamples=shap_nsamples)
                cache[shap_key] = (shap_img, shap_map, shap_error)

        lime_img = None
        lime_map = None
        lime_error = None
        if show_lime and enable_heavy_xai:
            target_idx = pred_idx.item() if gradcam_class_idx is None else gradcam_class_idx
            image_hash = get_image_hash(uploaded_file)
            cache = get_or_init_xai_cache()
            lime_key = f"lime::{selected_model_name}::{image_hash}::{target_idx}::{lime_samples}"
            if lime_key in cache:
                lime_img, lime_map, lime_error = cache[lime_key]
            else:
                with st.spinner("Computing LIME (this may take a moment)..."):
                    lime_img, lime_map, lime_error = generate_lime_overlay(model, img_cv, target_idx, num_samples=lime_samples)
                cache[lime_key] = (lime_img, lime_map, lime_error)

    # --- MACHINE LEARNING ---
    else:
        extractor, clf = artifacts
        # Features
        with torch.no_grad(): deep_feat = extractor(tensor).cpu().numpy().flatten()
        manual_feat = get_handcrafted_features(img_cv)
        combined_feat = np.hstack([deep_feat, manual_feat]).reshape(1, -1)
        feature_names = get_combined_feature_names(deep_dim=deep_feat.shape[0])
        class_scores = safe_class_scores(clf, combined_feat)
        
        # Predict
        pred_idx = clf.predict(combined_feat)[0]
        if class_scores is not None:
            confidence = float(np.max(class_scores))
        else:
            confidence = 0.0 # SVM fallback
        
        prediction = class_names[pred_idx]
        
        # ML doesn't have Grad-CAM, show Handcrafted Features instead
        heatmap_img = None
        box_img = img_cv # Just show original
        gradcam_map = None
        shap_img = None
        shap_map = None
        shap_error = None
        lime_img = None
        lime_map = None
        lime_error = None
    
    # 4. Display Results
    with col2:
        st.subheader("Diagnostics Report")
        
        # Color coding
        color = "#FF4B4B" if prediction != "notumor" else "#00CC00"
        
        st.markdown(f"""
        <div style="background-color: rgba(255,255,255,0.05); padding: 20px; border-radius: 10px; border-left: 5px solid {color};">
            <h2 style="margin:0; color: {color};">{prediction.upper()}</h2>
            <p style="margin:0; font-size: 1.1em;">Confidence: <b>{confidence*100:.2f}%</b></p>
        </div>
        """, unsafe_allow_html=True)
        
        # Update Risk for Diet Plan
        st.session_state.risk_level = "High" if prediction != "notumor" else "Low"

        # Explanation Section
        st.markdown("### 🔍 Model Explanation")
        
        if pipeline_type == "DL":
            reason_map = shap_map if shap_map is not None else (lime_map if lime_map is not None else gradcam_map)
            st.success(summarize_explanation(reason_map))

            tab1, tab2, tab3 = st.tabs(["Grad-CAM", "SHAP", "LIME"])
            with tab1:
                st.image(box_img, caption="Tumor target box", use_container_width=True)
                st.image(heatmap_img, caption="Grad-CAM Heatmap", use_container_width=True)
                st.info("Red/Yellow areas show high influence on the decision.")
            with tab2:
                if not enable_heavy_xai:
                    st.info("SHAP is disabled for speed. Enable 'SHAP/LIME generation' in sidebar.")
                elif shap_img is not None:
                    st.image(shap_img, caption="SHAP Overlay", use_container_width=True)
                    st.info("SHAP highlights pixels that push prediction toward this class.")
                else:
                    st.warning(f"SHAP could not be generated. {shap_error}")
            with tab3:
                if not enable_heavy_xai:
                    st.info("LIME is disabled for speed. Enable 'SHAP/LIME generation' in sidebar.")
                elif lime_img is not None:
                    st.image(lime_img, caption="LIME Superpixel Explanation", use_container_width=True)
                    st.info("LIME shows local regions supporting this single prediction.")
                else:
                    st.warning(f"LIME could not be generated. {lime_error}")
                
        else:
            st.info(f"**{selected_model_name}** explanation with real numeric values.")

            ml_tab1, ml_tab2 = st.tabs(["Class Scores", f"{selected_model_name} Diagram"])

            with ml_tab1:
                if class_scores is not None and len(class_scores) == len(class_names):
                    score_df = pd.DataFrame({
                        "Class": class_names,
                        "Score": np.round(class_scores, 6)
                    })
                    fig_scores = px.bar(score_df, x="Class", y="Score", color="Class", title="Per-class model scores")
                    st.plotly_chart(fig_scores, use_container_width=True)
                    st.dataframe(score_df, use_container_width=True)
                else:
                    st.warning("Class score vector is not available for this model.")

            with ml_tab2:
                if selected_model_name in ["Random Forest", "XGBoost"] and hasattr(clf, "feature_importances_"):
                    importances = np.asarray(clf.feature_importances_)
                    top_idx = np.argsort(importances)[-10:][::-1]
                    imp_df = pd.DataFrame({
                        "Feature": [feature_names[i] if i < len(feature_names) else f"feat_{i}" for i in top_idx],
                        "Importance": importances[top_idx],
                        "InputValue": combined_feat[0, top_idx]
                    })
                    fig_imp = px.bar(
                        imp_df,
                        x="Importance",
                        y="Feature",
                        orientation="h",
                        title=f"Top 10 {selected_model_name} Feature Importances"
                    )
                    st.plotly_chart(fig_imp, use_container_width=True)
                    st.dataframe(imp_df, use_container_width=True)
                elif selected_model_name == "SVM":
                    svm_info = {
                        "kernel": getattr(clf, "kernel", "unknown"),
                        "support_vectors": int(getattr(clf, "support_vectors_", np.empty((0, 0))).shape[0])
                    }
                    st.dataframe(pd.DataFrame([svm_info]), use_container_width=True)

                    if hasattr(clf, "decision_function"):
                        try:
                            raw_decision = clf.decision_function(combined_feat)
                            if np.ndim(raw_decision) > 1:
                                decision_vals = np.array(raw_decision[0], dtype=np.float32)
                            else:
                                decision_vals = np.array(raw_decision, dtype=np.float32)

                            if len(decision_vals) == len(class_names):
                                dec_df = pd.DataFrame({"Class": class_names, "DecisionValue": decision_vals})
                                fig_dec = px.bar(dec_df, x="Class", y="DecisionValue", color="Class", title="SVM Decision Function Values")
                                st.plotly_chart(fig_dec, use_container_width=True)
                                st.dataframe(dec_df, use_container_width=True)
                            else:
                                st.write("One-vs-one decision vector:", decision_vals)
                        except Exception as e:
                            st.warning(f"Could not compute SVM decision values: {e}")
                else:
                    st.warning("Model-specific visualization is not available for this model.")

            df_feat = pd.DataFrame({
                "Feature": ["Asymmetry", "Texture Contrast", "Mean Intensity"],
                "Value": [f"{manual_feat[-1]:.4f}", f"{manual_feat[5]:.4f}", f"{manual_feat[0]:.4f}"],
                "Analysis": ["High (Abnormal)" if manual_feat[-1] > 0.2 else "Normal", "-", "-"]
            })
            st.table(df_feat)

# --- METRICS OVERVIEW (Bottom Page) ---
st.markdown("---")
st.subheader("📈 Global Model Metrics")
try:
    with open(METRICS_PATH, "r") as f:
        data = json.load(f)
    
    # Create DataFrame for display
    rows = []
    for k, v in data.items():
        rows.append({
            "Model": k.replace("_", " ").title().replace("Ml ", ""),
            "Accuracy": f"{v['accuracy']*100:.1f}%",
            "Precision": f"{v['precision']:.3f}",
            "Recall": f"{v['recall']:.3f}",
            "F1-Score": f"{v['f1_score']:.3f}"
        })
    st.dataframe(pd.DataFrame(rows), use_container_width=True)

except:
    st.warning("Metrics file not loaded yet.")

st.markdown("<center><small>Developed by coffee and code</small></center>", unsafe_allow_html=True)