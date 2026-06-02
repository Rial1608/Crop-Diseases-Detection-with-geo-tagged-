"""
Shared application state – avoids circular imports between main.py and route modules.
"""
from services.disease_detector import DiseaseDetector
from typing import Optional

# Set during lifespan startup in main.py, read by route handlers.
disease_detector: Optional[DiseaseDetector] = None
