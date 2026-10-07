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
        # Use first dynamic prediction location as center if available
        self.default_center = self._get_center()
        self.default_zoom = 10

    def _get_dynamic_zones(self):
        """Fetch zones created from actual image uploads."""
        try:
            from services.prediction_store import get_map_zones_from_predictions
            return get_map_zones_from_predictions()
        except Exception as e:
            print(f"[WARN] Could not load prediction zones: {e}")
            return []

    def _get_center(self) -> dict:
        """Centre on the most recent upload location if available."""
        try:
            from services.prediction_store import get_all_predictions
            preds = get_all_predictions()
            if preds:
                newest = preds[0]  # newest first
                return {"lat": newest["latitude"], "lng": newest["longitude"]}
        except Exception:
            pass
        return {"lat": 28.6139, "lng": 77.2090}  # fallback: New Delhi
    
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
        """Get all zones (dynamic from uploads + static fallback)."""
        # ── 1. Dynamic zones from real predictions ────────────────────────────
        dynamic_zones = self._get_dynamic_zones()

        # ── 2. Only show static demo zones when no uploads exist ──────────────
        source_zones = dynamic_zones if dynamic_zones else self.zones

        zones_data = []
        for zone in source_zones:
            zone_info = {
                "id":            zone.get("name", "").replace(" ", "_").lower(),
                "name":          zone.get("name", "Unknown Zone"),
                "latitude":      zone["lat"],
                "longitude":     zone["lng"],
                "radius_km":     zone.get("radius", 2),
                "risk_level":    zone.get("risk", "LOW"),
                "color":         RISK_LEVELS.get(zone.get("risk", "LOW"), {}).get("color", "#22c55e"),
                "affected_crops": self._get_affected_crops_for_zone(zone),
                "description":   self._get_zone_description(zone),
                "source":        zone.get("source", "static"),
                # extra fields only on upload-based zones
                "detections":    zone.get("detections", []),
                "detection_count": zone.get("count", 0),
            }

            if user_lat is not None and user_lng is not None:
                distance = haversine_distance(user_lat, user_lng, zone["lat"], zone["lng"])
                zone_info["distance_km"] = round(distance, 2)
                zone_info["user_in_zone"] = distance <= zone.get("radius", 2)

            zones_data.append(zone_info)

        return {
            "zones":       zones_data,
            "total_zones": len(zones_data),
            "statistics":  self._get_zone_statistics(zones_data),
            "has_real_data": len(dynamic_zones) > 0,
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
    
    def _get_zone_statistics(self, zones_data=None) -> Dict:
        """Get statistics about zones."""
        if zones_data is None:
            zones_data = self.zones
        total_zones  = len(zones_data)
        high_risk    = sum(1 for z in zones_data if z.get("risk_level", z.get("risk")) == "HIGH")
        medium_risk  = sum(1 for z in zones_data if z.get("risk_level", z.get("risk")) == "MEDIUM")
        low_risk     = sum(1 for z in zones_data if z.get("risk_level", z.get("risk")) == "LOW")
        
        return {
            "total":       total_zones,
            "high_risk":   high_risk,
            "medium_risk": medium_risk,
            "low_risk":    low_risk,
        }
