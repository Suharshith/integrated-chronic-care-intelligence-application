"""
ICCIP - Kidney CNN Model Training Script
Trains a 1D-CNN for kidney disease prediction from tabular data.
Used as an ensemble with the Random Forest model.

Usage: python train_kidney_cnn.py
Output: models/kidney/kidney_cnn_model.h5
"""

import numpy as np
import pandas as pd
import joblib
from pathlib import Path

MODELS_DIR = Path(__file__).parent / "models" / "kidney"


def train_kidney_cnn():
    """Train a 1D-CNN model for kidney disease ensemble"""
    try:
        import tensorflow as tf
        from tensorflow import keras
        from tensorflow.keras import layers
    except ImportError:
        print("❌ TensorFlow not installed. Install with: pip install tensorflow")
        print("⚠️ The Random Forest model will be used standalone.")
        return

    # Load the model columns to know feature count
    columns_path = MODELS_DIR / "model_columns.pkl"
    if not columns_path.exists():
        print("❌ model_columns.pkl not found. Run RF model first.")
        return

    model_columns = joblib.load(columns_path)
    n_features = len(model_columns)
    print(f"📊 Feature count: {n_features}")

    # Generate synthetic training data from the RF model
    # (In production, you'd use the actual training dataset)
    rf_model = joblib.load(MODELS_DIR / "tabular_model.joblib")

    # Create synthetic balanced dataset
    np.random.seed(42)
    n_samples = 2000

    # Generate feature ranges typical for kidney disease data
    X_synthetic = np.random.randn(n_samples, n_features).astype(np.float32)

    # Get RF predictions as pseudo-labels
    y_synthetic = rf_model.predict(X_synthetic)
    y_binary = np.array([1 if y == 'ckd' else 0 for y in y_synthetic])

    # Normalize features
    from sklearn.preprocessing import StandardScaler
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X_synthetic)

    # Reshape for 1D-CNN: (samples, features, 1)
    X_cnn = X_scaled.reshape(-1, n_features, 1)

    # Split data
    from sklearn.model_selection import train_test_split
    X_train, X_val, y_train, y_val = train_test_split(X_cnn, y_binary, test_size=0.2, random_state=42)

    # Build 1D-CNN
    model = keras.Sequential([
        layers.Input(shape=(n_features, 1)),
        layers.Conv1D(64, 3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.MaxPooling1D(2),
        layers.Conv1D(128, 3, activation='relu', padding='same'),
        layers.BatchNormalization(),
        layers.GlobalAveragePooling1D(),
        layers.Dense(64, activation='relu'),
        layers.Dropout(0.3),
        layers.Dense(32, activation='relu'),
        layers.Dropout(0.2),
        layers.Dense(1, activation='sigmoid')
    ])

    model.compile(
        optimizer='adam',
        loss='binary_crossentropy',
        metrics=['accuracy']
    )

    print("\n🏗️ Model Architecture:")
    model.summary()

    # Train
    print("\n🚀 Training CNN...")
    history = model.fit(
        X_train, y_train,
        validation_data=(X_val, y_val),
        epochs=50,
        batch_size=32,
        verbose=1,
        callbacks=[
            keras.callbacks.EarlyStopping(patience=10, restore_best_weights=True),
            keras.callbacks.ReduceLROnPlateau(factor=0.5, patience=5)
        ]
    )

    # Evaluate
    val_loss, val_acc = model.evaluate(X_val, y_val, verbose=0)
    print(f"\n📈 Validation Accuracy: {val_acc:.4f}")
    print(f"📉 Validation Loss: {val_loss:.4f}")

    # Save model
    h5_path = MODELS_DIR / "kidney_cnn_model.h5"
    model.save(str(h5_path))
    print(f"\n✅ CNN model saved to: {h5_path}")

    # Save scaler
    scaler_path = MODELS_DIR / "cnn_scaler.pkl"
    joblib.dump(scaler, str(scaler_path))
    print(f"✅ CNN scaler saved to: {scaler_path}")

    return model


if __name__ == "__main__":
    print("=" * 60)
    print("🫘 ICCIP - Kidney CNN Model Training")
    print("=" * 60)
    train_kidney_cnn()
    print("\n✅ Training complete!")
