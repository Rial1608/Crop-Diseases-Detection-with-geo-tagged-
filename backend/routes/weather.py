"""
Weather routes for weather data fetching
"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import Optional

router = APIRouter(prefix="/api", tags=["Weather"])

class LocationData(BaseModel):
    latitude: float
    longitude: float

@router.get("/weather")
async def get_weather(
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    """
    Get current weather for given coordinates.
    
    Parameters:
    - latitude: Location latitude
    - longitude: Location longitude
    """
    from services.weather_service import WeatherService
    from utils.helpers import validate_coordinates
    
    try:
        if not validate_coordinates(latitude, longitude):
            raise HTTPException(status_code=400, detail="Invalid coordinates")
        
        weather_service = WeatherService()
        weather_data = weather_service.get_weather(latitude, longitude)
        
        return {
            "success": True,
            "data": weather_data,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching weather: {str(e)}"
        )

@router.get("/weather/forecast")
async def get_forecast(
    latitude: float = Query(...),
    longitude: float = Query(...),
    days: int = Query(5, min=1, max=10),
):
    """
    Get weather forecast for given coordinates.
    
    Parameters:
    - latitude: Location latitude
    - longitude: Location longitude
    - days: Number of days to forecast (1-10)
    """
    from services.weather_service import WeatherService
    from utils.helpers import validate_coordinates
    
    try:
        if not validate_coordinates(latitude, longitude):
            raise HTTPException(status_code=400, detail="Invalid coordinates")
        
        weather_service = WeatherService()
        forecast_data = weather_service.get_forecast(latitude, longitude, days)
        
        return {
            "success": True,
            "data": forecast_data,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching forecast: {str(e)}"
        )

@router.post("/weather/risk")
async def calculate_weather_risk(
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    """
    Calculate disease risk based on current weather.
    
    Parameters:
    - latitude: Location latitude
    - longitude: Location longitude
    """
    from services.weather_service import WeatherService
    from utils.helpers import calculate_weather_risk, validate_coordinates
    
    try:
        if not validate_coordinates(latitude, longitude):
            raise HTTPException(status_code=400, detail="Invalid coordinates")
        
        weather_service = WeatherService()
        weather_data = weather_service.get_weather(latitude, longitude)
        
        weather_risk = calculate_weather_risk(
            temperature=weather_data.get("temperature", 20),
            humidity=weather_data.get("humidity", 50),
            rainfall=weather_data.get("rainfall", 0),
        )
        
        # Determine risk level
        if weather_risk < 33:
            risk_level = "LOW"
        elif weather_risk < 67:
            risk_level = "MEDIUM"
        else:
            risk_level = "HIGH"
        
        return {
            "success": True,
            "weather_data": weather_data,
            "weather_risk": weather_risk,
            "risk_level": risk_level,
            "message": f"Weather conditions show {risk_level} risk for disease spread",
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error calculating weather risk: {str(e)}"
        )
