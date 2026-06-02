"""
Weather service – real OpenWeatherMap API with graceful demo fallback.
"""
import os
import random
from datetime import datetime, timedelta
from typing import Dict, Optional

import requests


class WeatherService:
    """Fetch and format weather data from OpenWeatherMap."""

    BASE_URL = "https://api.openweathermap.org/data/2.5/weather"
    FORECAST_URL = "https://api.openweathermap.org/data/2.5/forecast"

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENWEATHER_API_KEY", "")
        # Treat placeholder as missing
        if self.api_key in ("", "your_api_key_here"):
            self.api_key = ""

    # ── Current weather ───────────────────────────────────────────────────────
    def get_weather(self, latitude: float, longitude: float) -> Dict:
        if not self.api_key:
            print("⚠️  No OpenWeatherMap API key – returning demo weather data")
            return self._demo_weather(latitude, longitude)

        try:
            resp = requests.get(
                self.BASE_URL,
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "appid": self.api_key,
                    "units": "metric",
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()
            return self._format(data)

        except requests.exceptions.ConnectionError:
            print("⚠️  No internet – returning demo weather data")
            return self._demo_weather(latitude, longitude)
        except requests.exceptions.Timeout:
            print("⚠️  Weather API timeout – returning demo data")
            return self._demo_weather(latitude, longitude)
        except requests.exceptions.HTTPError as e:
            print(f"⚠️  Weather API HTTP error ({e}) – returning demo data")
            return self._demo_weather(latitude, longitude)
        except Exception as e:
            print(f"⚠️  Weather error: {e} – returning demo data")
            return self._demo_weather(latitude, longitude)

    # ── Forecast ──────────────────────────────────────────────────────────────
    def get_forecast(self, latitude: float, longitude: float, days: int = 5) -> Dict:
        if not self.api_key:
            return self._demo_forecast(latitude, longitude, days)

        try:
            resp = requests.get(
                self.FORECAST_URL,
                params={
                    "lat": latitude,
                    "lon": longitude,
                    "appid": self.api_key,
                    "units": "metric",
                },
                timeout=10,
            )
            resp.raise_for_status()
            data = resp.json()

            daily: Dict[str, list] = {}
            for item in data.get("list", []):
                date_str = str(datetime.fromtimestamp(item["dt"]).date())
                daily.setdefault(date_str, []).append(item)

            forecast = {}
            for date_str, items in daily.items():
                temps = [i["main"]["temp"] for i in items]
                humids = [i["main"]["humidity"] for i in items]
                forecast[date_str] = {
                    "date": date_str,
                    "avg_temp": round(sum(temps) / len(temps), 1),
                    "min_temp": round(min(temps), 1),
                    "max_temp": round(max(temps), 1),
                    "avg_humidity": round(sum(humids) / len(humids), 1),
                    "description": items[0].get("weather", [{}])[0].get("description", ""),
                }

            return {
                "location": {"latitude": latitude, "longitude": longitude},
                "forecast": forecast,
                "is_demo": False,
            }

        except Exception as e:
            print(f"⚠️  Forecast API error: {e}")
            return self._demo_forecast(latitude, longitude, days)

    # ── Formatting ────────────────────────────────────────────────────────────
    def _format(self, data: Dict) -> Dict:
        main = data.get("main", {})
        weather = data.get("weather", [{}])[0]
        wind = data.get("wind", {})
        rain = data.get("rain", {})

        return {
            "location": {
                "name": data.get("name", "Unknown"),
                "latitude": data.get("coord", {}).get("lat"),
                "longitude": data.get("coord", {}).get("lon"),
            },
            "temperature": round(main.get("temp", 0), 1),
            "feels_like": round(main.get("feels_like", 0), 1),
            "humidity": main.get("humidity", 0),
            "pressure": main.get("pressure", 0),
            "description": weather.get("description", "Unknown"),
            "icon": weather.get("icon", "01d"),
            "wind_speed": round(wind.get("speed", 0), 1),
            "wind_direction": wind.get("deg", 0),
            "rainfall": round(rain.get("1h", 0), 1),
            "cloudiness": data.get("clouds", {}).get("all", 0),
            "visibility": data.get("visibility", 10000),
            "timestamp": datetime.fromtimestamp(data.get("dt", 0)).isoformat(),
            "is_demo": False,
        }

    # ── Demo fallback ─────────────────────────────────────────────────────────
    def _demo_weather(self, lat: float, lon: float) -> Dict:
        return {
            "location": {
                "name": f"Demo Location ({lat:.2f}, {lon:.2f})",
                "latitude": lat,
                "longitude": lon,
            },
            "temperature": round(random.uniform(18, 34), 1),
            "feels_like": round(random.uniform(18, 36), 1),
            "humidity": random.randint(35, 90),
            "pressure": random.randint(990, 1020),
            "description": random.choice(
                ["Clear sky", "Partly cloudy", "Overcast", "Light rain", "Scattered clouds"]
            ),
            "icon": "02d",
            "wind_speed": round(random.uniform(1, 18), 1),
            "wind_direction": random.randint(0, 360),
            "rainfall": round(random.uniform(0, 8), 1),
            "cloudiness": random.randint(0, 100),
            "visibility": 10000,
            "timestamp": datetime.now().isoformat(),
            "is_demo": True,
        }

    def _demo_forecast(self, lat: float, lon: float, days: int) -> Dict:
        today = datetime.now().date()
        forecast = {}
        for i in range(days):
            d = str(today + timedelta(days=i))
            forecast[d] = {
                "date": d,
                "avg_temp": round(random.uniform(18, 32), 1),
                "min_temp": round(random.uniform(12, 20), 1),
                "max_temp": round(random.uniform(28, 38), 1),
                "avg_humidity": random.randint(40, 85),
                "description": random.choice(["Clear", "Cloudy", "Rainy", "Partly cloudy"]),
            }
        return {
            "location": {"latitude": lat, "longitude": lon},
            "forecast": forecast,
            "is_demo": True,
        }
