"""
Risk analysis routes combining all predictions
"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api", tags=["Risk"])

@router.get("/risk/estimate")
async def estimate_risk(
    disease_confidence: float = Query(..., ge=0, le=100),
    temperature: float = Query(20),
    humidity: float = Query(50, ge=0, le=100),
    rainfall: float = Query(0),
    latitude: float = Query(28.6139),
    longitude: float = Query(77.2090),
    is_diseased: bool = Query(True),
):
    """
    Estimate disease risk based on multiple factors.
    
    Parameters:
    - disease_confidence: Disease detection confidence (0-100)
    - temperature: Current temperature in Celsius
    - humidity: Current humidity percentage (0-100)
    - rainfall: Recent rainfall in mm
    - latitude: Location latitude
    - longitude: Location longitude
    - is_diseased: Whether disease was detected
    """
    from services.risk_calculator import RiskCalculator
    
    try:
        risk_calculator = RiskCalculator()
        
        risk_analysis = risk_calculator.calculate_overall_risk(
            disease_confidence=disease_confidence,
            temperature=temperature,
            humidity=humidity,
            rainfall=rainfall,
            latitude=latitude,
            longitude=longitude,
            is_diseased=is_diseased,
        )
        
        return {
            "success": True,
            "risk_analysis": risk_analysis,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error estimating risk: {str(e)}"
        )

@router.get("/risk/report")
async def generate_risk_report(
    disease_name: str = Query(...),
    disease_confidence: float = Query(..., ge=0, le=100),
    temperature: float = Query(20),
    humidity: float = Query(50, ge=0, le=100),
    rainfall: float = Query(0),
    latitude: float = Query(28.6139),
    longitude: float = Query(77.2090),
    is_diseased: bool = Query(True),
):
    """
    Generate comprehensive risk report.
    
    Parameters:
    - disease_name: Name of detected disease
    - disease_confidence: Detection confidence (0-100)
    - temperature: Current temperature
    - humidity: Current humidity
    - rainfall: Recent rainfall
    - latitude: Location latitude
    - longitude: Location longitude
    - is_diseased: Whether disease was detected
    """
    from services.risk_calculator import RiskCalculator
    from utils.constants import DISEASE_TREATMENTS
    
    try:
        from utils.helpers import format_disease_name
        
        # Get disease info
        disease_info = DISEASE_TREATMENTS.get(disease_name, {
            "name": format_disease_name(disease_name),
            "causes": "Unknown",
            "symptoms": "Unknown",
            "prevention": ["Monitor regularly"],
            "treatment": ["Consult agricultural expert"],
            "risk_factors": ["Various environmental conditions"],
        })
        
        risk_calculator = RiskCalculator()
        
        report = risk_calculator.generate_risk_report(
            disease_name=disease_info.get("name", disease_name),
            disease_confidence=disease_confidence,
            weather_data={
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
            },
            location={
                "latitude": latitude,
                "longitude": longitude,
            },
            disease_info=disease_info,
            is_diseased=is_diseased,
        )
        
        return {
            "success": True,
            "report": report,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error generating report: {str(e)}"
        )

@router.get("/risk/alert-status")
async def check_alert_status(
    temperature: float = Query(20),
    humidity: float = Query(50, ge=0, le=100),
    rainfall: float = Query(0),
    latitude: float = Query(28.6139),
    longitude: float = Query(77.2090),
):
    """
    Check if high-risk alert conditions are present.
    """
    from ..utils.constants import HUMIDITY_THRESHOLD_HIGH, RAINFALL_THRESHOLD
    
    alert_conditions = []
    alert_level = "SAFE"
    
    if humidity > HUMIDITY_THRESHOLD_HIGH:
        alert_conditions.append("⚠️ High humidity - Favorable for disease spread")
        alert_level = "ALERT"
    
    if rainfall > RAINFALL_THRESHOLD:
        alert_conditions.append("⚠️ Recent rainfall - Moisture increases disease risk")
        alert_level = "ALERT"
    
    if temperature < 10 or temperature > 35:
        alert_conditions.append("⚠️ Extreme temperature - Uncommon conditions")
        alert_level = "CAUTION"
    
    return {
        "success": True,
        "alert_level": alert_level,
        "conditions": alert_conditions,
        "current_weather": {
            "temperature": temperature,
            "humidity": humidity,
            "rainfall": rainfall,
        },
    }
