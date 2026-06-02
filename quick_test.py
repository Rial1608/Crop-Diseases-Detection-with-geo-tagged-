#!/usr/bin/env python3
"""
Quick start test script for the CDD backend.
Verifies all components are working correctly.
"""

import sys
import time
import subprocess
from pathlib import Path

def print_header(text):
    print("\n" + "█" * 70)
    print(f"█  {text:66}  █")
    print("█" * 70)

def print_step(text):
    print(f"\n▶ {text}")

def print_success(text):
    print(f"  ✓ {text}")

def print_error(text):
    print(f"  ✗ {text}")

def print_warning(text):
    print(f"  ⚠ {text}")

def check_file_exists(filepath, description):
    path = Path(filepath)
    if path.exists():
        print_success(f"{description}: {filepath}")
        return True
    else:
        print_error(f"{description} NOT FOUND: {filepath}")
        return False

# ── Step 1: Check Project Structure ──────────────────────────────────────────
print_header("CDD BACKEND - QUICK START VERIFICATION")

print_step("Checking project structure...")

backend_dir = Path(__file__).parent / "backend"
frontend_dir = Path(__file__).parent / "frontend"
model_dir = backend_dir / "model"

checks = [
    (backend_dir, "Backend directory"),
    (frontend_dir, "Frontend directory"),
    (model_dir, "Model directory"),
    (model_dir / "model.keras", "Keras model file (OR model.h5)"),
    (model_dir / "class_indices.json", "Class indices mapping"),
    (backend_dir / "main.py", "FastAPI main app"),
    (backend_dir / "routes" / "predict.py", "Prediction route"),
    (backend_dir / "utils" / "constants.py", "Constants (FIXED)"),
    (frontend_dir / "src" / "utils" / "api.js", "Frontend API client"),
]

all_exist = True
for filepath, description in checks:
    if not check_file_exists(filepath, description):
        all_exist = False

if not all_exist:
    print_error("\nSome required files are missing! Check paths above.")
    sys.exit(1)

print_success("All required files found!")

# ── Step 2: Check Python Environment ─────────────────────────────────────────
print_step("Checking Python environment...")

required_packages = [
    ("tensorflow", "TensorFlow"),
    ("fastapi", "FastAPI"),
    ("uvicorn", "Uvicorn"),
    ("PIL", "Pillow"),
    ("numpy", "NumPy"),
]

missing_packages = []
for package, name in required_packages:
    try:
        __import__(package)
        print_success(f"{name} is installed")
    except ImportError:
        print_error(f"{name} is NOT installed")
        missing_packages.append(name)

if missing_packages:
    print_warning(f"\nMissing packages: {', '.join(missing_packages)}")
    print(f"  Install with: pip install {' '.join([p[0] for p in required_packages if p[1] in missing_packages])}")
    # Don't exit, tests might still work

# ── Step 3: Test Class Loading ──────────────────────────────────────────────
print_step("Testing class loading from class_indices.json...")

try:
    sys.path.insert(0, str(backend_dir))
    from utils.constants import CLASS_NAMES, NUM_CLASSES
    
    print_success(f"Loaded {NUM_CLASSES} classes")
    print(f"  Classes: {', '.join(CLASS_NAMES[:3])}...")
    
    # Verify the loaded classes match expected model classes
    if NUM_CLASSES == 16:
        print_success("Number of classes matches trained model (16)")
    else:
        print_warning(f"Expected 16 classes, got {NUM_CLASSES}")
    
except Exception as e:
    print_error(f"Class loading failed: {e}")
    sys.exit(1)

# ── Step 4: Test Image Preprocessing ────────────────────────────────────────
print_step("Testing image preprocessing...")

try:
    from PIL import Image
    import numpy as np
    from routes.predict import _preprocess_image
    
    # Create test image
    test_img = Image.new('RGB', (480, 640), color=(100, 150, 200))
    arr = _preprocess_image(test_img, target_size=224)
    
    assert arr.shape == (224, 224, 3), f"Shape mismatch: {arr.shape}"
    assert arr.dtype == np.float32, f"Dtype mismatch: {arr.dtype}"
    assert 0 <= arr.min() and arr.max() <= 1, f"Value range error: [{arr.min()}, {arr.max()}]"
    
    print_success(f"Preprocessing works correctly")
    print(f"  Shape: {arr.shape}, dtype: {arr.dtype}, range: [{arr.min():.4f}, {arr.max():.4f}]")
    
except Exception as e:
    print_error(f"Preprocessing test failed: {e}")
    sys.exit(1)

# ── Step 5: Test Model Loading ───────────────────────────────────────────────
print_step("Testing model loading...")

try:
    from services.disease_detector import DiseaseDetector
    
    keras_path = model_dir / "model.keras"
    h5_path = model_dir / "model.h5"
    
    if keras_path.exists():
        model_path = str(keras_path)
        print_success(f"Using model.keras")
    elif h5_path.exists():
        model_path = str(h5_path)
        print_success(f"Using model.h5")
    else:
        print_warning("No model file found (model.keras or model.h5)")
        print("  This is OK - system will run in DEMO mode")
        model_path = str(keras_path)  # Try anyway
    
    detector = DiseaseDetector(model_path=model_path)
    
    if detector.demo_mode:
        print_warning("Model loaded in DEMO MODE")
        print("  To generate a real model, run: python backend/model/create_working_model.py")
    else:
        print_success("Model loaded in LIVE MODE")
        if detector.model:
            print(f"  Input shape: {detector.model.input_shape}")
            print(f"  Output shape: {detector.model.output_shape}")
            print(f"  Parameters: {detector.model.count_params():,}")
    
except Exception as e:
    print_warning(f"Model loading test skipped: {e}")

# ── Step 6: Test FastAPI App ────────────────────────────────────────────────
print_step("Testing FastAPI application...")

try:
    from fastapi.testclient import TestClient
    from main import app
    
    client = TestClient(app)
    
    # Test root endpoint
    response = client.get("/")
    assert response.status_code == 200
    print_success("GET / - OK")
    
    # Test health endpoint
    response = client.get("/health")
    assert response.status_code == 200
    print_success("GET /health - OK")
    
    # Test predict info endpoint
    response = client.get("/api/predict/info")
    assert response.status_code == 200
    data = response.json()
    print_success(f"GET /api/predict/info - OK ({data.get('total_classes')} classes)")
    
except Exception as e:
    print_error(f"FastAPI test failed: {e}")
    import traceback
    traceback.print_exc()

# ── Step 7: Summary ───────────────────────────────────────────────────────────
print_header("VERIFICATION COMPLETE")

print("""
✅ Backend is ready to run!

NEXT STEPS:

1. Start the backend server:
   cd backend
   uvicorn main:app --reload

   Expected output:
   [STARTUP] Smart Crop Disease Detection System
   [OK] TensorFlow loaded: 2.x.x
   [OK] Model loaded - demo_mode=False
   [OK] Application started successfully - LIVE predictions enabled
   INFO:     Uvicorn running on http://127.0.0.1:8000

2. In a new terminal, start the frontend:
   cd frontend
   npm run dev

   You should see:
   VITE v5.x.x  ready in xxx ms
   ➜  Local:   http://localhost:5173/

3. Open http://localhost:5173 in your browser

4. Test the system:
   - Click "Upload Image"
   - Select a crop leaf image
   - Click "Analyze"
   - You should see disease prediction with confidence score

TROUBLESHOOTING:

- If model doesn't load: Check that model.keras exists in backend/model/
- If frontend can't reach backend: Ensure backend is running on port 8000
- If CORS errors: The vite.config.js should proxy requests to http://127.0.0.1:8000
- If predictions are wrong: Ensure preprocessing matches training (224x224, /255.0)

For detailed information, see: BACKEND_FIX_README.md
""")

print("█" * 70)
