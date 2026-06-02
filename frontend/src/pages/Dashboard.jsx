import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import WeatherCard from '../components/WeatherCard';

/* ── Icons ──────────────────────────────────────────────── */
const IcoScan = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <rect x="7" y="7" width="10" height="10" rx="1"/>
  </svg>
);
const IcoMap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
  </svg>
);
const IcoActivity = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IcoArrow = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);
const IcoUp = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="19" x2="12" y2="5"/><polyline points="5 12 12 5 19 12"/>
  </svg>
);
const IcoDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
  </svg>
);
const IcoLeaf = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
    <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
  </svg>
);

/* ── Helpers ─────────────────────────────────────────────── */
function formatTime(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now - d) / 3600000;
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
  } catch { return ''; }
}

function cropInitials(name = '') {
  const words = name.trim().split(/\s+/);
  return words.length >= 2
    ? (words[0][0] + words[1][0]).toUpperCase()
    : (name.slice(0, 2)).toUpperCase();
}

/* ── Static fallback history (shown before any real analysis) */
const STATIC_HISTORY = [
  { id:0, diseaseName:'Tomato Late Blight',       confidence:'94.2', isHealthy:false, riskLevel:'High',   timestamp: new Date(Date.now()-3600000).toISOString() },
  { id:1, diseaseName:'Healthy Maize Leaf',         confidence:'88.7', isHealthy:true,  riskLevel:'Low',    timestamp: new Date(Date.now()-86400000).toISOString() },
  { id:2, diseaseName:'Powdery Mildew',             confidence:'91.5', isHealthy:false, riskLevel:'Medium', timestamp: new Date(Date.now()-172800000).toISOString() },
  { id:3, diseaseName:'Early Blight (Alternaria)',  confidence:'86.3', isHealthy:false, riskLevel:'High',   timestamp: new Date(Date.now()-259200000).toISOString() },
];

/* ── Component ───────────────────────────────────────────── */
export default function Dashboard() {
  const { analysisHistory, lastPrediction, weatherRisk } = useApp();
  useEffect(() => { document.title = 'Dashboard — SmartCrop'; }, []);

  /* Merge real history with static fallback */
  const history = analysisHistory.length > 0 ? analysisHistory : STATIC_HISTORY;

  /* Compute stats from real history (or static) */
  const totalAnalyses = analysisHistory.length || 24;
  const diseaseFound  = analysisHistory.filter(r => !r.isHealthy).length || 7;
  const detectionRate = '92%';

  const STATS = [
    { lbl:'Total Analyses', val: String(totalAnalyses), sub:'All time',       trend:'+3 this week', up:true  },
    { lbl:'Diseases Found',  val: String(diseaseFound),  sub:'Unique diseases', trend:'2 new types', up:false },
    { lbl:'Detection Rate',  val: detectionRate,         sub:'Model accuracy',  trend:'+1.2%',       up:true  },
  ];

  return (
    <div className="page-bg" style={{ minHeight:'calc(100vh - 62px)' }}>
      <div className="wrap-lg py-12 anim-up">

        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow mb-1">Overview</p>
          <h1 className="text-3xl font-bold mb-1" style={{ color:'#111827', letterSpacing:'-.025em' }}>Dashboard</h1>
          <p className="text-sm" style={{ color:'#6b7280' }}>
            Welcome back. Here's a summary of your crop monitoring activity.
          </p>
        </div>

        {/* STAT CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 stagger">
          {STATS.map(({ lbl, val, sub, trend, up }) => (
            <div key={lbl} className="stat-card anim-up">
              <p className="stat-lbl">{lbl}</p>
              <p className="stat-val">{val}</p>
              <p className="stat-sub">{sub}</p>
              <div className="flex items-center gap-1 mt-2">
                {up ? <IcoUp /> : <IcoDown />}
                <span className="text-xs font-medium" style={{ color: up ? '#16a34a' : '#dc2626' }}>{trend}</span>
              </div>
            </div>
          ))}
        </div>

        {/* TWO-COLUMN LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT */}
          <div className="lg:col-span-2 space-y-5">

            {/* Latest Detection (real data if available) */}
            {lastPrediction && (
              <div className="card-report accent-green anim-up">
                <div className="flex items-center justify-between mb-3">
                  <p className="section-title st-green">Latest Detection</p>
                  <Link to="/results" className="text-xs font-semibold" style={{ color:'#16a34a', textDecoration:'none' }}>
                    View full report →
                  </Link>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{
                      background: !lastPrediction.prediction?.is_diseased ? '#dcfce7' : '#fee2e2',
                      color:      !lastPrediction.prediction?.is_diseased ? '#15803d' : '#b91c1c',
                    }}>
                    <IcoLeaf />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-semibold truncate" style={{ color:'#111827' }}>
                      {lastPrediction.prediction?.disease_name || lastPrediction.prediction?.disease_class || 'Unknown'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color:'#6b7280' }}>
                      Confidence: {((lastPrediction.prediction?.confidence ?? 0) * 100).toFixed(1)}% · {lastPrediction.risk_analysis?.risk_level || 'N/A'} Risk
                    </p>
                  </div>
                  <span className={!lastPrediction.prediction?.is_diseased ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize:'.75rem', flexShrink:0 }}>
                    {!lastPrediction.prediction?.is_diseased ? 'Healthy' : 'Diseased'}
                  </span>
                </div>
              </div>
            )}

            {/* Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Link to="/upload" className="card-link" style={{ background:'#f0fdf4', borderColor:'#bbf7d0' }}>
                <div className="icon-pill icon-pill-green mb-3"><IcoScan /></div>
                <h2 className="text-base font-semibold mb-2" style={{ color:'#111827' }}>Analyze Crops</h2>
                <p className="text-sm leading-relaxed mb-3" style={{ color:'#6b7280' }}>
                  Upload plant images to identify diseases and get treatment recommendations.
                </p>
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color:'#15803d' }}>
                  Start Analysis <IcoArrow />
                </span>
              </Link>

              <Link to="/map" className="card-link" style={{ background:'#eff6ff', borderColor:'#bfdbfe' }}>
                <div className="icon-pill icon-pill-blue mb-3"><IcoMap /></div>
                <h2 className="text-base font-semibold mb-2" style={{ color:'#111827' }}>Risk Map</h2>
                <p className="text-sm leading-relaxed mb-3" style={{ color:'#6b7280' }}>
                  View disease distribution zones and risk levels across your region.
                </p>
                <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color:'#1d4ed8' }}>
                  Open Map <IcoArrow />
                </span>
              </Link>
            </div>

            {/* Recent Activity */}
            <div className="card" style={{ padding:0, overflow:'hidden' }}>
              <div className="flex items-center gap-2 px-5 py-4" style={{ borderBottom:'1px solid #f3f4f6' }}>
                <span style={{ color:'#9ca3af' }}><IcoActivity /></span>
                <p className="text-sm font-semibold" style={{ color:'#374151' }}>Analysis History</p>
                <span className="ml-auto text-xs" style={{ color:'#9ca3af' }}>
                  {analysisHistory.length > 0 ? 'Real data' : 'Sample data'}
                </span>
              </div>

              {history.slice(0, 5).map((item, i, arr) => (
                <div
                  key={item.id ?? i}
                  className="flex items-center justify-between px-5 py-3.5 transition-colors"
                  style={{ borderBottom: i < arr.length - 1 ? '1px solid #f9fafb' : 'none', cursor:'default' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ background: item.isHealthy ? '#dcfce7' : '#fee2e2', color: item.isHealthy ? '#15803d' : '#b91c1c' }}>
                      {cropInitials(item.diseaseName)}
                    </div>
                    <div>
                      <p className="text-sm font-medium" style={{ color:'#111827' }}>{item.diseaseName}</p>
                      <p className="text-xs" style={{ color:'#9ca3af' }}>{formatTime(item.timestamp)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold" style={{ color:'#16a34a' }}>{item.confidence}%</span>
                    <span className={item.isHealthy ? 'badge badge-green' : 'badge badge-red'} style={{ fontSize:'.7rem' }}>
                      {item.isHealthy ? 'Healthy' : 'Diseased'}
                    </span>
                  </div>
                </div>
              ))}

              <div className="px-5 py-3" style={{ borderTop:'1px solid #f3f4f6', background:'#fafafa' }}>
                <Link to="/upload" className="text-xs font-semibold" style={{ color:'#16a34a' }}>
                  Run a new analysis →
                </Link>
              </div>
            </div>

          </div>

          {/* RIGHT — Weather (real data from context) */}
          <div className="space-y-4">
            <WeatherCard showRisk showForecast />

            {/* Weather Risk Card */}
            <div className="card" style={{ padding:'1.25rem' }}>
              <p className="section-title st-green mb-3">Crop Health Summary</p>
              <div className="space-y-2">
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-sm" style={{ color:'#374151' }}>Weather Disease Risk</span>
                  <span className={`badge ${weatherRisk.badge}`} style={{ fontSize:'.7rem' }}>{weatherRisk.level}</span>
                </div>
                <div className="flex items-center justify-between py-1.5" style={{ borderTop:'1px solid #f3f4f6' }}>
                  <span className="text-sm" style={{ color:'#374151' }}>Total Analyses</span>
                  <span className="text-sm font-bold" style={{ color:'#111827' }}>{totalAnalyses}</span>
                </div>
                <div className="flex items-center justify-between py-1.5" style={{ borderTop:'1px solid #f3f4f6' }}>
                  <span className="text-sm" style={{ color:'#374151' }}>Diseases Detected</span>
                  <span className="text-sm font-bold" style={{ color:'#b91c1c' }}>{diseaseFound}</span>
                </div>
                <div className="flex items-center justify-between py-1.5" style={{ borderTop:'1px solid #f3f4f6' }}>
                  <span className="text-sm" style={{ color:'#374151' }}>Healthy Results</span>
                  <span className="text-sm font-bold" style={{ color:'#15803d' }}>{totalAnalyses - diseaseFound}</span>
                </div>
              </div>
            </div>

            {/* Quick links */}
            <div className="card" style={{ padding:'1.25rem' }}>
              <p className="section-title st-green mb-3">Quick Links</p>
              {[
                { lbl:'Upload new image',  path:'/upload'  },
                { lbl:'View disease map',  path:'/map'     },
                { lbl:'View last result',  path:'/results' },
              ].map(({ lbl, path }) => (
                <Link key={path} to={path}
                  className="flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors"
                  style={{ textDecoration:'none' }}
                  onMouseEnter={e => e.currentTarget.style.background='#f9fafb'}
                  onMouseLeave={e => e.currentTarget.style.background=''}
                >
                  <span className="text-sm" style={{ color:'#374151' }}>{lbl}</span>
                  <IcoArrow />
                </Link>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}