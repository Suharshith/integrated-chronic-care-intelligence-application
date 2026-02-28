import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
from torch.utils.data import DataLoader
import os
import pandas as pd
import numpy as np
from PIL import Image
from tqdm import tqdm
import joblib
import cv2
from scipy.stats import skew, kurtosis
from skimage.feature import graycomatrix, graycoprops

# --- CONFIGURATION ---
BASE_DIR = r"C:\Users\suhar\OneDrive\Desktop\brain\archive\archive"
TEST_DIR = os.path.join(BASE_DIR, "Testing")
MODELS_DIR = r"C:\Users\suhar\OneDrive\Desktop\brain"

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"🚀 Running evaluation on: {device}")

# --- 1. DATA SETUP ---
transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
])

try:
    test_data = datasets.ImageFolder(TEST_DIR, transform=transform)
    test_loader = DataLoader(test_data, batch_size=32, shuffle=False)
    class_names = test_data.classes
    print(f"✅ Found {len(test_data)} test images across {len(class_names)} classes.")
except Exception as e:
    print(f"❌ Error loading data: {e}")
    exit()

# --- 2. MODEL LOADERS ---
def get_dl_model(model_name):
    """Rebuilds architecture and loads weights."""
    weights = None
    if model_name == "ResNet-18":
        model = models.resnet18(weights=None)
        model.fc = nn.Linear(model.fc.in_features, 4)
    elif model_name == "VGG-16":
        model = models.vgg16(weights=None)
        model.classifier[6] = nn.Linear(4096, 4)
    elif model_name == "MobileNetV2":
        model = models.mobilenet_v2(weights=None)
        model.classifier[1] = nn.Linear(model.last_channel, 4)
    elif model_name == "EfficientNet-B0":
        model = models.efficientnet_b0(weights=None)
        model.classifier[1] = nn.Linear(1280, 4)
    elif model_name == "DenseNet-121":
        model = models.densenet121(weights=None)
        model.classifier = nn.Linear(1024, 4)
    
    # Construct path (e.g., resnet18_brain_tumor.pth)
    safe_name = model_name.lower().replace("-", "").replace("_", "")
    path = os.path.join(MODELS_DIR, f"{safe_name}_brain_tumor.pth")
    
    if os.path.exists(path):
        model.load_state_dict(torch.load(path, map_location=device))
        model.to(device)
        model.eval()
        return model
    else:
        print(f"⚠️ Warning: Could not find file {path}")
        return None

# --- 3. FEATURE EXTRACTION (FOR ML) ---
# We need DenseNet loaded to extract features for XGBoost/RF/SVM
densenet_extractor = get_dl_model("DenseNet-121")
if densenet_extractor:
    densenet_extractor.classifier = nn.Identity() # Remove classification head
    densenet_extractor.eval()

def get_handcrafted_features(image_path):
    """Extracts Texture & Statistical features using CPU (OpenCV/Skimage)"""
    try:
        img = cv2.imread(image_path, cv2.IMREAD_GRAYSCALE)
        if img is None: return np.zeros(11)
        img = cv2.resize(img, (224, 224))
        
        # Stats
        mean_val = np.mean(img)
        std_val = np.std(img)
        var_val = np.var(img)
        skew_val = skew(img.flatten())
        kurt_val = kurtosis(img.flatten())
        
        # Texture
        glcm = graycomatrix(img, distances=[1], angles=[0], levels=256, symmetric=True, normed=True)
        contrast = graycoprops(glcm, 'contrast').mean()
        dissimilarity = graycoprops(glcm, 'dissimilarity').mean()
        homogeneity = graycoprops(glcm, 'homogeneity').mean()
        energy = graycoprops(glcm, 'energy').mean()
        correlation = graycoprops(glcm, 'correlation').mean()
        
        # Symmetry
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

# --- 4. EVALUATION LOOP ---
def evaluate_dl_model(name):
    model = get_dl_model(name)
    if not model: return
    
    correct = 0
    total = 0
    with torch.no_grad():
        for x, y in tqdm(test_loader, desc=f"Testing {name}"):
            x, y = x.to(device), y.to(device)
            preds = model(x).argmax(1)
            correct += (preds == y).sum().item()
            total += y.size(0)
    print(f"✅ {name} Accuracy: {correct/total:.4f}")

def evaluate_ml_model(name, filename):
    path = os.path.join(MODELS_DIR, filename)
    if not os.path.exists(path):
        print(f"⚠️ Warning: Missing {filename}")
        return

    clf = joblib.load(path)
    correct = 0
    total = 0
    
    # Note: ML evaluation is slower because we extract features image-by-image or batch-by-batch
    # For speed in this script, we'll verify it loads and skip full dataset loop, 
    # or run on a small subset. Let's run full to be sure.
    
    print(f"⚙️  Extracting features for {name} (this takes time)...")
    preds_list = []
    truth_list = []
    
    # Iterate via dataset to get paths for handcrafted features
    for i in tqdm(range(len(test_data)), desc=f"Testing {name}"):
        img_path, label = test_data.samples[i]
        
        # Deep Features
        img_t = transform(Image.open(img_path).convert("RGB")).unsqueeze(0).to(device)
        with torch.no_grad():
            deep_feat = densenet_extractor(img_t).cpu().numpy().flatten()
            
        # Handcrafted
        manual_feat = get_handcrafted_features(img_path)
        
        # Combine
        feat_vector = np.hstack([deep_feat, manual_feat]).reshape(1, -1)
        
        # Predict
        pred = clf.predict(feat_vector)[0]
        preds_list.append(pred)
        truth_list.append(label)

    acc = np.mean(np.array(preds_list) == np.array(truth_list))
    print(f"✅ {name} Accuracy: {acc:.4f}")

# --- 5. RUN CHECKS ---
if __name__ == "__main__":
    print("\n🔎 Verifying Deep Learning Models...")
    dl_models = ["ResNet-18", "VGG-16", "MobileNetV2", "EfficientNet-B0", "DenseNet-121"]
    for m in dl_models:
        evaluate_dl_model(m)

    print("\n🔎 Verifying Machine Learning Models...")
    if densenet_extractor:
        evaluate_ml_model("Random Forest", "ml_randomforest.pkl")
        evaluate_ml_model("XGBoost", "ml_xgboost.pkl")
        evaluate_ml_model("SVM", "ml_svm.pkl")
    else:
        print("⚠️ Skipping ML checks because DenseNet backbone is missing.")

    # --- 6. GENERATE SUBMISSION (Using Best Model: DenseNet) ---
    print("\n📝 Generating submission.csv using DenseNet-121...")
    model = get_dl_model("DenseNet-121")
    if model:
        image_names = []
        predicted_labels = []
        
        # Create inverse mapping
        idx_to_class = {v: k for k, v in test_data.class_to_idx.items()}
        
        with torch.no_grad():
            for i in tqdm(range(len(test_data)), desc="Generating CSV"):
                img_path, _ = test_data.samples[i]
                img_t = transform(Image.open(img_path).convert("RGB")).unsqueeze(0).to(device)
                
                pred_idx = model(img_t).argmax(1).item()
                
                image_names.append(os.path.basename(img_path))
                predicted_labels.append(idx_to_class[pred_idx])
        
        df = pd.DataFrame({"image_name": image_names, "label": predicted_labels})
        df.to_csv("submission.csv", index=False)
        print("🎉 submission.csv saved successfully!")