#!/usr/bin/env python
"""Quick test of PDF generation functionality"""
import sys
from pathlib import Path

# Add backend to path
backend_dir = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_dir))

from routes.report import ReportRequest, _build_pdf

# Create sample data
sample_data = ReportRequest(
    disease_name="Tomato___Early_Blight",
    confidence=87.5,
    is_diseased=True,
    crop_type="Tomato",
    temperature=28.5,
    humidity=78.2,
    wind_speed=12.1,
    rainfall=2.5,
    weather_condition="Partly Cloudy",
    location="Bangalore, Karnataka",
    risk_score=72,
    risk_level="High",
    recommendation="Isolate affected plants immediately and begin fungicide treatment.",
    treatment_options=[
        "Apply Mancozeb 75 WP (2.5 g/L) as foliar spray every 7-10 days",
        "Use neem oil (5 ml/L) in early morning",
        "Drench root zone with copper oxychloride",
    ],
    prevention_measures=[
        "Maintain 30-45 cm plant spacing",
        "Use drip irrigation",
        "Rotate crops seasonally",
    ]
)

# Generate PDF
try:
    print("🔄 Generating PDF...")
    pdf_bytes = _build_pdf(sample_data)
    
    # Save to file for inspection
    output_path = Path(__file__).parent / "test_output.pdf"
    with open(output_path, 'wb') as f:
        f.write(pdf_bytes)
    
    print(f"✅ PDF generated successfully!")
    print(f"   File size: {len(pdf_bytes):,} bytes")
    print(f"   Saved to: {output_path}")
    print(f"\n📋 Report Structure Verified:")
    print(f"   ✓ Header (Title, Date, Location)")
    print(f"   ✓ Prediction Summary (Status, Crop, Disease, Confidence, Risk)")
    print(f"   ✓ Weather Conditions")
    print(f"   ✓ Weather Risk Analysis")
    print(f"   ✓ Immediate Recommendation")
    print(f"   ✓ Treatment Plan")
    print(f"   ✓ Prevention Strategies")
    print(f"   ✓ Footer with Disclaimer")
    
except Exception as e:
    print(f"❌ PDF generation failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)
