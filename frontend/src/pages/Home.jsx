import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import WeatherCard from '../components/WeatherCard';

/* ── Icons ──────────────────────────────────────────────── */
const IcoScan = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <rect x="7" y="7" width="10" height="10" rx="1"/>
  </svg>
);
const IcoCloud = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>
  </svg>
);
const IcoChart = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IcoMap = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoLeaf = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);
const IcoShield = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
  </svg>
);

/* ── Feature data ─────────────────────────────────────────── */
const FEATURES = [
  {
    icon: <IcoScan />, pill: 'icon-pill icon-pill-green',
    title: 'Disease Detection',
    desc: 'Upload any plant photo. Our AI identifies 16 diseases across major crops with 92% accuracy in under 2 seconds.',
  },
  {
    icon: <IcoCloud />, pill: 'icon-pill icon-pill-blue',
    title: 'Weather Monitoring',
    desc: 'Real-time weather data integrated with disease risk scoring — humidity, wind, and temperature all factor in.',
  },
  {
    icon: <IcoChart />, pill: 'icon-pill icon-pill-amber',
    title: 'Risk Analysis',
    desc: 'Detailed risk scores and spread probability help you prioritize which crops need immediate attention.',
  },
];

const STATS = [
  { val: '16+',   lbl: 'Diseases Detected' },
  { val: '92%',   lbl: 'AI Accuracy'       },
  { val: '<2s',   lbl: 'Analysis Speed'    },
  { val: '100%',  lbl: 'Free to Use'       },
];

/* ── Component ───────────────────────────────────────────── */
export default function Home() {
  const { lastPrediction, analysisHistory, weatherRisk } = useApp();
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => { document.title = 'SmartCrop — Plant Disease Detection'; }, []);

  const latestAnalysis = analysisHistory[0] || null;

  return (
    <div style={{ background: '#f8fafc' }}>

      {/* ════════════════════════════════════════════════════
          HERO — full-bleed background image + overlay
          ════════════════════════════════════════════════════ */}
      <section
        style={{
          position:           'relative',
          minHeight:          '100vh',
          display:            'flex',
          flexDirection:      'column',
          alignItems:         'center',
          justifyContent:     'center',
          overflow:           'hidden',
          backgroundImage:    imgLoaded ? "url('/hero-farm.png')" : 'none',
          backgroundSize:     'cover',
          backgroundPosition: 'center 40%',
          backgroundRepeat:   'no-repeat',
          backgroundColor:    '#e8f5e9',   /* fallback while image loads */
        }}
      >
        {/* Pre-load trigger */}
        <img
          src="/hero-farm.png"
          alt=""
          onLoad={() => setImgLoaded(true)}
          style={{ display: 'none' }}
        />

        {/* ── Gradient overlay ──────────────────────────── */}
        <div style={{
          position:   'absolute',
          inset:       0,
          background: 'linear-gradient(160deg, rgba(255,255,255,0.88) 0%, rgba(240,253,244,0.82) 40%, rgba(209,250,229,0.70) 100%)',
          backdropFilter: 'blur(0.5px)',
        }} />

        {/* ── Hero content ──────────────────────────────── */}
        <div className="wrap-sm anim-up" style={{
          position:  'relative',
          zIndex:     2,
          textAlign: 'center',
          paddingTop:    '7rem',
          paddingBottom: '6rem',
        }}>

          {/* Badge */}
          <div style={{
            display:        'inline-flex',
            alignItems:     'center',
            gap:            '0.5rem',
            marginBottom:   '1.75rem',
            padding:        '0.375rem 1rem',
            borderRadius:   '9999px',
            background:     'rgba(255,255,255,0.85)',
            border:         '1px solid #bbf7d0',
            boxShadow:      '0 2px 12px rgba(22,163,74,0.10)',
            backdropFilter: 'blur(6px)',
          }}>
            <span style={{ color: '#16a34a', fontSize: 9 }}>●</span>
            <span style={{ fontSize: '.8125rem', fontWeight: 600, color: '#15803d' }}>
              AI-Powered Agriculture Platform
            </span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontSize:      'clamp(2.25rem, 5vw, 3.75rem)',
            fontWeight:    800,
            color:         '#0f1f0f',
            letterSpacing: '-.03em',
            lineHeight:    1.1,
            marginBottom:  '1.25rem',
            textShadow:    '0 1px 3px rgba(255,255,255,0.6)',
          }}>
            Detect. Diagnose.<br />
            <span style={{
              color:      '#16a34a',
              background: 'linear-gradient(135deg, #15803d 0%, #16a34a 60%, #4ade80 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}>
              Protect your harvest.
            </span>
          </h1>

          {/* Sub-headline */}
          <p style={{
            fontSize:     '1.0625rem',
            color:        '#374151',
            maxWidth:     '26rem',
            margin:       '0 auto 2.25rem',
            lineHeight:   1.65,
            fontWeight:   400,
          }}>
            AI-powered plant disease detection with real-time weather risk assessment.
            Identify crop diseases in seconds and receive actionable treatment plans.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            <Link to="/upload" className="btn btn-primary btn-lg"
              style={{ boxShadow: '0 4px 20px rgba(22,163,74,0.30)', minWidth: 148 }}>
              Upload Image
            </Link>
            <Link to="/dashboard" className="btn btn-secondary btn-lg"
              style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(6px)', minWidth: 148 }}>
              View Dashboard
            </Link>
          </div>

          {/* Trust badges */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', color: '#6b7280', fontSize: '.8125rem' }}>
            {['16 Diseases Covered', '92% Accuracy', 'Real-time Weather', 'Free to Use'].map(t => (
              <span key={t} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                <span style={{ width: 18, height: 18, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: '#dcfce7', color: '#15803d', flexShrink: 0 }}>
                  <IcoCheck />
                </span>
                {t}
              </span>
            ))}
          </div>
        </div>

        {/* ── Stat bar ──────────────────────────────────── */}
        <div style={{
          position:       'absolute',
          bottom:          0,
          left:            0,
          right:           0,
          zIndex:          2,
          display:        'flex',
          justifyContent: 'center',
          padding:        '0 1.5rem 0',
        }}>
          <div style={{
            display:         'flex',
            gap:              0,
            background:      'rgba(255,255,255,0.92)',
            backdropFilter:  'blur(12px)',
            borderRadius:    '1.25rem 1.25rem 0 0',
            boxShadow:       '0 -2px 24px rgba(0,0,0,0.06)',
            border:          '1px solid rgba(255,255,255,0.8)',
            borderBottom:    'none',
            overflow:        'hidden',
          }}>
            {STATS.map(({ val, lbl }, i) => (
              <div key={lbl} style={{
                padding:     '1rem 2.25rem',
                textAlign:   'center',
                borderRight: i < STATS.length - 1 ? '1px solid #f3f4f6' : 'none',
              }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#15803d', lineHeight: 1, marginBottom: '0.25rem', letterSpacing: '-.02em' }}>{val}</p>
                <p style={{ fontSize: '.75rem', color: '#9ca3af', fontWeight: 500 }}>{lbl}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Scroll indicator ──────────────────────────── */}
        <div style={{
          position:  'absolute',
          bottom:    '6.5rem',
          left:      '50%',
          transform: 'translateX(-50%)',
          zIndex:     3,
          animation: 'bounce 2s ease-in-out infinite',
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          LATEST ANALYSIS BANNER
          ════════════════════════════════════════════════════ */}
      {latestAnalysis && (
        <div className="wrap-lg" style={{ paddingTop: '2rem' }}>
          <div className="anim-up" style={{
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'space-between',
            padding:        '0.875rem 1.25rem',
            borderRadius:   '1rem',
            background:     '#f0fdf4',
            border:         '1px solid #bbf7d0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 8,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: latestAnalysis.isHealthy ? '#dcfce7' : '#fee2e2',
                color:      latestAnalysis.isHealthy ? '#15803d' : '#b91c1c',
              }}>
                <IcoLeaf />
              </div>
              <div>
                <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#111827', marginBottom: 1 }}>
                  Latest: {latestAnalysis.diseaseName}
                </p>
                <p style={{ fontSize: '.75rem', color: '#6b7280' }}>
                  Confidence {latestAnalysis.confidence}% · {latestAnalysis.isHealthy ? 'Healthy' : latestAnalysis.riskLevel + ' risk'}
                </p>
              </div>
            </div>
            <Link to="/results" className="btn btn-ghost btn-sm" style={{ color: '#15803d' }}>
              View Report <IcoArrow />
            </Link>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════
          FEATURES
          ════════════════════════════════════════════════════ */}
      <section className="wrap-lg" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
        <p className="eyebrow text-center" style={{ marginBottom: '0.5rem' }}>Why SmartCrop</p>
        <h2 style={{ textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, color: '#111827', letterSpacing: '-.02em', marginBottom: '2.5rem' }}>
          Everything you need to protect your crops
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 stagger">
          {FEATURES.map(({ icon, pill, title, desc }) => (
            <div key={title} className="card anim-up" style={{
              borderTop: '3px solid transparent',
              backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #16a34a20, #3b82f620)',
              backgroundOrigin: 'border-box',
              backgroundClip: 'padding-box, border-box',
            }}>
              <div className={pill} style={{ marginBottom: '1rem' }}>{icon}</div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>{title}</h3>
              <p style={{ fontSize: '.875rem', color: '#6b7280', lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ════════════════════════════════════════════════════
          LIVE WEATHER
          ════════════════════════════════════════════════════ */}
      <section className="wrap-lg anim-up" style={{ paddingBottom: '3rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '0.875rem' }}>
          <p className="eyebrow">Live Weather</p>
          <span className={`badge ${weatherRisk.badge}`} style={{ fontSize: '.7rem' }}>
            {weatherRisk.level} Disease Risk
          </span>
        </div>
        <WeatherCard compact showRisk={false} />
      </section>

      {/* ════════════════════════════════════════════════════
          ACTION CARDS
          ════════════════════════════════════════════════════ */}
      <section className="wrap-lg" style={{ paddingBottom: '5rem' }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Link to="/upload" className="card-link" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
            <div className="icon-pill icon-pill-green" style={{ marginBottom: '1rem' }}><IcoScan /></div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>Analyze Crops</h3>
            <p style={{ fontSize: '.875rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1rem' }}>
              Upload plant images for AI-powered disease identification with confidence scores and risk breakdown.
            </p>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '.875rem', fontWeight: 600, color: '#15803d' }}>
              Start Analysis <IcoArrow />
            </span>
          </Link>

          <Link to="/map" className="card-link" style={{ background: '#eff6ff', borderColor: '#bfdbfe' }}>
            <div className="icon-pill icon-pill-blue" style={{ marginBottom: '1rem' }}><IcoMap /></div>
            <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '0.5rem' }}>View Risk Map</h3>
            <p style={{ fontSize: '.875rem', color: '#6b7280', lineHeight: 1.6, marginBottom: '1rem' }}>
              Monitor live disease hotspots and outbreak trends across your region on an interactive map.
            </p>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '.875rem', fontWeight: 600, color: '#1d4ed8' }}>
              Open Map <IcoArrow />
            </span>
          </Link>
        </div>
      </section>

      {/* Bounce animation keyframe */}
      <style>{`
        @keyframes bounce {
          0%, 100% { transform: translateX(-50%) translateY(0);    }
          50%       { transform: translateX(-50%) translateY(6px);  }
        }
      `}</style>
    </div>
  );
}
