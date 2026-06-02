"""
Risk calculation service combining disease, weather, and location data
"""
from typing import Dict, Tuple, Optional
from utils.helpers import (
    calculate_risk_score,
    get_risk_level,
    calculate_weather_risk,
    get_preventive_measures,
    is_within_zone,
)
from utils.constants import GEOGRAPHIC_ZONES, RISK_LEVELS, WEATHER_RISK_MULTIPLIER

class RiskCalculator:
    """Calculate disease risk based on multiple factors."""
    
    def __init__(self):
        self.zones = GEOGRAPHIC_ZONES
    
    def calculate_overall_risk(
        self,
        disease_confidence: float,
        temperature: float,
        humidity: float,
        rainfall: float,
        latitude: float,
        longitude: float,
        is_diseased: bool = True,
    ) -> Dict:
        """Calculate overall risk combining all factors."""
        
        if not is_diseased:
            return {
                "risk_score": 0,
                "risk_level": "LOW",
                "risk_color": RISK_LEVELS["LOW"]["color"],
                "message": " No plant disease detected",
                "weather_risk": 0,
                "location_risk": 0,
                "recommendation": "Continue regular monitoring and good farming practices.",
            }
        
        # Calculate component risks
        weather_risk = calculate_weather_risk(temperature, humidity, rainfall)
        location_risk = self._calculate_location_risk(latitude, longitude)
        
        # Overall risk score (disease_confidence is 0-100)
        overall_risk = calculate_risk_score(
            confidence=disease_confidence,
            weather_risk=weather_risk,
            location_risk=location_risk,
        )
        
        risk_level = get_risk_level(overall_risk)
        risk_color = RISK_LEVELS[risk_level]["color"]
        
        return {
            "risk_score": round(overall_risk, 2),
            "risk_level": risk_level,
            "risk_color": risk_color,
            "component_scores": {
                "disease_confidence": disease_confidence,
                "weather_risk": weather_risk,
                "location_risk": location_risk,
            },
            "message": self._get_risk_message(risk_level, temperature, humidity),
            "weather_conditions": {
                "temperature": temperature,
                "humidity": humidity,
                "rainfall": rainfall,
                "favorable_for_disease": self._is_disease_favorable(temperature, humidity),
            },
            "location_info": self._get_location_info(latitude, longitude),
            "recommendation": self._get_recommendation(risk_level),
        }
    
    def _calculate_location_risk(self, latitude: float, longitude: float) -> float:
        """Calculate location-based risk."""
        location_risk = 0.0
        
        for zone in self.zones:
            if is_within_zone(latitude, longitude, zone["lat"], zone["lng"], zone["radius"]):
                risk_mapping = {
                    "HIGH": 80,
                    "MEDIUM": 50,
                    "LOW": 20,
                }
                location_risk = max(location_risk, risk_mapping.get(zone["risk"], 0))
        
        return location_risk
    
    def _get_location_info(self, latitude: float, longitude: float) -> Dict:
        """Get location-based zone information."""
        info = {
            "latitude": latitude,
            "longitude": longitude,
            "nearby_zones": [],
        }
        
        for zone in self.zones:
            if is_within_zone(latitude, longitude, zone["lat"], zone["lng"], zone["radius"] + 2):
                info["nearby_zones"].append({
                    "name": zone["name"],
                    "risk": zone["risk"],
                    "lat": zone["lat"],
                    "lng": zone["lng"],
                })
        
        return info
    
    def _is_disease_favorable(self, temperature: float, humidity: float) -> bool:
        """Check if weather conditions are favorable for disease."""
        from utils.constants import HUMIDITY_THRESHOLD_HIGH, TEMPERATURE_MIN_RANGE, TEMPERATURE_MAX_RANGE
        
        optimal_temp = TEMPERATURE_MIN_RANGE <= temperature <= TEMPERATURE_MAX_RANGE
        high_humidity = humidity > HUMIDITY_THRESHOLD_HIGH
        
        return optimal_temp and high_humidity
    
    def _get_risk_message(self, risk_level: str, temperature: float, humidity: float) -> str:
        """Get risk message based on level and conditions."""
        messages = {
            "LOW": "🟢 Low risk detected. Maintain regular crop monitoring.",
            "MEDIUM": "🟡 Moderate risk detected. Enhance disease management practices.",
            "HIGH": "🔴 High risk detected. Immediate preventive action recommended.",
        }
        
        if humidity > 85:
            messages["MEDIUM"] = "🟡 Moderate risk with high humidity. Watch for disease symptoms."
            messages["HIGH"] = "🔴 CRITICAL: High humidity + disease risk. Take action immediately!"
        
        return messages.get(risk_level, "Unknown risk level")
    
    def _get_recommendation(self, risk_level: str) -> str:
        """Get actionable recommendations."""
        recommendations = {
            "LOW": "✅ Continue regular monitoring. Good farming practices are sufficient.",
            "MEDIUM": "⚠️ Spray preventive fungicide. Improve air circulation. Remove infected leaves.",
            "HIGH": "🚨 URGENT ACTION: Apply recommended fungicide. Isolate affected plants. Consult agronomist.",
        }
        
        return recommendations.get(risk_level, "Monitor and seek expert advice")
    
    def generate_risk_report(
        self,
        disease_name: str,
        disease_confidence: float,
        weather_data: Dict,
        location: Dict,
        disease_info: Dict,
        is_diseased: bool,
    ) -> Dict:
        """Generate comprehensive risk report."""
        
        risk_analysis = self.calculate_overall_risk(
            disease_confidence=disease_confidence,
            temperature=weather_data.get("temperature", 0),
            humidity=weather_data.get("humidity", 0),
            rainfall=weather_data.get("rainfall", 0),
            latitude=location.get("latitude", 0),
            longitude=location.get("longitude", 0),
            is_diseased=is_diseased,
        )
        
        preventive_measures = get_preventive_measures(
            risk_analysis["risk_level"],
            disease_info,
        )
        
        return {
            "disease": {
                "name": disease_name,
                "confidence": disease_confidence,
                "is_diseased": is_diseased,
                "info": disease_info,
            },
            "risk_analysis": risk_analysis,
            "preventive_measures": preventive_measures,
            "next_steps": self._get_next_steps(risk_analysis["risk_level"]),
        }
    
    def _get_next_steps(self, risk_level: str) -> list:
        """Get next steps for farmer."""
        steps = {
            "LOW": [
                "1. Continue routine monitoring",
                "2. Document crop health weekly",
                "3. Maintain proper field sanitation",
                "4. Follow recommended crop rotation",
            ],
            "MEDIUM": [
                "1. Prepare fungicide/pesticide spray",
                "2. Monitor weather forecast closely",
                "3. Inspect crops regularly for symptoms",
                "4. Plan preventive spray schedule",
                "5. Contact local agricultural extension",
            ],
            "HIGH": [
                "1. ⚠️ IMMEDIATE: Prepare affected area for treatment",
                "2. 🚨 Apply recommended fungicide TODAY",
                "3. 📋 Isolate/quarantine affected plants",
                "4. 📞 Contact agricultural expert URGENTLY",
                "5. 📸 Document for future reference",
                "6. 🌾 Check neighboring fields",
            ],
        }
        
        return steps.get(risk_level, [])
