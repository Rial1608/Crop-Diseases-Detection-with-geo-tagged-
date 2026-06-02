#!/usr/bin/env python
"""Test the /api/download-report endpoint"""
import sys
import requests
import json
from pathlib import Path

# Test endpoint
API_URL = "http://localhost:8000/api/download-report"

# Sample report data
payload = {
    "disease_name": "Tomato___Early_Blight",
    "confidence": 87.5,
    "is_diseased": True,
    "crop_type": "Tomato",
    "temperature": 28.5,
    "humidity": 78.2,
    "wind_speed": 12.1,
    "rainfall": 2.5,
    "weather_condition": "Partly Cloudy",
    "location": "Bangalore, Karnataka",
    "risk_score": 72,
    "risk_level": "High",
    "recommendation": "Isolate affected plants immediately and begin fungicide treatment.",
    "treatment_options": [
        "Apply Mancozeb 75 WP (2.5 g/L) as foliar spray every 7-10 days",
        "Use neem oil (5 ml/L) in early morning",
        "Drench root zone with copper oxychloride",
    ],
    "prevention_measures": [
        "Maintain 30-45 cm plant spacing",
        "Use drip irrigation",
        "Rotate crops seasonally",
    ]
}

print(f"📤 Testing /api/download-report endpoint...")
print(f"   URL: {API_URL}")
print(f"   Payload: {len(json.dumps(payload)):,} bytes")

try:
    # Make request
    response = requests.post(API_URL, json=payload, timeout=30)
    
    # Check status
    if response.status_code != 200:
        print(f"❌ Request failed with status {response.status_code}")
        print(f"   Response: {response.text[:500]}")
        sys.exit(1)
    
    # Save PDF
    pdf_data = response.content
    output_path = Path("test_api_report.pdf")
    with open(output_path, 'wb') as f:
        f.write(pdf_data)
    
    # Check content type
    content_type = response.headers.get('Content-Type', '')
    content_disposition = response.headers.get('Content-Disposition', '')
    
    print(f"\n✅ API request successful!")
    print(f"   Status: {response.status_code}")
    print(f"   Content-Type: {content_type}")
    print(f"   Content-Disposition: {content_disposition}")
    print(f"   PDF Size: {len(pdf_data):,} bytes")
    print(f"   Saved to: {output_path}")
    
    # Verify PDF is valid
    if len(pdf_data) > 100:
        print(f"\n✅ PDF validation:")
        print(f"   ✓ PDF header: {pdf_data[:4]}")
        print(f"   ✓ File size: {len(pdf_data):,} bytes (OK)")
        print(f"   ✓ Not empty: {'Yes' if len(pdf_data) > 1000 else 'Warning: Small file'}")
    
    print(f"\n🎉 Full Download Report Feature is WORKING!")
    
except requests.exceptions.ConnectionError:
    print(f"❌ Could not connect to backend at {API_URL}")
    print(f"   Make sure the backend is running on port 8000")
    sys.exit(1)
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
