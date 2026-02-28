import torch
import torch.nn as nn
from torchvision import models, transforms
from PIL import Image
import numpy as np
import os
import cv2
import joblib
from scipy.stats import skew, kurtosis
from skimage.feature import graycomatrix, graycoprops

# --- CONFIG ---
BASE_DIR = r"C:\Users\obbin\Desktop\brain tumor project\archive"
MODELS_DIR = BASE_DIR # Or os.path.join(BASE_DIR, 'final_models_output')
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# --- TRANSFORMS ---
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

class_names = ["glioma", "meningioma", "notumor", "pituitary"]

# --- HELPERS ---
def get_handcrafted_features(image_path):
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
    except:
        return np.zeros(11)

def load_inference_model(model_name):
    """Loads DL model or (DenseNet+ML) pair."""
    # Maps user-friendly names to filenames
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
    
    path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(path): raise FileNotFoundError(f"Missing file: {path}")

    # CASE A: ML MODEL
    if filename.endswith(".pkl"):
        # We need the extractor too
        extractor_path = os.path.join(MODELS_DIR, "densenet121_brain_tumor.pth")
        extractor = models.densenet121(weights=None)
        extractor.classifier = nn.Linear(1024, 4)
        extractor.load_state_dict(torch.load(extractor_path, map_location=device))
        extractor.classifier = nn.Identity()
        extractor.to(device)
        extractor.eval()
        
        clf = joblib.load(path)
        return "ML", (extractor, clf)

    # CASE B: DL MODEL
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
        return "DL", model

def predict_single_image(image_path, model_name="DenseNet-121"):
    model_type, artifact = load_inference_model(model_name)
    
    # Preprocess
    img = Image.open(image_path).convert("RGB")
    tensor = transform(img).unsqueeze(0).to(device)
    
    if model_type == "DL":
        model = artifact
        with torch.no_grad():
            output = model(tensor)
            pred_idx = output.argmax(1).item()
            conf = torch.softmax(output, dim=1)[0, pred_idx].item()
            
    elif model_type == "ML":
        extractor, clf = artifact
        # 1. Deep Features
        with torch.no_grad():
            deep_feat = extractor(tensor).cpu().numpy().flatten()
        # 2. Manual Features
        manual_feat = get_handcrafted_features(image_path)
        # 3. Fuse
        combined = np.hstack([deep_feat, manual_feat]).reshape(1, -1)
        # 4. Predict
        pred_idx = clf.predict(combined)[0]
        try:
            conf = np.max(clf.predict_proba(combined))
        except:
            conf = 1.0 # SVM might not support proba depending on training
            
    return class_names[pred_idx], conf

# --- CLI USAGE ---
if __name__ == "__main__":
    # Change this path to test a real image
    test_img = r"C:\Users\obbin\Desktop\brain tumor project\archive\Testing\glioma\Te-gl_0010.jpg"
    
    # Try different models
    try:
        print(f"Analyzing {os.path.basename(test_img)}...")
        
        # 1. Deep Learning Test
        pred, conf = predict_single_image(test_img, "DenseNet-121")
        print(f"🧠 DenseNet-121: {pred} ({conf*100:.2f}%)")
        
        # 2. Machine Learning Test
        pred_ml, conf_ml = predict_single_image(test_img, "XGBoost")
        print(f"🌲 XGBoost (Hybrid): {pred_ml} ({conf_ml*100:.2f}%)")
        
    except Exception as e:
        print(f"Error: {e}")
        print("Tip: Make sure the file path exists and models are in the 'archive' folder.")