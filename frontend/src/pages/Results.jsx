import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useApp, computeWeatherRisk } from '../context/AppContext';
import WeatherCard from '../components/WeatherCard';
import { downloadReport } from '../utils/api';

/* ─────────────────────────────────────────────
   Helpers
   ───────────────────────────────────────────── */
function confColor(pct) {
  if (pct >= 80) return { text:'#15803d', prog:'prog-green'  };
  if (pct >= 60) return { text:'#a16207', prog:'prog-yellow' };
  return              { text:'#b91c1c', prog:'prog-red'    };
}
function riskBadge(lvl = '') {
  const l = lvl.toLowerCase();
  if (l.includes('high'))   return 'badge badge-red';
  if (l.includes('medium')) return 'badge badge-yellow';
  if (l.includes('low'))    return 'badge badge-green';
  return 'badge badge-gray';
}

/* ─────────────────────────────────────────────
   Rich fallback content
   ───────────────────────────────────────────── */
function buildFallback(diseaseName, isHealthy) {
  if (isHealthy) return {
    recommendation: 'Your plant is healthy. Continue your current irrigation and fertilization schedule. Monitor weekly for any early discoloration or wilting, particularly during high-humidity periods.',
    treatment: [],
    prevention: [
      'Maintain adequate plant spacing (30–45 cm) to ensure air circulation.',
      'Avoid overhead irrigation — switch to drip irrigation where possible.',
      'Rotate crops seasonally to disrupt soil-borne pathogen cycles.',
      'Use certified, disease-resistant seed varieties for your region.',
      'Scout fields twice weekly during humid or rainy seasons.',
    ],
  };
  return {
    recommendation: `Act immediately. Isolate affected plants to prevent spread of ${diseaseName}. Remove and safely dispose of infected leaves — do not compost. Begin treatment within 24–48 hours to minimize crop loss.`,
    treatment: [
      'Apply Mancozeb 75 WP (2.5 g/L) or Propiconazole 25 EC (1 ml/L) as foliar spray every 7–10 days for 3 cycles.',
      'For organic management, spray neem oil (5 ml/L) with surfactant early morning or evening to avoid leaf burn.',
      'If root infection is suspected, drench root zone with copper oxychloride (3 g/L) solution.',
      'Avoid spraying in direct sunlight. Monitor plant response after each application.',
    ],
    prevention: [
      'Space plants 30–45 cm apart to ensure sufficient air circulation and reduce leaf wetness.',
      'Avoid overhead irrigation; use drip or furrow irrigation to keep foliage dry.',
      'Rotate crops every season — avoid planting the same crop family in the same plot for 2–3 years.',
      'Use certified disease-resistant seed varieties and treat seeds before planting.',
      'Remove and destroy crop debris after harvest to eliminate overwintering pathogens.',
    ],
  };
}

/* ─────────────────────────────────────────────
   Icons
   ───────────────────────────────────────────── */
const Ico = {
  Download: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Alert: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Leaf: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
    </svg>
  ),
  Flask: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.5 2v17.5c0 1.4-1.1 2.5-2.5 2.5h0c-1.4 0-2.5-1.1-2.5-2.5V2"/><path d="M8.5 2h7"/>
      <path d="M14.5 16h-5.1c-.7 0-1.3.4-1.6 1l-1.9 3.4"/>
    </svg>
  ),
  Shield: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
};

/* ─────────────────────────────────────────────
   Section card header
   ───────────────────────────────────────────── */
function SectionHeader({ icon, iconClass, label, labelClass }) {
  return (
    <div className="flex items-center gap-2.5 mb-4">
      <div className={`icon-pill ${iconClass}`} style={{ width:32, height:32, borderRadius:8 }}>{icon}</div>
      <p className={`section-title ${labelClass}`}>{label}</p>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Component
   ───────────────────────────────────────────── */
export default function Results() {
  const location              = useLocation();
  const { lastPrediction, weather, weatherRisk, savePrediction, originalImage: ctxImage } = useApp();

  /* Prefer router state (fresh upload) → fall back to context (last prediction) */
  const result        = location.state?.prediction || lastPrediction;
  /* Image: router state (fresh) → context (returning user) */
  const originalImage = location.state?.originalImage || ctxImage || null;

  const [downloading, setDownloading] = useState(false);
  const [dlError,     setDlError]     = useState(null);

  /* When a fresh result arrives via router state, persist to context */
  useEffect(() => {
    document.title = 'Results — SmartCrop';
    if (location.state?.prediction) {
      savePrediction(location.state.prediction, location.state.originalImage ?? null);
    }
  }, [location.state, savePrediction]);

  /* ── Download ──────────────────────────────────────────── */
  const handleDownload = async () => {
    setDownloading(true); setDlError(null);
    try {
      if (!result) throw new Error('No result data to download.');
      const { prediction, disease_info, risk_analysis } = result;

      const disName  = prediction?.disease_name || prediction?.disease_class || 'Unknown';
      const isHlthy  = !prediction?.is_diseased;
      const fb       = buildFallback(disName, isHlthy);

      await downloadReport({
        // Prediction
        disease_name:        disName,
        crop_type:           prediction?.crop_type || '',
        confidence:          (prediction?.confidence ?? 0),   // backend already sends 0-100
        is_diseased:         prediction?.is_diseased ?? false,
        // Weather (from global context)
        temperature:         weather?.temperature    ?? null,
        humidity:            weather?.humidity       ?? null,
        wind_speed:          weather?.wind_speed     ?? null,
        rainfall:            weather?.rainfall       ?? null,
        weather_condition:   weather?.description    ?? null,
        location:            weather?.location?.name ?? null,
        // Analysis
        recommendation:      risk_analysis?.recommendation || fb.recommendation,
        treatment_options:   disease_info?.treatment?.length  ? disease_info.treatment  : fb.treatment,
        prevention_measures: disease_info?.prevention?.length ? disease_info.prevention : fb.prevention,
        risk_score:          risk_analysis?.risk_score ?? null,
        risk_level:          risk_analysis?.risk_level || weatherRisk.level,
      });
    } catch (e) {
      setDlError(e.message || 'Download failed.');
    } finally { setDownloading(false); }
  };


  /* ── Empty state ───────────────────────────────────────── */
  if (!result) return (
    <div className="page-bg-report flex items-center justify-center p-6" style={{ minHeight:'calc(100vh - 56px)' }}>
      <div className="text-center max-w-sm anim-up">
        <div className="icon-pill icon-pill-green mx-auto mb-5" style={{ width:56, height:56, borderRadius:14 }}>
          <Ico.Leaf />
        </div>
        <h2 className="text-xl font-semibold mb-3" style={{ color:'#111827' }}>No Results Yet</h2>
        <p className="text-sm mb-8" style={{ color:'#6b7280' }}>
          Upload a plant image to receive AI-powered disease analysis, risk scoring, and a personalised treatment plan.
        </p>
        <Link to="/upload" className="btn btn-primary btn-lg">Upload Image</Link>
      </div>
    </div>
  );

  /* ── Extract data ──────────────────────────────────────── */
  const { prediction, disease_info, risk_analysis } = result;
  const heatmapB64    = result?.heatmap_image || null;
  const diseaseName   = prediction?.disease_name || prediction?.disease_class || 'Unknown';
  const conf          = (prediction?.confidence ?? 0).toFixed(1);   // backend sends 0-100 already
  const confN         = parseFloat(conf);
  const isHealthy     = !prediction?.is_diseased;
  const cc            = confColor(confN);
  const fb            = buildFallback(diseaseName, isHealthy);
  const recommendation = risk_analysis?.recommendation || fb.recommendation;
  const treatments     = disease_info?.treatment?.length  ? disease_info.treatment  : fb.treatment;
  const preventions    = disease_info?.prevention?.length ? disease_info.prevention : fb.prevention;

  /* Use weather-based risk if no risk_analysis, otherwise prefer backend */
  const riskLevel = risk_analysis?.risk_level || weatherRisk.level;
  const nowStr    = new Date().toLocaleString('en-IN', { dateStyle:'medium', timeStyle:'short' });
  const locName   = weather?.location?.name || 'Unknown Location';
  const hasImages = originalImage || heatmapB64;

  /* ── Render ────────────────────────────────────────────── */
  return (
    <div className="page-bg-report" style={{ minHeight:'calc(100vh - 56px)' }}>
      <div className="wrap-md py-10 anim-up">

        {/* PAGE HEADER */}
        <div className="mb-8">
          <p className="eyebrow mb-2">Analysis Report</p>
          <h1 className="text-3xl font-bold mb-2" style={{ color:'#111827', letterSpacing:'-.025em' }}>
            {diseaseName}
          </h1>
          <p className="text-sm" style={{ color:'#9ca3af' }}>
            Confidence {conf}% &nbsp;·&nbsp; {nowStr} &nbsp;·&nbsp; {locName}
          </p>
        </div>

        {dlError && (
          <div className="alert alert-error mb-5 anim-in" style={{ flexDirection:'column', alignItems:'flex-start', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <Ico.Alert />
              <span style={{ fontWeight:600 }}>Download failed</span>
            </div>
            <p style={{ fontSize:'0.8125rem', lineHeight:1.5, margin:0 }}>{dlError}</p>
            {dlError.includes('venv') && (
              <code style={{ fontSize:'0.75rem', background:'rgba(0,0,0,0.08)', padding:'4px 8px', borderRadius:5, marginTop:2 }}>
                venv\Scripts\python.exe -m uvicorn main:app --port 8000
              </code>
            )}
          </div>
        )}

        {/* IMAGE VISUALIZATION CARD — original + heatmap side-by-side */}
        {hasImages && (
          <div className="card mb-4 anim-up" style={{ animationDelay:'0ms' }}>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="icon-pill icon-pill-green" style={{ width:32, height:32, borderRadius:8 }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <p className="section-title st-green">Image Analysis</p>
              <span className="badge badge-green ml-auto" style={{ fontSize:'.7rem' }}>Grad-CAM AI Vision</span>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: originalImage && heatmapB64 ? '1fr 1fr' : '1fr',
              gap: '1rem',
            }}>

              {/* Left — Original */}
              {originalImage && (
                <div>
                  <p style={{ fontSize:'.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'#9ca3af', marginBottom:'0.5rem' }}>
                    Original Image
                  </p>
                  <div style={{
                    borderRadius: '0.875rem',
                    overflow: 'hidden',
                    border: '1px solid #f3f4f6',
                    background: '#f9fafb',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={originalImage}
                      alt="Original plant image"
                      style={{ width:'100%', height:'100%', objectFit:'contain' }}
                    />
                  </div>
                  <p style={{ fontSize:'.75rem', color:'#9ca3af', marginTop:'0.5rem', textAlign:'center' }}>
                    Uploaded leaf sample
                  </p>
                </div>
              )}

              {/* Right — Grad-CAM Heatmap */}
              {heatmapB64 ? (
                <div>
                  <p style={{ fontSize:'.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'#9ca3af', marginBottom:'0.5rem' }}>
                    Grad-CAM Heatmap
                  </p>
                  <div style={{
                    borderRadius: '0.875rem',
                    overflow: 'hidden',
                    border: '1px solid #fde68a',
                    background: '#fffbeb',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    <img
                      src={`data:image/png;base64,${heatmapB64}`}
                      alt="Grad-CAM disease heatmap"
                      style={{ width:'100%', height:'100%', objectFit:'contain' }}
                    />
                  </div>
                  <p style={{ fontSize:'.75rem', color:'#9ca3af', marginTop:'0.5rem', textAlign:'center' }}>
                    Highlighted disease regions
                  </p>
                </div>
              ) : originalImage ? (
                <div>
                  <p style={{ fontSize:'.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'.08em', color:'#9ca3af', marginBottom:'0.5rem' }}>
                    Grad-CAM Heatmap
                  </p>
                  <div style={{
                    borderRadius: '0.875rem',
                    border: '1px dashed #e5e7eb',
                    background: '#f9fafb',
                    aspectRatio: '1 / 1',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <line x1="12" y1="8" x2="12" y2="12"/>
                      <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p style={{ fontSize:'.8125rem', color:'#9ca3af', textAlign:'center', padding:'0 1rem' }}>
                      Heatmap unavailable
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Legend */}
            {heatmapB64 && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                borderRadius: '0.75rem',
                background: '#fffbeb',
                border: '1px solid #fde68a',
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                flexWrap: 'wrap',
              }}>
                <div style={{ display:'flex', alignItems:'center', gap:'0.375rem' }}>
                  {[['#0000ff','Cool (low activation)'],['#00ff00','Moderate'],['#ff6600','High'],['#ff0000','Critical (disease focus)']].map(([c, lbl]) => (
                    <span key={lbl} style={{ display:'flex', alignItems:'center', gap:'0.25rem', fontSize:'.7rem', color:'#6b7280' }}>
                      <span style={{ width:10, height:10, borderRadius:2, background:c, flexShrink:0 }} />{lbl}
                    </span>
                  ))}
                </div>
                <p style={{ fontSize:'.75rem', color:'#92400e', marginLeft:'auto', fontStyle:'italic' }}>
                  Warmer colours indicate regions most influential for the AI's decision.
                </p>
              </div>
            )}
          </div>
        )}

        {/* CARD 1 — PREDICTION */}
        <div className="card mb-4 anim-up">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="eyebrow mb-1">{isHealthy ? 'Status' : 'Disease Detected'}</p>
              <h2 className="text-2xl font-bold" style={{ color:'#111827', letterSpacing:'-.02em' }}>{diseaseName}</h2>
              {prediction?.crop_type && (
                <p className="text-sm mt-0.5" style={{ color:'#6b7280' }}>Crop: {prediction.crop_type}</p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <span className={isHealthy ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize:'.8rem' }}>
                {isHealthy ? '✓ Healthy' : '⚠ Diseased'}
              </span>
              <span className={riskBadge(riskLevel)} style={{ fontSize:'.75rem' }}>
                {riskLevel} Risk
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color:'#9ca3af' }}>Model Confidence</p>
            <p className="text-lg font-bold" style={{ color: cc.text }}>{conf}%</p>
          </div>
          <div className="prog-track mb-2">
            <div className={`prog-fill ${cc.prog}`} style={{ width:`${confN}%` }} />
          </div>
          <p className="text-xs" style={{ color:'#9ca3af' }}>
            {confN >= 80 ? 'High confidence — result is reliable for field use.'
              : confN >= 60 ? 'Moderate confidence — try a clearer, closer image for better accuracy.'
              : 'Low confidence — capture a better image in natural light for improved results.'}
          </p>

          {risk_analysis?.risk_score !== undefined && (
            <div className="mt-4 pt-4 border-t flex items-center justify-between" style={{ borderColor:'#f3f4f6' }}>
              <span className="text-sm" style={{ color:'#6b7280' }}>Weather-adjusted risk score</span>
              <span className="text-sm font-bold" style={{ color:'#374151' }}>{risk_analysis.risk_score} / 100</span>
            </div>
          )}
        </div>

        {/* CARD 2 — WEATHER RISK (uses global weather from context) */}
        <div className="card-report accent-blue mb-4 anim-up" style={{ animationDelay:'60ms' }}>
          <SectionHeader
            icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>}
            iconClass="icon-pill-blue"
            label="Weather Conditions"
            labelClass="st-blue"
          />
          {/* Inline compact weather metrics */}
          {weather ? (
            <div>
              <div className="flex flex-wrap gap-2.5 mb-3">
                {[
                  { lbl:'Temp',       val:`${Math.round(weather.temperature ?? 0)}°C`,             clr:'#d97706' },
                  { lbl:'Humidity',   val:`${Math.round(weather.humidity ?? 0)}%`,                 clr:'#1d4ed8' },
                  { lbl:'Wind',       val:`${Math.round(weather.wind_speed ?? 0)} km/h`,           clr:'#0d9488' },
                  { lbl:'Rainfall',   val:`${Number(weather.rainfall ?? 0).toFixed(1)} mm`,        clr:'#0284c7' },
                  { lbl:'Visibility', val:`${((weather.visibility ?? 10000)/1000).toFixed(1)} km`, clr:'#7c3aed' },
                ].map(({ lbl, val, clr }) => (
                  <div key={lbl} className="weather-metric">
                    <p className="text-xs font-semibold mb-0.5" style={{ color:clr }}>{lbl}</p>
                    <p className="text-base font-bold" style={{ color:clr }}>{val}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-xl p-3 flex items-center justify-between" style={{ background:'#eff6ff', border:'1px solid #bfdbfe' }}>
                <p className="text-xs leading-relaxed" style={{ color:'#1e40af' }}>
                  {(weather.humidity ?? 0) >= 70
                    ? 'High humidity and warm temperatures create favorable conditions for fungal and bacterial disease spread. Apply preventive treatment promptly.'
                    : 'Current weather conditions are within a moderate risk range. Maintain regular crop monitoring.'}
                </p>
                <span className={`badge ${weatherRisk.badge}`} style={{ fontSize:'.7rem', flexShrink:0, marginLeft:'1rem' }}>
                  {weatherRisk.level} Risk
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm" style={{ color:'#6b7280' }}>Weather data unavailable.</p>
          )}
        </div>

        {/* CARD 3 — RECOMMENDATION */}
        <div className="card-report accent-green mb-4 anim-up" style={{ animationDelay:'120ms' }}>
          <SectionHeader icon={<Ico.Leaf />} iconClass="icon-pill-green" label="Recommended Action" labelClass="st-green" />
          <p className="text-sm leading-relaxed mb-4" style={{ color:'#374151' }}>{recommendation}</p>
          <ul className="check-list">
            <li>Isolate and inspect all plants in the affected area immediately.</li>
            <li>Document the spread by photographing nearby plants for comparison.</li>
            <li>Begin treatment within 24–48 hours to prevent further crop loss.</li>
          </ul>
        </div>

        {/* CARD 4 — TREATMENT */}
        {treatments.length > 0 && (
          <div className="card-report accent-blue mb-4 anim-up" style={{ animationDelay:'180ms' }}>
            <div className="flex items-start justify-between mb-4">
              <SectionHeader icon={<Ico.Flask />} iconClass="icon-pill-blue" label="Treatment Plan" labelClass="st-blue" />
              <div className="flex gap-1.5 flex-wrap">
                <span className="tag tag-blue">Fungicide</span>
                <span className="tag tag-green">Organic</span>
                <span className="tag tag-amber">Apply Weekly</span>
              </div>
            </div>
            <ol className="number-list">
              {treatments.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          </div>
        )}

        {/* CARD 5 — PREVENTION */}
        {preventions.length > 0 && (
          <div className="card-report accent-amber mb-6 anim-up" style={{ animationDelay:'240ms' }}>
            <SectionHeader icon={<Ico.Shield />} iconClass="icon-pill-amber" label="Prevention Strategies" labelClass="st-amber" />
            <ul className="dot-list">
              {preventions.map((item, i) => <li key={i}>{item}</li>)}
            </ul>
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="flex gap-3">
          <button onClick={handleDownload} disabled={downloading} className="btn btn-primary flex-1" style={{ justifyContent:'center' }}>
            {downloading
              ? <><span className="spinner" /><span>Generating…</span></>
              : <><Ico.Download /><span>Download PDF Report</span></>}
          </button>
          <Link to="/upload" className="btn btn-secondary flex-1" style={{ justifyContent:'center' }}>
            Analyze Another Image
          </Link>
        </div>

      </div>
    </div>
  );
}
