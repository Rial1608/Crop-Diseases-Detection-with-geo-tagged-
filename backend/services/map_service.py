"""
Map and geolocation service for risk zone visualization
"""
from typing import Dict, List, Tuple, Optional
from utils.constants import GEOGRAPHIC_ZONES, RISK_LEVELS
from utils.helpers import is_within_zone, haversine_distance

class MapService:
    """Handle map data and zone visualization."""
    
    def __init__(self):
        self.zones = GEOGRAPHIC_ZONES
        self.default_center = {"lat": 28.6139, "lng": 77.2090}
        self.default_zoom = 10
    
    def get_map_config(self) -> Dict:
        """Get map configuration."""
        return {
            "center": self.default_center,
            "zoom": self.default_zoom,
            "default_bounds": {
                "north": 28.8000,
                "south": 28.4000,
                "east": 77.5000,
                "west": 76.9000,
            },
        }
    
    def get_zones_data(self, user_lat: Optional[float] = None, user_lng: Optional[float] = None) -> Dict:
        """Get all zones with enhanced data."""
        zones_data = []
        
        for zone in self.zones:
            zone_info = {
                "id": zone["name"].replace(" ", "_").lower(),
                "name": zone["name"],
                "latitude": zone["lat"],
                "longitude": zone["lng"],
                "radius_km": zone["radius"],
                "risk_level": zone["risk"],
                "color": RISK_LEVELS.get(zone["risk"], {}).get("color", "#999"),
                "affected_crops": self._get_affected_crops_for_zone(zone),
                "description": self._get_zone_description(zone),
            }
            
            # Add distance if user location provided
            if user_lat is not None and user_lng is not None:
                distance = haversine_distance(user_lat, user_lng, zone["lat"], zone["lng"])
                zone_info["distance_km"] = round(distance, 2)
                zone_info["user_in_zone"] = distance <= zone["radius"]
            
            zones_data.append(zone_info)
        
        return {
            "zones": zones_data,
            "total_zones": len(zones_data),
            "statistics": self._get_zone_statistics(),
        }
    
    def get_user_zone_status(self, latitude: float, longitude: float) -> Dict:
        """Get user location status relative to zones."""
        status = {
            "latitude": latitude,
            "longitude": longitude,
            "current_zone": None,
            "nearby_zones": [],
            "overall_risk": "LOW",
        }
        
        # Check if in any zone
        for zone in self.zones:
            if is_within_zone(latitude, longitude, zone["lat"], zone["lng"], zone["radius"]):
                status["current_zone"] = {
                    "name": zone["name"],
                    "risk": zone["risk"],
                    "color": RISK_LEVELS.get(zone["risk"], {}).get("color", "#999"),
                }
                status["overall_risk"] = zone["risk"]
        
        # Get nearby zones
        for zone in self.zones:
            distance = haversine_distance(latitude, longitude, zone["lat"], zone["lng"])
            if zone["radius"] < distance <= zone["radius"] + 5:
                status["nearby_zones"].append({
                    "name": zone["name"],
                    "distance_km": round(distance, 2),
                    "risk": zone["risk"],
                })
        
        return status
    
    def get_heatmap_data(self) -> Dict:
        """Get heatmap data for visualization."""
        heatmap_points = []
        
        for zone in self.zones:
            # Risk level to intensity mapping
            risk_intensity = {
                "HIGH": 0.9,
                "MEDIUM": 0.6,
                "LOW": 0.3,
            }
            
            # Create heatmap points for zone
            intensity = risk_intensity.get(zone["risk"], 0.5)
            
            heatmap_points.append({
                "lat": zone["lat"],
                "lng": zone["lng"],
                "intensity": intensity,
                "zone_name": zone["name"],
            })
        
        return {
            "type": "heatmap",
            "data": heatmap_points,
            "min_intensity": 0,
            "max_intensity": 1,
        }
    
    def get_markers_data(self) -> List[Dict]:
        """Get marker data for zones."""
        markers = []
        
        for zone in self.zones:
            markers.append({
                "type": "marker",
                "latitude": zone["lat"],
                "longitude": zone["lng"],
                "title": zone["name"],
                "risk": zone["risk"],
                "color": RISK_LEVELS.get(zone["risk"], {}).get("color", "#999"),
                "radius": zone["radius"],
                "popup": {
                    "title": zone["name"],
                    "content": f"Risk Level: {zone['risk']}",
                    "details": f"Radius: {zone['radius']}km",
                },
            })
        
        return markers
    
    def get_risk_zones_geojson(self) -> Dict:
        """Get zones as GeoJSON for mapping libraries."""
        features = []
        
        for zone in self.zones:
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [zone["lng"], zone["lat"]],
                },
                "properties": {
                    "name": zone["name"],
                    "risk": zone["risk"],
                    "radius": zone["radius"],
                    "color": RISK_LEVELS.get(zone["risk"], {}).get("color", "#999"),
                },
            }
            features.append(feature)
        
        return {
            "type": "FeatureCollection",
            "features": features,
        }
    
    def _get_affected_crops_for_zone(self, zone: Dict) -> List[str]:
        """Get crops affected in a zone based on risk."""
        crops_by_risk = {
            "HIGH": ["Tomato", "Potato", "Corn", "Apple"],
            "MEDIUM": ["Tomato", "Potato", "Grape"],
            "LOW": ["Tomato", "Apple", "Blueberry"],
        }
        
        return crops_by_risk.get(zone["risk"], ["Various crops"])
    
    def _get_zone_description(self, zone: Dict) -> str:
        """Get zone description."""
        descriptions = {
            "HIGH": "Critical disease risk zone - Heightened monitoring required",
            "MEDIUM": "Moderate disease risk zone - Standard precautions recommended",
            "LOW": "Low disease risk zone - Good conditions for farming",
        }
        
        return descriptions.get(zone["risk"], "Unknown risk zone")
    
    def _get_zone_statistics(self) -> Dict:
        """Get statistics about zones."""
        total_zones = len(self.zones)
        high_risk = sum(1 for z in self.zones if z["risk"] == "HIGH")
        medium_risk = sum(1 for z in self.zones if z["risk"] == "MEDIUM")
        low_risk = sum(1 for z in self.zones if z["risk"] == "LOW")
        
        return {
            "total": total_zones,
            "high_risk": high_risk,
            "medium_risk": medium_risk,
            "low_risk": low_risk,
        }
