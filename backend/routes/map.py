"""
Map and geolocation routes
"""
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

router = APIRouter(prefix="/api", tags=["Map"])

@router.get("/map/config")
async def get_map_config():
    """Get map configuration and default settings."""
    from services.map_service import MapService
    
    try:
        map_service = MapService()
        config = map_service.get_map_config()
        
        return {
            "success": True,
            "config": config,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting map config: {str(e)}"
        )

@router.get("/map/zones")
async def get_risk_zones(
    latitude: Optional[float] = Query(None),
    longitude: Optional[float] = Query(None),
):
    """
    Get all risk zones with details.
    
    Parameters:
    - latitude: Optional user latitude
    - longitude: Optional user longitude
    """
    from services.map_service import MapService
    
    try:
        map_service = MapService()
        zones_data = map_service.get_zones_data(latitude, longitude)
        
        return {
            "success": True,
            "zones": zones_data,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error fetching zones: {str(e)}"
        )

@router.get("/map/user-status")
async def get_user_zone_status(
    latitude: float = Query(...),
    longitude: float = Query(...),
):
    """
    Get user's current zone status and nearby zones.
    
    Parameters:
    - latitude: User latitude
    - longitude: User longitude
    """
    from services.map_service import MapService
    from utils.helpers import validate_coordinates
    
    try:
        if not validate_coordinates(latitude, longitude):
            raise HTTPException(status_code=400, detail="Invalid coordinates")
        
        map_service = MapService()
        status = map_service.get_user_zone_status(latitude, longitude)
        
        return {
            "success": True,
            "status": status,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting user status: {str(e)}"
        )

@router.get("/map/heatmap")
async def get_heatmap_data():
    """Get heatmap data for disease risk visualization."""
    from services.map_service import MapService
    
    try:
        map_service = MapService()
        heatmap_data = map_service.get_heatmap_data()
        
        return {
            "success": True,
            "heatmap": heatmap_data,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting heatmap data: {str(e)}"
        )

@router.get("/map/markers")
async def get_zone_markers():
    """Get zone markers for map display."""
    from services.map_service import MapService
    
    try:
        map_service = MapService()
        markers = map_service.get_markers_data()
        
        return {
            "success": True,
            "markers": markers,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting markers: {str(e)}"
        )

@router.get("/map/geojson")
async def get_geojson_zones():
    """Get zones as GeoJSON format."""
    from ..services.map_service import MapService
    
    try:
        map_service = MapService()
        geojson = map_service.get_risk_zones_geojson()
        
        return {
            "success": True,
            "geojson": geojson,
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Error getting GeoJSON: {str(e)}"
        )
