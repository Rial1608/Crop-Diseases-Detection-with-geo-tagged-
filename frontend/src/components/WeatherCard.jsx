/**
 * WeatherCard — shared component consumed by Home, Dashboard, and Results.
 *
 * Props:
 *   compact   : bool — show a small single-row preview (for Home hero)
 *   showRisk  : bool — show the weather-risk footer row
 *   showForecast : bool — show 4-day forecast
 */
import React from 'react';
import { useApp, computeWeatherRisk } from '../context/AppContext';

/* ── SVG icons ──────────────────────────────────────────── */
const Ico = {
  Sun: () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Cloud: ({ size = 36 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
    </svg>
  ),
  Rain: ({ size = 36 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/>
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
    </svg>
  ),
  Drop: ({ color = '#3b82f6', size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
    </svg>
  ),
  Wind: ({ color = '#0d9488', size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  RainDrop: ({ color = '#0ea5e9', size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/>
      <path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>
    </svg>
  ),
  Eye: ({ color = '#8b5cf6', size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  Pin: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Refresh: ({ size = 13 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Alert: ({ size = 12 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
};

/* ── Weather icon selector ───────────────────────────────── */
function WeatherIcon({ description = '', size = 36 }) {
  const d = (description || '').toLowerCase();
  if (d.includes('rain') || d.includes('drizzle') || d.includes('storm'))
    return <Ico.Rain size={size} />;
  if (d.includes('cloud') || d.includes('overcast') || d.includes('haze') || d.includes('mist'))
    return <Ico.Cloud size={size} />;
  return <Ico.Sun />;
}

/* ── Fake 4-day forecast derived from current temp ─────── */
function buildForecast(baseTemp) {
  const days  = ['Mon', 'Tue', 'Wed', 'Thu'];
  const descs = ['Sunny', 'Cloudy', 'Rainy', 'Cloudy'];
  return days.map((day, i) => ({
    day,
    desc: descs[i],
    high: Math.round(baseTemp + (i % 2 === 0 ? 2 : -1) + Math.random()),
    low:  Math.round(baseTemp - 5 + Math.random()),
  }));
}

/* ── Skeleton ────────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="card-weather">
      <div className="skeleton h-4 w-28 mb-4 rounded" style={{ height:16, background:'#d1fae5', borderRadius:6 }} />
      <div className="skeleton h-12 w-20 mb-4 rounded" style={{ height:48, background:'#d1fae5', borderRadius:8 }} />
      <div className="grid grid-cols-2 gap-2">
        {[1,2,3,4].map(i => (
          <div key={i} className="skeleton" style={{ height:64, borderRadius:10, background:'rgba(255,255,255,.5)' }} />
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   Main component
   ══════════════════════════════════════════════════════════ */
export default function WeatherCard({ compact = false, showRisk = true, showForecast = false }) {
  const { weather, weatherLoading, weatherError, weatherRisk, refreshWeather } = useApp();

  if (weatherLoading) return <Skeleton />;

  const w           = weather;
  const temp        = Math.round(w?.temperature ?? 0);
  const feelsLike   = Math.round(w?.feels_like  ?? temp);
  const humidity    = Math.round(w?.humidity    ?? 0);
  const windSpeed   = Math.round(w?.wind_speed  ?? 0);
  const rainfall    = Number(w?.rainfall ?? 0).toFixed(1);
  const visibility  = ((w?.visibility ?? 10000) / 1000).toFixed(1);
  const description = w?.description
    ? w.description.charAt(0).toUpperCase() + w.description.slice(1)
    : 'Clear';
  const locName     = w?.location?.name || 'Current Location';
  const isDemo      = w?.is_demo;
  const risk        = weatherRisk;
  const forecast    = buildForecast(temp);

  /* ── Compact variant (Home hero preview) ─────────────── */
  if (compact) {
    return (
      <div className="card-weather">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="anim-float"><WeatherIcon description={description} size={32} /></div>
            <div>
              <p className="weather-temp" style={{ fontSize:'2rem' }}>{temp}°C</p>
              <p className="text-xs" style={{ color:'#0369a1' }}>{description} · {locName}</p>
            </div>
          </div>
          <div className="flex gap-2">
            {[
              { icon: <Ico.Drop />,     lbl:'Humidity',   val:`${humidity}%`,      clr:'#1d4ed8' },
              { icon: <Ico.Wind />,     lbl:'Wind',        val:`${windSpeed} km/h`, clr:'#0d9488' },
              { icon: <Ico.RainDrop />, lbl:'Rain',        val:`${rainfall} mm`,    clr:'#0284c7' },
            ].map(({ icon, lbl, val, clr }) => (
              <div key={lbl} className="weather-metric">
                <div className="flex items-center gap-1 mb-0.5">{icon}<span className="text-xs font-semibold" style={{ color:clr }}>{lbl}</span></div>
                <p className="text-base font-bold" style={{ color:clr }}>{val}</p>
              </div>
            ))}
          </div>
        </div>
        {showRisk && (
          <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop:'1px solid rgba(186,230,253,.5)' }}>
            <span className="text-xs" style={{ color:'#64748b' }}>Disease Risk from Weather</span>
            <span className={`badge ${risk.badge}`} style={{ fontSize:'.7rem' }}>{risk.level} Risk</span>
          </div>
        )}
      </div>
    );
  }

  /* ── Full variant ────────────────────────────────────── */
  return (
    <div className="card-weather">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <Ico.Pin />
            <p className="text-sm font-semibold" style={{ color:'#0c4a6e' }}>{locName}</p>
          </div>
          <p className="text-xs capitalize" style={{ color:'#0369a1' }}>{description}</p>
          {isDemo && (
            <div className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full" style={{ background:'#fef3c7', border:'1px solid #fde68a' }}>
              <Ico.Alert /><span className="text-xs font-medium" style={{ color:'#92400e' }}>Estimated Data</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshWeather}
            title="Refresh weather"
            className="btn btn-ghost btn-sm"
            style={{ padding:'.3rem', borderRadius:8, color:'#64748b' }}
          >
            <Ico.Refresh />
          </button>
          <div className="anim-float"><WeatherIcon description={description} size={36} /></div>
        </div>
      </div>

      {/* Temperature */}
      <div className="mb-4">
        <p className="weather-temp">{temp}°C</p>
        <p className="text-xs mt-1" style={{ color:'#0369a1' }}>Feels like {feelsLike}°C</p>
      </div>

      {/* Error notice */}
      {weatherError && (
        <div className="alert alert-warn mb-3" style={{ padding:'.5rem .75rem', fontSize:'.75rem' }}>
          <Ico.Alert /><span>{weatherError}</span>
        </div>
      )}

      {/* Metrics 2×2 */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { icon: <Ico.Drop color="#1d4ed8" />,     lbl:'Humidity',   val:`${humidity}%`,      clr:'#1d4ed8' },
          { icon: <Ico.Wind color="#0d9488" />,      lbl:'Wind',        val:`${windSpeed} km/h`, clr:'#0d9488' },
          { icon: <Ico.RainDrop color="#0284c7" />,  lbl:'Rainfall',    val:`${rainfall} mm`,    clr:'#0284c7' },
          { icon: <Ico.Eye color="#7c3aed" />,       lbl:'Visibility',  val:`${visibility} km`,  clr:'#7c3aed' },
        ].map(({ icon, lbl, val, clr }) => (
          <div key={lbl} className="weather-metric">
            <div className="flex items-center gap-1.5 mb-1">{icon}<span className="text-xs font-semibold" style={{ color:clr }}>{lbl}</span></div>
            <p className="text-lg font-bold" style={{ color:clr }}>{val}</p>
          </div>
        ))}
      </div>

      {/* Forecast */}
      {showForecast && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color:'#64748b' }}>4-Day Outlook</p>
          <div className="flex gap-1.5">
            {forecast.map(({ day, desc, high, low }) => (
              <div key={day} className="forecast-day flex-1">
                <p className="text-xs font-semibold mb-1" style={{ color:'#64748b' }}>{day}</p>
                <div className="flex justify-center mb-1">
                  <WeatherIcon description={desc} size={18} />
                </div>
                <p className="text-xs font-bold" style={{ color:'#0c4a6e' }}>{high}°</p>
                <p className="text-xs" style={{ color:'#94a3b8' }}>{low}°</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Risk footer */}
      {showRisk && (
        <div className="flex items-center justify-between pt-3" style={{ borderTop:'1px solid rgba(186,230,253,.5)' }}>
          <div>
            <p className="text-xs font-medium" style={{ color:'#64748b' }}>Disease Risk (Weather)</p>
            <p className="text-xs mt-0.5" style={{ color:'#94a3b8' }}>
              {humidity >= 70
                ? 'High humidity elevates pathogen spread probability.'
                : 'Weather conditions are within safe range.'}
            </p>
          </div>
          <span className={`badge ${risk.badge}`} style={{ fontSize:'.7rem', flexShrink:0, marginLeft:'1rem' }}>
            {risk.level}
          </span>
        </div>
      )}
    </div>
  );
}
