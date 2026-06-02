"""
Helper functions for the disease detection system
"""
import io
from pathlib import Path
from typing import Tuple, Optional
import numpy as np
from PIL import Image

def allowed_file(filename: str) -> bool:
    """Check if the file extension is allowed."""
    from utils.constants import ALLOWED_EXTENSIONS
    return Path(filename).suffix.lower() in ALLOWED_EXTENSIONS

def get_file_extension(filename: str) -> str:
    """Get file extension."""
    return Path(filename).suffix.lower()

def calculate_risk_score(
    confidence: float,
    weather_risk: float,
    location_risk: float,
) -> float:
    """Calculate overall risk score based on multiple factors."""
    # Weights: image confidence 40%, weather 30%, location 30%
    risk_score = (confidence * 0.4) + (weather_risk * 0.3) + (location_risk * 0.3)
    return min(100, max(0, risk_score))

def get_risk_level(risk_score: float) -> str:
    """Get risk level based on score."""
    if risk_score < 33:
        return "LOW"
    elif risk_score < 67:
        return "MEDIUM"
    else:
        return "HIGH"

def format_disease_name(disease_name: str) -> str:
    """Format disease name for display."""
    # Remove crop name and format: "Apple___Apple_scab" -> "Apple Scab"
    parts = disease_name.split("___")
    if len(parts) > 1:
        crop = parts[0].replace("_", " ")
        disease = parts[1].replace("_", " ")
        return f"{disease} ({crop})"
    return disease_name.replace("_", " ")

def convert_image_to_bytes(image: Image.Image) -> bytes:
    """Convert PIL Image to bytes."""
    img_io = io.BytesIO()
    image.save(img_io, format='PNG')
    img_io.seek(0)
    return img_io.getvalue()

def crop_to_square(image: Image.Image) -> Image.Image:
    """Crop image to square size."""
    width, height = image.size
    size = min(width, height)
    left = (width - size) // 2
    top = (height - size) // 2
    right = left + size
    bottom = top + size
    return image.crop((left, top, right, bottom))

def calculate_weather_risk(
    temperature: float,
    humidity: float,
    rainfall: float,
    disease_type: str = "general"
) -> float:
    """Calculate weather-based risk factor (0-100)."""
    from utils.constants import (
        HUMIDITY_THRESHOLD_HIGH,
        TEMPERATURE_MIN_RANGE,
        TEMPERATURE_MAX_RANGE,
        RAINFALL_THRESHOLD,
    )
    
    risk = 0.0
    
    # Humidity risk
    if humidity > HUMIDITY_THRESHOLD_HIGH:
        risk += 40
    elif humidity > 70:
        risk += 25
    
    # Temperature risk
    if TEMPERATURE_MIN_RANGE <= temperature <= TEMPERATURE_MAX_RANGE:
        risk += 35
    
    # Rainfall risk
    if rainfall > RAINFALL_THRESHOLD:
        risk += 25
    
    return min(100, risk)

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate distance between two coordinates in km using Haversine formula.
    """
    from math import radians, cos, sin, asin, sqrt
    
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat / 2) ** 2 + cos(lat1) * cos(lat2) * sin(dlon / 2) ** 2
    c = 2 * asin(sqrt(a))
    km = 6371 * c
    return km

def is_within_zone(
    user_lat: float,
    user_lng: float,
    zone_lat: float,
    zone_lng: float,
    radius_km: float
) -> bool:
    """Check if user location is within a zone."""
    distance = haversine_distance(user_lat, user_lng, zone_lat, zone_lng)
    return distance <= radius_km

def get_preventive_measures(risk_level: str, disease_info: dict) -> list:
    """Get preventive measures based on risk level and disease info."""
    measures = []
    
    if risk_level == "HIGH":
        measures.append("⚠️ URGENT: Take immediate action")
        measures.append("📋 Apply recommended fungicide/pesticide")
        measures.append("🌾 Isolate affected plants")
    elif risk_level == "MEDIUM":
        measures.append("⚠️ Monitor regularly")
        measures.append("🌿 Improve crop management")
    else:
        measures.append("✅ Continue regular monitoring")
    
    # Add disease-specific measures
    if "prevention" in disease_info:
        measures.extend(disease_info["prevention"])
    
    return measures

def validate_coordinates(latitude: float, longitude: float) -> bool:
    """Validate geographic coordinates."""
    return -90 <= latitude <= 90 and -180 <= longitude <= 180
