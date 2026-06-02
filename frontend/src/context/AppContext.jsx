/**
 * AppContext — single source of truth for the whole app.
 *
 * Shape of state:
 *  userLocation  : { latitude, longitude } | null
 *  weather       : WeatherObject | null
 *  weatherLoading: boolean
 *  weatherError  : string | null
 *  lastPrediction: PredictionObject | null   ← set by Upload page
 *  originalImage : string | null             ← data URL of last uploaded image
 *  analysisHistory: PredictionObject[]       ← grows with each upload
 */
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { getWeather } from '../utils/api';

/* ── Fallback weather used if the real API fails ─────────── */
export const FALLBACK_WEATHER = {
  temperature:  26,
  feels_like:   28,
  humidity:     65,
  wind_speed:   12,
  rainfall:     0.1,
  visibility:   9000,
  description:  'Partly Cloudy',
  icon:         '02d',
  location:     { name: 'New Delhi' },
  is_demo:      true,
};

/* ── Weather-risk helper used app-wide ──────────────────── */
export function computeWeatherRisk(weather) {
  if (!weather) return { level: 'Unknown', color: '#6b7280', badge: 'badge-gray' };
  const h = weather.humidity   ?? 0;
  const t = weather.temperature ?? 0;
  const r = weather.rainfall    ?? 0;

  let score = 0;
  if (h >= 80) score += 3;
  else if (h >= 70) score += 2;
  else if (h >= 60) score += 1;

  if (t >= 32) score += 2;
  else if (t >= 28) score += 1;

  if (r >= 5)  score += 2;
  else if (r >= 1) score += 1;

  if (score >= 5) return { level: 'High',   color: '#b91c1c', badge: 'badge-red'    };
  if (score >= 3) return { level: 'Medium', color: '#a16207', badge: 'badge-yellow' };
  return             { level: 'Low',    color: '#15803d', badge: 'badge-green'  };
}

/* ── Default location: New Delhi ─────────────────────────── */
const DEFAULT_LOCATION = { latitude: 28.6139, longitude: 77.2090 };

/* ── Context ─────────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [userLocation,    setUserLocation]    = useState(null);
  const [weather,         setWeather]         = useState(null);
  const [weatherLoading,  setWeatherLoading]  = useState(true);
  const [weatherError,    setWeatherError]    = useState(null);
  const [lastPrediction,  setLastPrediction]  = useState(null);
  const [originalImage,   setOriginalImage]   = useState(null);   // data URL
  const [analysisHistory, setAnalysisHistory] = useState([]);

  /* ── 1. Geolocation ──────────────────────────────────── */
  useEffect(() => {
    if (!navigator.geolocation) {
      setUserLocation(DEFAULT_LOCATION);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      ()    => setUserLocation(DEFAULT_LOCATION),
      { timeout: 8000 }
    );
  }, []);

  /* ── 2. Weather fetch — runs once when location resolves */
  const fetchWeather = useCallback(async (loc) => {
    if (!loc) return;
    setWeatherLoading(true);
    setWeatherError(null);
    try {
      const data = await getWeather(loc.latitude, loc.longitude);
      setWeather(data?.temperature != null ? data : FALLBACK_WEATHER);
    } catch {
      setWeather(FALLBACK_WEATHER);
      setWeatherError('Could not fetch live weather — showing estimated data.');
    } finally {
      setWeatherLoading(false);
    }
  }, []);

  useEffect(() => { fetchWeather(userLocation); }, [userLocation, fetchWeather]);

  /* ── 3. Save a new prediction ──────────────────────────── */
  const savePrediction = useCallback((predictionResult, imageDataUrl = null) => {
    setLastPrediction(predictionResult);
    if (imageDataUrl) setOriginalImage(imageDataUrl);
    setAnalysisHistory(prev => [
      {
        id:          Date.now(),
        timestamp:   new Date().toISOString(),
        diseaseName: predictionResult?.prediction?.disease_name
                     || predictionResult?.prediction?.disease_class
                     || 'Unknown',
        confidence:  (predictionResult?.prediction?.confidence ?? 0).toFixed(1),
        isHealthy:   !predictionResult?.prediction?.is_diseased,
        riskLevel:   predictionResult?.risk_analysis?.risk_level || 'Unknown',
        cropType:    predictionResult?.prediction?.crop_type || '',
      },
      ...prev,
    ].slice(0, 20)); // keep last 20
  }, []);

  /* ── 4. Manually refresh weather ──────────────────────── */
  const refreshWeather = useCallback(() => fetchWeather(userLocation), [fetchWeather, userLocation]);

  const value = {
    /* location */
    userLocation,
    /* weather */
    weather, weatherLoading, weatherError, refreshWeather,
    /* predictions */
    lastPrediction, savePrediction,
    originalImage,
    analysisHistory,
    /* derived */
    weatherRisk: computeWeatherRisk(weather),
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

/* ── Hook ─────────────────────────────────────────────────── */
export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
