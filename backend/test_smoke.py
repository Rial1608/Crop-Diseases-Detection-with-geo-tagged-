"""Quick smoke test for all critical API endpoints."""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

import requests
import json

BASE = "http://127.0.0.1:8000"

def test(name, method, url, **kwargs):
    try:
        resp = getattr(requests, method)(url, timeout=30, **kwargs)
        ok = resp.status_code < 400
        tag = "PASS" if ok else "FAIL"
        print(f"  [{tag}] {name} -> {resp.status_code}")
        if ok:
            data = resp.json()
            # Print key fields
            for k in ("status", "success", "mode", "is_demo"):
                if k in data:
                    print(f"         {k}: {data[k]}")
            if "data" in data and isinstance(data["data"], dict):
                for k in ("temperature", "humidity", "is_demo", "location"):
                    if k in data["data"]:
                        print(f"         {k}: {data['data'][k]}")
        else:
            print(f"         body: {resp.text[:200]}")
        return ok, resp.json() if ok else None
    except Exception as e:
        print(f"  [FAIL] {name} -> {e}")
        return False, None

print("=" * 60)
print("  Backend API Smoke Test")
print("=" * 60)

# 1. Health
test("Health check", "get", f"{BASE}/health")

# 2. Root
test("Root endpoint", "get", f"{BASE}/")

# 3. Model info
test("Model info", "get", f"{BASE}/api/predict/info")

# 4. Weather (real API with the key from .env)
ok, data = test("Weather API (real)", "get", f"{BASE}/api/weather",
     params={"latitude": 28.6139, "longitude": 77.2090})
if ok and data:
    wd = data.get("data", {})
    if wd.get("is_demo"):
        print("         *** WEATHER IS DEMO - API key may be invalid ***")
    else:
        print(f"         *** REAL weather data: {wd.get('temperature')}°C, {wd.get('description')} ***")

# 5. Predict with a dummy image
print("\n  Testing prediction with a real image upload...")
from PIL import Image
import io
import numpy as np

# Create a fake leaf image (green with some brown spots)
img = Image.new("RGB", (300, 300), (34, 139, 34))
buf = io.BytesIO()
img.save(buf, format="JPEG")
buf.seek(0)

ok, data = test("Predict (image upload)", "post", f"{BASE}/api/predict",
     files={"file": ("test_leaf.jpg", buf, "image/jpeg")},
     data={"latitude": "28.6139", "longitude": "77.2090"})
if ok and data:
    pred = data.get("prediction", {})
    print(f"         Disease: {pred.get('disease_name')}")
    print(f"         Confidence: {pred.get('confidence')}%")
    print(f"         Mode: {data.get('mode')}")
    weather = data.get("weather_data", {})
    print(f"         Weather attached: is_demo={weather.get('is_demo')}")

print("\n" + "=" * 60)
print("  Smoke test complete!")
print("=" * 60)
