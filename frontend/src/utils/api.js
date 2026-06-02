import axios from 'axios';

// In development, use empty baseURL so requests go through Vite's proxy
// (configured in vite.config.js to forward /api/* to localhost:8000).
// This avoids CORS entirely because the browser sees same-origin requests.
// In production or when VITE_API_URL is explicitly set, use the full URL.
const API_BASE_URL = import.meta.env.VITE_API_URL || '';

console.log('🔗 API Base URL:', API_BASE_URL || '(using Vite proxy)');

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// ── Interceptors for debugging ───────────────────────────────────────────────
api.interceptors.request.use(
  (config) => {
    console.log('📤 API Request:', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('📥 API Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ Response Error:', error.message, error.response?.status);
    return Promise.reject(error);
  }
);

// ── Prediction API ───────────────────────────────────────────────────────────
export const predictDisease = async (file, latitude, longitude) => {
  console.log('📤 predictDisease:', file.name, file.size, 'bytes');

  const formData = new FormData();
  formData.append('file', file);
  if (latitude != null) formData.append('latitude', latitude);
  if (longitude != null) formData.append('longitude', longitude);

  try {
    const response = await api.post('/api/predict', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    });

    console.log('✅ Prediction response:', response.data);
    return response.data; // already the JSON body
  } catch (error) {
    const msg =
      error.response?.data?.detail || error.message || 'Unknown error';
    console.error('❌ Prediction failed:', msg);
    throw new Error(msg);
  }
};

// ── Weather API ──────────────────────────────────────────────────────────────
export const getWeather = async (latitude, longitude) => {
  try {
    const response = await api.get('/api/weather', {
      params: { latitude, longitude },
    });
    // Backend returns { success, data: { ...weather } }
    // Return the weather object directly
    const body = response.data;
    return body.data || body;
  } catch (error) {
    console.error('❌ Weather API failed:', error.message);
    // Return a safe fallback so the UI doesn't crash
    return {
      temperature: 25,
      humidity: 65,
      wind_speed: 10,
      rainfall: 0,
      description: 'Unavailable',
      visibility: 10000,
      is_demo: true,
      location: { name: 'Unknown' },
    };
  }
};

export const getForecast = async (latitude, longitude, days = 5) => {
  try {
    const response = await api.get('/api/weather/forecast', {
      params: { latitude, longitude, days },
    });
    return response.data?.data || response.data;
  } catch (error) {
    console.error('❌ Forecast API failed:', error.message);
    return { forecast: {} };
  }
};

export const getWeatherRisk = async (latitude, longitude) => {
  try {
    const response = await api.post('/api/weather/risk', null, {
      params: { latitude, longitude },
    });
    return response.data;
  } catch (error) {
    console.error('❌ Weather risk failed:', error.message);
    return { risk_score: 50 };
  }
};

// ── Risk API ─────────────────────────────────────────────────────────────────
export const estimateRisk = async (params) => {
  try {
    const response = await api.get('/api/risk/estimate', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Risk estimation failed:', error.message);
    return { risk_score: 50, risk_level: 'MEDIUM' };
  }
};

export const generateRiskReport = async (params) => {
  try {
    const response = await api.get('/api/risk/report', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Risk report failed:', error.message);
    return { report: 'Demo Report' };
  }
};

export const checkAlertStatus = async (params) => {
  try {
    const response = await api.get('/api/risk/alert-status', { params });
    return response.data;
  } catch (error) {
    console.error('❌ Alert status failed:', error.message);
    return { alert: false };
  }
};

// ── Map API ──────────────────────────────────────────────────────────────────
export const getMapConfig = async () => {
  try {
    const response = await api.get('/api/map/config');
    return response.data;
  } catch (error) {
    console.error('❌ Map config failed:', error.message);
    return { config: { center: [28.6139, 77.209], zoom: 10 } };
  }
};

export const getRiskZones = async (latitude, longitude) => {
  try {
    const response = await api.get('/api/map/zones', {
      params: { latitude, longitude },
    });
    return response.data;
  } catch (error) {
    console.error('❌ Risk zones failed:', error.message);
    return { zones: { zones: [] } };
  }
};

export const getUserZoneStatus = async (latitude, longitude) => {
  try {
    const response = await api.get('/api/map/user-status', {
      params: { latitude, longitude },
    });
    return response.data;
  } catch (error) {
    console.error('❌ User zone status failed:', error.message);
    return { status: { zone: 'Unknown', risk_level: 'MEDIUM' } };
  }
};

export const getHeatmapData = async () => {
  try {
    const response = await api.get('/api/map/heatmap');
    return response.data;
  } catch (error) {
    console.error('❌ Heatmap failed:', error.message);
    return { heatmap: [] };
  }
};

export const getZoneMarkers = async () => {
  try {
    const response = await api.get('/api/map/markers');
    return response.data;
  } catch (error) {
    console.error('❌ Zone markers failed:', error.message);
    return { markers: [] };
  }
};

// ── Report API ───────────────────────────────────────────────────────────────
export const downloadReport = async (reportData) => {
  console.log('📄 Generating PDF report…', reportData);
  let response;
  try {
    response = await api.post('/api/download-report', reportData, {
      responseType: 'blob',
      timeout: 45000,
    });
  } catch (error) {
    // Network-level failure — backend not running
    if (!error.response) {
      throw new Error(
        'Cannot reach the backend server. ' +
        'Please start it with: venv\\Scripts\\python.exe -m uvicorn main:app --port 8000'
      );
    }
    // When responseType='blob', FastAPI errors arrive as Blob — parse them
    if (error.response?.data instanceof Blob) {
      try {
        const text = await error.response.data.text();
        const json = JSON.parse(text);
        throw new Error(json.detail || json.error || text);
      } catch (parseErr) {
        if (!parseErr.message?.includes('JSON')) throw parseErr;
      }
    }
    if (error.response?.status === 404) {
      throw new Error(
        'PDF endpoint not found — ensure reportlab is installed: pip install reportlab'
      );
    }
    if (error.response?.status === 500) {
      throw new Error('PDF generation failed on the server. Check backend logs for details.');
    }
    throw new Error(error.message || 'Report generation failed.');
  }

  // ── Validate the response is an actual PDF ──────────────────────────────
  const rawBlob = response.data;

  // Guard: empty response
  if (!rawBlob || rawBlob.size === 0) {
    throw new Error('Server returned an empty file. PDF generation may have failed.');
  }

  // Guard: server returned JSON/HTML instead of PDF (error slipped through)
  const contentType = response.headers?.['content-type'] || '';
  if (!contentType.includes('pdf') && rawBlob.size < 500) {
    const text = await rawBlob.text();
    let detail = text;
    try { detail = JSON.parse(text)?.detail || text; } catch (_) { /* noop */ }
    throw new Error(`Unexpected server response: ${detail}`);
  }

  // ── Trigger browser download ─────────────────────────────────────────────
  const blob = new Blob([rawBlob], { type: 'application/pdf' });
  const url  = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href  = url;
  const ts   = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `SmartCrop_Report_${ts}.pdf`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => window.URL.revokeObjectURL(url), 2000); // slight delay for Safari

  console.log(`✅ PDF downloaded — ${blob.size} bytes`);
  return { success: true };
};

export const getGeojson = async () => {
  try {
    const response = await api.get('/api/map/geojson');
    return response.data;
  } catch (error) {
    console.error('❌ GeoJSON failed:', error.message);
    return { geojson: { type: 'FeatureCollection', features: [] } };
  }
};

export default api;
