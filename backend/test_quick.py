"""Quick smoke test for all API endpoints."""
import requests
import io
from PIL import Image

base = "http://localhost:8000"

# Test 1: Health check
print("=== Health Check ===")
r = requests.get(f"{base}/health")
print(f"  Status: {r.status_code}, Body: {r.json()}")

# Test 2: Weather API
print("\n=== Weather API ===")
r = requests.get(f"{base}/api/weather", params={"latitude": 28.6139, "longitude": 77.209})
w = r.json()
print(f"  Status: {r.status_code}")
print(f"  Success: {w.get('success')}")
d = w.get("data", {})
print(f"  Location: {d.get('location', {}).get('name')}")
print(f"  Temperature: {d.get('temperature')}C")
print(f"  Humidity: {d.get('humidity')}%")
print(f"  Description: {d.get('description')}")
print(f"  Is Demo: {d.get('is_demo')}")

# Test 3: Prediction API
print("\n=== Predict API ===")
img = Image.new("RGB", (224, 224), color=(76, 175, 80))
buf = io.BytesIO()
img.save(buf, format="PNG")
buf.seek(0)
r = requests.post(
    f"{base}/api/predict",
    files={"file": ("test.png", buf, "image/png")},
    data={"latitude": "28.6139", "longitude": "77.209"},
)
p = r.json()
print(f"  Status: {r.status_code}")
print(f"  Success: {p.get('success')}")
print(f"  Mode: {p.get('mode')}")
pred = p.get("prediction", {})
print(f"  Disease: {pred.get('disease_name')}")
print(f"  Confidence: {pred.get('confidence')}%")
print(f"  Is Diseased: {pred.get('is_diseased')}")
info = p.get("disease_info", {})
print(f"  Treatment Name: {info.get('name')}")
print(f"  Has Prevention: {bool(info.get('prevention'))}")
print(f"  Has Treatment: {bool(info.get('treatment'))}")

# Test 4: Risk API
print("\n=== Risk API ===")
r = requests.get(f"{base}/api/risk/estimate", params={"latitude": 28.6139, "longitude": 77.209})
print(f"  Status: {r.status_code}")

# Test 5: Frontend check
print("\n=== Frontend ===")
r = requests.get("http://localhost:5174/", timeout=5)
print(f"  Status: {r.status_code}")
print(f"  Has Content: {len(r.text) > 100}")

print("\n=== ALL TESTS COMPLETE ===")
