import React, { useState, useEffect } from 'react';

/* ─────────────────────────────────────────────────────────────────
   SVG Weather Icons (no external dependency needed)
   ───────────────────────────────────────────────────────────────── */
const IconSun = ({ size = 36, color = '#f59e0b' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);
const IconCloud = ({ size = 36, color = '#94a3b8' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);
const IconCloudRain = ({ size = 36, color = '#3b82f6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/>
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
  </svg>
);
const IconSnow = ({ size = 36, color = '#7dd3fc' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="22"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
    <line x1="2" y1="12" x2="22" y2="12"/><line x1="4.93" y1="19.07" x2="19.07" y2="4.93"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconDroplets = ({ size = 16, color = '#3b82f6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
);
const IconWind = ({ size = 16, color = '#0d9488' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
  </svg>
);
const IconRain = ({ size = 16, color = '#0ea5e9' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/>
    <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
  </svg>
);
const IconEye = ({ size = 16, color = '#8b5cf6' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
    <circle cx="12" cy="12" r="3"/>
  </svg>
);
const IconPin = ({ size = 13, color = '#6b7280' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>
);
const IconAlert = ({ size = 13, color = '#d97706' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);

/* ─────────────────────────────────────────────────────────────────
   Helper: pick weather icon from OWM code
   ───────────────────────────────────────────────────────────────── */
function WeatherIcon({ code = '01d', size = 42 }) {
  const c = code.replace('n', 'd');
  if (['01d'].includes(c)) return <IconSun size={size} />;
  if (['09d','10d','11d'].includes(c)) return <IconCloudRain size={size} />;
  if (['13d'].includes(c)) return <IconSnow size={size} />;
  return <IconCloud size={size} />;
}

/* ─────────────────────────────────────────────────────────────────
   Mock 4-day forecast (used when backend has none)
   ───────────────────────────────────────────────────────────────── */
function buildMockForecast(baseTemp) {
  const days = ['Mon', 'Tue', 'Wed', 'Thu'];
  const icons = ['01d', '02d', '10d', '03d'];
  return days.map((day, i) => ({
    day,
    icon: icons[i],
    high: Math.round(baseTemp + Math.random() * 3 - 1),
    low:  Math.round(baseTemp - 4 + Math.random() * 2),
  }));
}

/* ─────────────────────────────────────────────────────────────────
   Skeleton
   ───────────────────────────────────────────────────────────────── */
function WeatherSkeleton() {
  return (
    <div className="card-weather space-y-4">
      <div className="skeleton h-5 w-32 mb-2" />
      <div className="skeleton h-14 w-24" />
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <div key={i} className="skeleton h-16 rounded-xl" />)}
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────
   Main Component
   ───────────────────────────────────────────────────────────────── */
function WeatherWidget({ weather, riskLevel, showForecast = false }) {
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    if (weather && showForecast) {
      setForecast(buildMockForecast(weather.temperature ?? 28));
    }
  }, [weather, showForecast]);

  if (!weather) return <WeatherSkeleton />;

  const isDemo     = weather.is_demo;
  const temp       = Math.round(weather.temperature ?? 0);
  const feelsLike  = Math.round(weather.feels_like ?? temp);
  const humidity   = Math.round(weather.humidity ?? 0);
  const windSpeed  = Math.round(weather.wind_speed ?? 0);
  const rainfall   = Number(weather.rainfall ?? 0).toFixed(1);
  const visibility = ((weather.visibility ?? 10000) / 1000).toFixed(1);
  const description = weather.description
    ? weather.description.charAt(0).toUpperCase() + weather.description.slice(1)
    : 'Clear';
  const locationName = weather.location?.name || 'Current Location';
  const iconCode   = weather.icon || '01d';

  const riskColor =
    riskLevel?.toLowerCase().includes('high')   ? '#b91c1c' :
    riskLevel?.toLowerCase().includes('medium') ? '#a16207' : '#15803d';

  return (
    <div className="card-weather animate-fadeInUp space-y-4">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <IconPin />
            <p className="text-sm font-semibold text-gray-700">{locationName}</p>
          </div>
          <p className="text-xs text-gray-500 capitalize">{description}</p>
          {isDemo && (
            <div className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 bg-amber-50 border border-amber-200 rounded-full">
              <IconAlert />
              <span className="text-xs font-medium text-amber-700">Demo Data</span>
            </div>
          )}
        </div>
        <div className="animate-float">
          <WeatherIcon code={iconCode} size={44} />
        </div>
      </div>

      {/* Temperature */}
      <div>
        <p className="weather-temp-display">{temp}°C</p>
        <p className="text-xs text-gray-500 mt-1">Feels like {feelsLike}°C</p>
      </div>

      {/* Metrics 2×2 */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="weather-metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <IconDroplets /><span className="text-xs font-semibold text-blue-700">Humidity</span>
          </div>
          <p className="text-xl font-bold text-blue-700">{humidity}%</p>
        </div>

        <div className="weather-metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <IconWind /><span className="text-xs font-semibold text-teal-700">Wind</span>
          </div>
          <p className="text-xl font-bold text-teal-700">{windSpeed} km/h</p>
        </div>

        <div className="weather-metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <IconRain /><span className="text-xs font-semibold text-sky-700">Rainfall</span>
          </div>
          <p className="text-xl font-bold text-sky-700">{rainfall} mm</p>
        </div>

        <div className="weather-metric-card">
          <div className="flex items-center gap-1.5 mb-1">
            <IconEye /><span className="text-xs font-semibold text-violet-700">Visibility</span>
          </div>
          <p className="text-xl font-bold text-violet-700">{visibility} km</p>
        </div>
      </div>

      {/* 4-Day Forecast */}
      {showForecast && forecast && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
            4-Day Outlook
          </p>
          <div className="flex gap-2">
            {forecast.map(({ day, icon, high, low }) => (
              <div key={day} className="forecast-pill flex-1">
                <p className="text-xs font-semibold text-gray-500 mb-1">{day}</p>
                <div className="flex justify-center mb-1">
                  <WeatherIcon code={icon} size={20} />
                </div>
                <p className="text-xs font-bold text-gray-700">{high}°</p>
                <p className="text-xs text-gray-400">{low}°</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk Footer */}
      {riskLevel && (
        <div
          className="flex items-center justify-between pt-3"
          style={{ borderTop: '1px solid rgba(186,230,253,0.6)' }}
        >
          <p className="text-xs font-medium text-gray-500">Disease Risk (Weather)</p>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{
              background: `${riskColor}18`,
              color: riskColor,
              border: `1px solid ${riskColor}30`,
            }}
          >
            {riskLevel}
          </span>
        </div>
      )}
    </div>
  );
}

export default WeatherWidget;
