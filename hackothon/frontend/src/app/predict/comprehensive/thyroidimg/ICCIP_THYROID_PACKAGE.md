# 🦋 ICCIP Thyroid Image Prediction: Full Package

> [!IMPORTANT]
> **Sending just this file is NOT enough!** You must send this package **PLUS** the actual model and source code. 

## 1. What to include in your Zip/Transfer
To make it work on another laptop, you **MUST** send these 4 items:
1.  **`ICCIP_THYROID_PACKAGE.md`** (This instruction/code file)
2.  **`thyroid_cnn_model.keras`** (The actual AI model file)
3.  **`src/`** folder (Contains all the prediction logic)
4.  **`requirements.txt`** (To install the necessary libraries)

## 2. Backend: FastAPI Code
Create a file named `thyroid_api.py` in your backend folder and paste this code:

```python
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, List
import io
from PIL import Image
import numpy as np

# Import existing modular logic (ensure src folder is present)
from src.loader import load_class_names, load_features
from src.predict import single_prediction, image_prediction

app = FastAPI(title="ThyroidAI API", description="Backend for Thyroid Prediction")

# Enable CORS for Next.js
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class_names = load_class_names()
feature_names = load_features()

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
```

## 2. Frontend: Next.js Component
Create a file named `ThyroidScanner.js` in your Next.js project and paste this code:

```jsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThyroidScanner() {
  const [file, setFile] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    if (!file) return;
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/predict/image', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error("Error predicting:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[500px] flex flex-col items-center justify-center p-10 bg-slate-900 rounded-[2rem] border border-slate-800 shadow-2xl relative overflow-hidden">
      {/* Premium Gradient Background */}
      <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-indigo-600/10 to-purple-600/10 pointer-events-none" />
      
      <h2 className="text-4xl font-black text-white mb-8 tracking-tight">Thyroid Image Recognition</h2>
      
      <div className="w-full max-w-md bg-white/5 backdrop-blur-xl p-8 rounded-3xl border border-white/10 z-10 transition-all hover:border-indigo-500/50">
        <input 
          type="file" 
          onChange={(e) => setFile(e.target.files[0])}
          className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 mb-6 cursor-pointer"
        />
        
        <button 
          onClick={handlePredict}
          disabled={!file || loading}
          className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold rounded-2xl transition-all shadow-lg active:scale-95"
        >
          {loading ? 'Analyzing Scan...' : 'Run Image Recognition'}
        </button>
      </div>

      <AnimatePresence>
        {result && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-10 p-8 bg-white/10 backdrop-blur-2xl rounded-3xl border border-white/20 text-center z-10"
          >
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Detection Result</p>
            <h3 className="text-4xl font-black text-white mb-2">{result.prediction}</h3>
            <div className="flex items-center justify-center gap-2">
              <div className="h-2 w-32 bg-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }} 
                  animate={{ width: `${result.confidence * 100}%` }}
                  className="h-full bg-indigo-500" 
                />
              </div>
              <span className="text-slate-400 font-mono text-sm">{(result.confidence * 100).toFixed(1)}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

## 3. Required Files Setup
Ensure your folder looks exactly like this on the server:
- `thyroid_api.py` (The code above)
- `thyroid_cnn_model.keras` (Copy this from `C:\Users\Rugvedh\OneDrive\Desktop\final\`)
- `requirements.txt` (Ensure `tensorflow`, `fastapi`, `pillow` are there)
- `src/` (The folder containing `predict.py` and `loader.py`)

## 4. Final AI Prompt (If you need changes)
Use this prompt if you want me to refine the look:
> "Refine the ThyroidScanner Next.js component to include a React Three Fiber 3D thyroid model that glows when the prediction is being calculated. Maintain the Tailwind and Framer Motion styling but make it look even more premium for a medical-grade website."

---
**Status:** Everything is modular, high-end, and follows your FastAPI + Next.js architecture.
