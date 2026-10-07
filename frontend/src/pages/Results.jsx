import React, { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { downloadReport } from '../utils/api';

function confColor(pct) {
  if (pct >= 80) return '#39ff14';
  if (pct >= 60) return '#ffb400';
  return '#ff2d78';
}
function riskColor(lvl) {
  const l = (lvl || '').toLowerCase();
  if (l.includes('high'))   return { bg: 'rgba(255,45,120,0.12)',  text: '#ff2d78', border: 'rgba(255,45,120,0.3)'  };
  if (l.includes('medium')) return { bg: 'rgba(255,180,0,0.12)',   text: '#ffb400', border: 'rgba(255,180,0,0.3)'   };
  return                           { bg: 'rgba(57,255,20,0.1)',    text: '#39ff14', border: 'rgba(57,255,20,0.3)'   };
}
function buildFallback(diseaseName, isHealthy) {
  if (isHealthy) return {
    recommendation: 'Your plant is healthy. Continue current irrigation and fertilization schedules. Monitor weekly for early discoloration or wilting during high-humidity periods.',
    treatment: [],
    prevention: [
      'Maintain adequate plant spacing (30-45 cm) to ensure air circulation.',
      'Avoid overhead irrigation - switch to drip irrigation where possible.',
      'Rotate crops seasonally to disrupt soil-borne pathogen cycles.',
      'Use certified, disease-resistant seed varieties for your region.',
      'Scout fields twice weekly during humid or rainy seasons.',
    ],
  };
  return {
    recommendation: `Act immediately. Isolate affected plants to prevent spread of ${diseaseName}. Remove and safely dispose of infected leaves — do not compost. Begin treatment within 24–48 hours to minimize crop loss.`,
    treatment: [
      'Apply Mancozeb 75 WP (2.5 g/L) or Propiconazole 25 EC (1 ml/L) as foliar spray every 7-10 days for 3 cycles.',
      'For organic management, spray neem oil (5 ml/L) with surfactant early morning or evening to avoid leaf burn.',
      'If root infection is suspected, drench root zone with copper oxychloride (3 g/L) solution.',
      'Avoid spraying in direct sunlight. Monitor plant response after each application.',
    ],
    prevention: [
      'Space plants 30-45 cm apart to ensure sufficient air circulation and reduce leaf wetness.',
      'Avoid overhead irrigation; use drip or furrow irrigation to keep foliage dry.',
      'Rotate crops every season - avoid planting the same crop family in the same plot for 2-3 years.',
      'Use certified disease-resistant seed varieties and treat seeds before planting.',
      'Remove and destroy crop debris after harvest to eliminate overwintering pathogens.',
    ],
  };
}

const S = {
  card: {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '1.25rem',
    padding: '1.75rem',
  },
  lbl: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.7rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.4)',
    marginBottom: '0.4rem',
  },
  iconBox: (color) => ({
    width: 32, height: 32, borderRadius: '0.5rem',
    background: color + '1a', border: `1px solid ${color}33`,
    display: 'grid', placeItems: 'center', color, flexShrink: 0,
  }),
  sectionTag: (color) => ({
    fontSize: '0.8rem', fontWeight: 600, letterSpacing: '0.05em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
  }),
};

const Ico = {
  Download: () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>,
  Leaf:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/></svg>,
  Flask:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 3h6l3 9H6l3-9z"/><path d="M6 12l-2 7a1 1 0 001 1h14a1 1 0 001-1l-2-7"/></svg>,
  Shield:   () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Cloud:    () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  Eye:      () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  Scan:     () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>,
  Check:    () => <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="#39ff14" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
};

export default function Results() {
  const location = useLocation();
  const { lastPrediction, weather, weatherRisk, savePrediction, originalImage: ctxImage } = useApp();
  const result        = location.state?.prediction || lastPrediction;
  const originalImage = location.state?.originalImage || ctxImage || null;
  const [downloading, setDownloading] = useState(false);
  const [dlError, setDlError] = useState(null);

  useEffect(() => {
    document.title = 'Results — Agro Radar';
    if (location.state?.prediction) savePrediction(location.state.prediction, location.state.originalImage ?? null);
  }, [location.state, savePrediction]);

  const handleDownload = async () => {
    setDownloading(true); setDlError(null);
    try {
      if (!result) throw new Error('No result data to download.');
      const { prediction, disease_info, risk_analysis } = result;
      const disName = prediction?.disease_name || prediction?.disease_class || 'Unknown';
      const isHlthy = !prediction?.is_diseased;
      const fb = buildFallback(disName, isHlthy);
      await downloadReport({
        disease_name: disName, crop_type: prediction?.crop_type || '',
        confidence: (prediction?.confidence ?? 0), is_diseased: prediction?.is_diseased ?? false,
        temperature: weather?.temperature ?? null, humidity: weather?.humidity ?? null,
        wind_speed: weather?.wind_speed ?? null, rainfall: weather?.rainfall ?? null,
        weather_condition: weather?.description ?? null, location: weather?.location?.name ?? null,
        recommendation: risk_analysis?.recommendation || fb.recommendation,
        treatment_options: disease_info?.treatment?.length ? disease_info.treatment : fb.treatment,
        prevention_measures: disease_info?.prevention?.length ? disease_info.prevention : fb.prevention,
        risk_score: risk_analysis?.risk_score ?? null, risk_level: risk_analysis?.risk_level || weatherRisk.level,
      });
    } catch (e) { setDlError(e.message || 'Download failed.'); }
    finally { setDownloading(false); }
  };

  if (!result) return (
    <div style={{ minHeight: '100vh', background: '#030303', display: 'flex', alignItems: 'center', justifyContent: 'center', paddingTop: '72px' }}>
      <div style={{ textAlign: 'center', maxWidth: 400, padding: '0 2rem' }}>
        <div style={{ ...S.iconBox('#39ff14'), width: 72, height: 72, borderRadius: '1rem', margin: '0 auto 1.5rem' }}><Ico.Leaf /></div>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: '1.75rem', fontWeight: 800, color: '#fff', marginBottom: '0.75rem' }}>No Results Yet</h2>
        <p style={{ color: 'rgba(255,255,255,0.5)', lineHeight: 1.7, marginBottom: '2rem' }}>Upload a plant image to receive AI-powered disease analysis, risk scoring, and a personalised treatment plan.</p>
        <Link to="/upload" className="btn-primary">Upload Image</Link>
      </div>
    </div>
  );

  const { prediction, disease_info, risk_analysis } = result;
  const heatmapB64    = result?.heatmap_image || null;
  const diseaseName   = prediction?.disease_name || prediction?.disease_class || 'Unknown';
  const conf          = (prediction?.confidence ?? 0).toFixed(1);
  const confN         = parseFloat(conf);
  const isHealthy     = !prediction?.is_diseased;
  const fb            = buildFallback(diseaseName, isHealthy);
  const recommendation = risk_analysis?.recommendation || fb.recommendation;
  const treatments     = disease_info?.treatment?.length  ? disease_info.treatment  : fb.treatment;
  const preventions    = disease_info?.prevention?.length ? disease_info.prevention : fb.prevention;
  const riskLevel      = risk_analysis?.risk_level || weatherRisk.level;
  const rc             = riskColor(riskLevel);
  const nowStr         = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  const locName        = weather?.location?.name || 'Unknown Location';
  const hasImages      = originalImage || heatmapB64;

  return (
    <div style={{ minHeight: '100vh', background: '#030303', paddingTop: '72px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2.5rem 2rem' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#39ff14', boxShadow: '0 0 8px #39ff14' }} />
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.7rem', letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Analysis Report - {nowStr}</span>
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.8rem, 4vw, 2.75rem)', fontWeight: 900, color: '#fff', letterSpacing: '-0.03em', margin: 0 }}>{diseaseName}</h1>
            <p style={{ color: 'rgba(255,255,255,0.4)', marginTop: '0.4rem', fontSize: '0.875rem' }}>{locName}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, background: isHealthy ? 'rgba(57,255,20,0.1)' : 'rgba(255,45,120,0.1)', color: isHealthy ? '#39ff14' : '#ff2d78', border: `1px solid ${isHealthy ? 'rgba(57,255,20,0.3)' : 'rgba(255,45,120,0.3)'}` }}>{isHealthy ? 'Healthy' : 'Diseased'}</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.5rem 1rem', borderRadius: '100px', fontSize: '0.8rem', fontWeight: 600, background: rc.bg, color: rc.text, border: `1px solid ${rc.border}` }}>{riskLevel} Risk</span>
          </div>
        </div>

        {dlError && <div style={{ ...S.card, borderColor: 'rgba(255,45,120,0.3)', marginBottom: '1rem', color: '#ff2d78', fontSize: '0.875rem' }}>Download failed: {dlError}</div>}

        {/* ROW 1: Confidence + Weather */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={S.iconBox('#39ff14')}><Ico.Scan /></div>
              <span style={S.sectionTag()}>AI Confidence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontFamily: "'Syne', sans-serif", fontSize: '3.5rem', fontWeight: 900, lineHeight: 1, color: confColor(confN) }}>{conf}%</span>
              {prediction?.crop_type && <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.875rem', paddingBottom: '0.5rem' }}>- {prediction.crop_type}</span>}
            </div>
            <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginBottom: '0.75rem', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${confN}%`, borderRadius: 999, background: confColor(confN), boxShadow: `0 0 10px ${confColor(confN)}66` }} />
            </div>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', lineHeight: 1.6 }}>
              {confN >= 80 ? 'High confidence - result is reliable for field use.' : confN >= 60 ? 'Moderate confidence - try a clearer, closer image.' : 'Low confidence - capture a better image in natural light.'}
            </p>
            {risk_analysis?.risk_score !== undefined && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Weather-adjusted risk score</span>
                <span style={{ color: '#fff', fontWeight: 700 }}>{risk_analysis.risk_score} / 100</span>
              </div>
            )}
          </div>

          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={S.iconBox('#00e5ff')}><Ico.Cloud /></div>
              <span style={S.sectionTag()}>Weather Conditions</span>
            </div>
            {weather ? (<>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.6rem', marginBottom: '0.75rem' }}>
                {[
                  { lbl: 'Temperature', v: `${Math.round(weather.temperature ?? 0)}°C` },
                  { lbl: 'Humidity',    v: `${Math.round(weather.humidity ?? 0)}%` },
                  { lbl: 'Wind',        v: `${Math.round(weather.wind_speed ?? 0)} km/h` },
                  { lbl: 'Rainfall',    v: `${Number(weather.rainfall ?? 0).toFixed(1)} mm` },
                  { lbl: 'Visibility',  v: `${((weather.visibility ?? 10000)/1000).toFixed(1)} km` },
                  { lbl: 'Risk Level',  v: weatherRisk.level, hl: true },
                ].map(({ lbl, v, hl }) => (
                  <div key={lbl} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '0.6rem 0.75rem' }}>
                    <p style={S.lbl}>{lbl}</p>
                    <p style={{ fontSize: '0.95rem', fontWeight: 600, color: hl ? '#00e5ff' : '#fff', margin: 0 }}>{v}</p>
                  </div>
                ))}
              </div>
              <div style={{ padding: '0.7rem 0.875rem', borderRadius: '0.75rem', background: 'rgba(0,229,255,0.06)', border: '1px solid rgba(0,229,255,0.15)' }}>
                <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', lineHeight: 1.6, margin: 0 }}>
                  {(weather.humidity ?? 0) >= 70 ? 'High humidity creates favorable conditions for fungal spread. Apply preventive treatment promptly.' : 'Current conditions are within a moderate risk range. Maintain regular crop monitoring.'}
                </p>
              </div>
            </>) : <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.875rem' }}>Weather data unavailable.</p>}
          </div>
        </div>

        {/* IMAGE VISUALIZATION */}
        {hasImages && (
          <div style={{ ...S.card, marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={S.iconBox('#ffb400')}><Ico.Eye /></div>
                <span style={S.sectionTag()}>Image Analysis</span>
              </div>
              <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', padding: '0.3rem 0.7rem', borderRadius: '100px', background: 'rgba(255,180,0,0.1)', color: '#ffb400', border: '1px solid rgba(255,180,0,0.2)' }}>Grad-CAM AI Vision</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: originalImage && heatmapB64 ? '1fr 1fr' : '1fr', gap: '1rem' }}>
              {originalImage && (
                <div>
                  <p style={{ ...S.lbl, marginBottom: '0.6rem' }}>Original Image</p>
                  <div style={{ borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', background: '#080808', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={originalImage} alt="Original plant" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <p style={{ ...S.lbl, textAlign: 'center', marginTop: '0.5rem' }}>Uploaded leaf sample</p>
                </div>
              )}
              {heatmapB64 && (
                <div>
                  <p style={{ ...S.lbl, marginBottom: '0.6rem' }}>Grad-CAM Heatmap</p>
                  <div style={{ borderRadius: '0.875rem', overflow: 'hidden', border: '1px solid rgba(255,180,0,0.2)', background: '#080808', aspectRatio: '4/3', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={`data:image/png;base64,${heatmapB64}`} alt="Grad-CAM heatmap" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                  </div>
                  <p style={{ ...S.lbl, textAlign: 'center', marginTop: '0.5rem' }}>Disease-highlighted regions</p>
                </div>
              )}
            </div>
            {heatmapB64 && (
              <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
                {[['#0000ff','Low'],['#00ff00','Moderate'],['#ff6600','High'],['#ff0000','Disease focus']].map(([c, lbl]) => (
                  <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: c, flexShrink: 0 }} />{lbl}
                  </span>
                ))}
                <p style={{ marginLeft: 'auto', fontSize: '0.7rem', color: 'rgba(255,255,255,0.2)', fontStyle: 'italic', margin: '0 0 0 auto' }}>Warmer = more influential for AI decision</p>
              </div>
            )}
          </div>
        )}

        {/* ROW 2: Recommendation + Treatment */}
        <div style={{ display: 'grid', gridTemplateColumns: treatments.length ? '1fr 1fr' : '1fr', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ ...S.card, borderColor: 'rgba(57,255,20,0.12)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={S.iconBox('#39ff14')}><Ico.Leaf /></div>
              <span style={S.sectionTag()}>Recommended Action</span>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.65)', lineHeight: 1.75, fontSize: '0.875rem', marginBottom: '1.25rem' }}>{recommendation}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
              {['Isolate and inspect all plants in the affected area immediately.', 'Document spread by photographing nearby plants for comparison.', 'Begin treatment within 24-48 hours to prevent further crop loss.'].map((item, i) => (
                <li key={i} style={{ display: 'flex', gap: '0.6rem', alignItems: 'flex-start', color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.5 }}>
                  <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(57,255,20,0.1)', border: '1px solid rgba(57,255,20,0.25)', display: 'grid', placeItems: 'center', flexShrink: 0, marginTop: 2 }}><Ico.Check /></span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {treatments.length > 0 && (
            <div style={{ ...S.card, borderColor: 'rgba(0,229,255,0.12)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <div style={S.iconBox('#00e5ff')}><Ico.Flask /></div>
                  <span style={S.sectionTag()}>Treatment Plan</span>
                </div>
                <div style={{ display: 'flex', gap: '0.35rem' }}>
                  {['Fungicide','Organic','Weekly'].map(t => (
                    <span key={t} style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.6rem', padding: '0.2rem 0.55rem', borderRadius: '100px', background: 'rgba(0,229,255,0.08)', color: '#00e5ff', border: '1px solid rgba(0,229,255,0.2)' }}>{t}</span>
                  ))}
                </div>
              </div>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {treatments.map((item, i) => (
                  <li key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', color: 'rgba(255,255,255,0.55)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                    <span style={{ fontFamily: "'DM Mono', monospace", fontSize: '0.65rem', color: '#00e5ff', flexShrink: 0, paddingTop: '0.1rem', minWidth: '1.2rem' }}>{String(i+1).padStart(2,'0')}</span>
                    {item}
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>

        {/* PREVENTION */}
        {preventions.length > 0 && (
          <div style={{ ...S.card, borderColor: 'rgba(255,180,0,0.12)', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
              <div style={S.iconBox('#ffb400')}><Ico.Shield /></div>
              <span style={S.sectionTag()}>Prevention Strategies</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: '0.65rem' }}>
              {preventions.map((item, i) => (
                <div key={i} style={{ background: 'rgba(255,180,0,0.04)', border: '1px solid rgba(255,180,0,0.1)', borderRadius: '0.75rem', padding: '0.875rem 1rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
                  <span style={{ color: '#ffb400', flexShrink: 0, fontSize: '0.7rem', paddingTop: '0.15rem', fontFamily: "'DM Mono', monospace" }}>{String(i+1).padStart(2,'0')}</span>
                  <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', lineHeight: 1.6, margin: 0 }}>{item}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ACTIONS */}
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={handleDownload} disabled={downloading} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 2rem', borderRadius: '100px', background: '#39ff14', color: '#000', fontWeight: 700, fontSize: '0.875rem', letterSpacing: '0.02em', textTransform: 'uppercase', border: 'none', cursor: downloading ? 'not-allowed' : 'pointer', opacity: downloading ? 0.6 : 1, boxShadow: '0 0 20px rgba(57,255,20,0.25)' }}>
            {downloading ? 'Generating...' : <><Ico.Download /><span>Download PDF Report</span></>}
          </button>
          <Link to="/upload" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.6rem', padding: '0.9rem 2rem', borderRadius: '100px', background: 'transparent', color: '#fff', fontWeight: 600, fontSize: '0.875rem', border: '1px solid rgba(255,255,255,0.15)', textDecoration: 'none' }}>
            Analyze Another Image
          </Link>
        </div>

      </div>
    </div>
  );
}
