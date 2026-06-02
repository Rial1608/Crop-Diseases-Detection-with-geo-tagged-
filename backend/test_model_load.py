"""Quick test: verify DiseaseDetector loads the .keras model and runs inference."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '2'

import numpy as np
from services.disease_detector import DiseaseDetector

print("=== Testing DiseaseDetector with .keras model ===\n")
detector = DiseaseDetector(model_path="model/model.keras")

print(f"\nDemo mode : {detector.demo_mode}")
print(f"Is loaded : {detector.is_loaded}")
print(f"Num classes: {detector.num_classes}")

# Simulate a preprocessed image (224x224x3, float32, 0-1)
fake_image = np.random.rand(224, 224, 3).astype(np.float32)
result = detector.predict(fake_image)

mode = result["mode"]
success = result["success"]
pred = result["prediction"]
name = pred["disease_name"]
conf = pred["confidence"]

print(f"\nResult mode    : {mode}")
print(f"Success        : {success}")
print(f"Top prediction : {name}")
print(f"Confidence     : {conf}%")

if mode == "LIVE" and success:
    print("\n✅ FULL PIPELINE TEST PASSED – model runs in LIVE mode!")
else:
    print(f"\n❌ TEST FAILED – mode={mode}, success={success}")
    sys.exit(1)
