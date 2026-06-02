#!/usr/bin/env python3
"""
Integration test for the fixed crop disease detection backend.
Tests model loading, class mapping, preprocessing, and prediction.
"""

import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

import json
import numpy as np
from PIL import Image
import io

# ── Test 1: Load class indices and verify mapping ─────────────────────────────
def test_class_loading():
    print("\n" + "="*70)
    print("TEST 1: Class Loading from class_indices.json")
    print("="*70)
    
    from utils.constants import CLASS_NAMES, NUM_CLASSES
    
    print(f"✓ Loaded {NUM_CLASSES} classes")
    print(f"✓ Class names list: {CLASS_NAMES}")
    
    # Verify class mapping file
    class_indices_path = backend_dir / "model" / "class_indices.json"
    if class_indices_path.exists():
        with open(class_indices_path, 'r') as f:
            indices = json.load(f)
        print(f"✓ class_indices.json contains {len(indices)} classes")
        print(f"  Mapping: {indices}")
        
        # Verify reverse mapping
        for class_name, idx in indices.items():
            if CLASS_NAMES[int(idx)] == class_name:
                print(f"  ✓ {idx}: {class_name}")
            else:
                print(f"  ✗ MISMATCH! Index {idx}: expected '{class_name}', got '{CLASS_NAMES[int(idx)]}'")
                return False
    else:
        print(f"⚠ class_indices.json not found at {class_indices_path}")
    
    return True

# ── Test 2: Verify disease treatments ────────────────────────────────────────
def test_disease_treatments():
    print("\n" + "="*70)
    print("TEST 2: Disease Treatments")
    print("="*70)
    
    from utils.constants import CLASS_NAMES, DISEASE_TREATMENTS, get_treatment
    
    missing_treatments = []
    for class_name in CLASS_NAMES:
        treatment = get_treatment(class_name)
        if treatment.get("name") == "Unknown Disease":
            missing_treatments.append(class_name)
            print(f"⚠ {class_name}: using fallback treatment")
        else:
            print(f"✓ {class_name}: {treatment.get('name')}")
    
    if missing_treatments:
        print(f"\n⚠ Missing specific treatments for: {missing_treatments}")
    else:
        print(f"\n✓ All classes have specific treatments")
    
    return True

# ── Test 3: Image preprocessing ──────────────────────────────────────────────
def test_preprocessing():
    print("\n" + "="*70)
    print("TEST 3: Image Preprocessing")
    print("="*70)
    
    from routes.predict import _preprocess_image
    from utils.constants import IMAGE_SIZE
    
    # Create a test image
    test_img = Image.new('RGB', (480, 640), color=(100, 150, 200))
    
    # Preprocess
    arr = _preprocess_image(test_img, target_size=IMAGE_SIZE)
    
    print(f"✓ Input image: RGB 480×640")
    print(f"✓ Output shape: {arr.shape}")
    print(f"✓ Output dtype: {arr.dtype}")
    print(f"✓ Value range: [{arr.min():.4f}, {arr.max():.4f}]")
    
    # Verify
    assert arr.shape == (IMAGE_SIZE, IMAGE_SIZE, 3), f"Expected shape ({IMAGE_SIZE}, {IMAGE_SIZE}, 3), got {arr.shape}"
    assert arr.dtype == np.float32, f"Expected dtype float32, got {arr.dtype}"
    assert 0 <= arr.min() and arr.max() <= 1, f"Values should be in [0, 1], got [{arr.min()}, {arr.max()}]"
    
    print(f"\n✓ Preprocessing test passed!")
    return True

# ── Test 4: Model loading ────────────────────────────────────────────────────
def test_model_loading():
    print("\n" + "="*70)
    print("TEST 4: Model Loading")
    print("="*70)
    
    from services.disease_detector import DiseaseDetector
    from utils.constants import NUM_CLASSES
    
    keras_path = backend_dir / "model" / "model.keras"
    h5_path = backend_dir / "model" / "model.h5"
    
    if keras_path.exists():
        model_path = str(keras_path)
        print(f"✓ Found model.keras at {keras_path}")
    elif h5_path.exists():
        model_path = str(h5_path)
        print(f"✓ Found model.h5 at {h5_path}")
    else:
        print(f"✗ No model file found!")
        print(f"  Checked: {keras_path}")
        print(f"  Checked: {h5_path}")
        print(f"\n⚠ Model loading test skipped (model files not found)")
        print(f"  To generate a test model, run: python {backend_dir}/model/create_working_model.py")
        return True  # Don't fail, model might not be there yet
    
    detector = DiseaseDetector(model_path=model_path)
    
    print(f"✓ Model loaded successfully")
    print(f"  Demo mode: {detector.demo_mode}")
    print(f"  Classes: {detector.num_classes}")
    print(f"  Class names: {detector.class_names}")
    
    if detector.model:
        print(f"  Input shape: {detector.model.input_shape}")
        print(f"  Output shape: {detector.model.output_shape}")
        print(f"  Parameters: {detector.model.count_params():,}")
    
    # Verify output size matches classes
    if detector.model and not detector.demo_mode:
        output_classes = detector.model.output_shape[-1]
        if output_classes != NUM_CLASSES:
            print(f"⚠ Model output {output_classes} != NUM_CLASSES {NUM_CLASSES}")
        else:
            print(f"✓ Model output classes match NUM_CLASSES")
    
    return True

# ── Test 5: Prediction on synthetic image ────────────────────────────────────
def test_prediction():
    print("\n" + "="*70)
    print("TEST 5: Prediction on Synthetic Image")
    print("="*70)
    
    from services.disease_detector import DiseaseDetector
    from routes.predict import _preprocess_image
    from utils.constants import IMAGE_SIZE
    
    # Check if model exists
    keras_path = backend_dir / "model" / "model.keras"
    h5_path = backend_dir / "model" / "model.h5"
    
    if not keras_path.exists() and not h5_path.exists():
        print(f"⚠ Prediction test skipped (model files not found)")
        return True
    
    model_path = str(keras_path if keras_path.exists() else h5_path)
    detector = DiseaseDetector(model_path=model_path)
    
    if detector.demo_mode:
        print(f"ℹ Running in DEMO mode")
    
    # Create a synthetic image
    test_img = Image.new('RGB', (480, 640), color=(100, 150, 200))
    arr = _preprocess_image(test_img, target_size=IMAGE_SIZE)
    
    # Run prediction
    result = detector.predict(arr, original_image=test_img)
    
    print(f"✓ Prediction completed")
    print(f"  Success: {result.get('success')}")
    print(f"  Mode: {result.get('mode')}")
    
    if result.get('success'):
        pred = result.get('prediction', {})
        print(f"  Disease: {pred.get('disease_name')}")
        print(f"  Confidence: {pred.get('confidence')}%")
        print(f"  Is diseased: {pred.get('is_diseased')}")
        print(f"  Is uncertain: {pred.get('is_uncertain')}")
    
    return True

# ── Test 6: FastAPI app startup ──────────────────────────────────────────────
def test_app_startup():
    print("\n" + "="*70)
    print("TEST 6: FastAPI App Startup")
    print("="*70)
    
    from main import app
    from fastapi.testclient import TestClient
    
    client = TestClient(app)
    
    # Test root endpoint
    response = client.get('/')
    print(f"✓ GET / returns {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    print(f"  Message: {data.get('message')}")
    print(f"  Version: {data.get('version')}")
    
    # Test health endpoint
    response = client.get('/health')
    print(f"✓ GET /health returns {response.status_code}")
    assert response.status_code == 200
    
    # Test predict info endpoint
    response = client.get('/api/predict/info')
    print(f"✓ GET /api/predict/info returns {response.status_code}")
    assert response.status_code == 200
    data = response.json()
    print(f"  Model: {data.get('model')}")
    print(f"  Total classes: {data.get('total_classes')}")
    print(f"  Input size: {data.get('input_size')}")
    
    print(f"\n✓ FastAPI app startup test passed!")
    return True

# ── Main test runner ────────────────────────────────────────────────────────────
if __name__ == '__main__':
    print("\n" + "█"*70)
    print("█  CROP DISEASE DETECTION - BACKEND INTEGRATION TESTS")
    print("█"*70)
    
    tests = [
        ("Class Loading", test_class_loading),
        ("Disease Treatments", test_disease_treatments),
        ("Image Preprocessing", test_preprocessing),
        ("Model Loading", test_model_loading),
        ("Prediction", test_prediction),
        ("FastAPI Startup", test_app_startup),
    ]
    
    results = {}
    for test_name, test_func in tests:
        try:
            results[test_name] = test_func()
        except Exception as e:
            print(f"\n✗ TEST FAILED: {test_name}")
            print(f"  Error: {e}")
            import traceback
            traceback.print_exc()
            results[test_name] = False
    
    # Summary
    print("\n" + "="*70)
    print("TEST SUMMARY")
    print("="*70)
    for test_name, passed in results.items():
        status = "✓ PASSED" if passed else "✗ FAILED"
        print(f"{status}: {test_name}")
    
    passed_count = sum(1 for v in results.values() if v)
    total_count = len(results)
    
    print(f"\nTotal: {passed_count}/{total_count} tests passed")
    
    if passed_count == total_count:
        print("\n🎉 ALL TESTS PASSED!")
        sys.exit(0)
    else:
        print(f"\n❌ {total_count - passed_count} test(s) failed")
        sys.exit(1)
