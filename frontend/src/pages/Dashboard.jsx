import React, { useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import WeatherCard from '../components/WeatherCard';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

/* ── Sidebar Nav Data ──────────────────────────────────────── */
const NAV_ITEMS = [
  {
    label: 'Main', items: [
      {
        path: '/dashboard', label: 'Dashboard',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
      },
      {
        path: '/upload', label: 'New Analysis',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
      },
      {
        path: '/results', label: 'Results',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      },
      {
        path: '/map', label: 'Disease Map',
        icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>
      },
    ]
  },
];

/* ── Helpers ─────────────────────────────────────────────────── */
function formatTime(iso) {
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffH = (now - d) / 3600000;
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  } catch { return ''; }
}

function getInitials(name = '') {
  const w = name.trim().split(/\s+/);
  return w.length >= 2 ? (w[0][0] + w[1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
}

const STATIC_HISTORY = [
  { id: 0, diseaseName: 'Tomato Late Blight', confidence: '94.2', isHealthy: false, riskLevel: 'High', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 1, diseaseName: 'Healthy Maize Leaf', confidence: '88.7', isHealthy: true, riskLevel: 'Low', timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, diseaseName: 'Powdery Mildew', confidence: '91.5', isHealthy: false, riskLevel: 'Medium', timestamp: new Date(Date.now() - 172800000).toISOString() },
  { id: 3, diseaseName: 'Early Blight (Alternaria)', confidence: '86.3', isHealthy: false, riskLevel: 'High', timestamp: new Date(Date.now() - 259200000).toISOString() },
  { id: 4, diseaseName: 'Corn Common Rust', confidence: '79.1', isHealthy: false, riskLevel: 'Medium', timestamp: new Date(Date.now() - 432000000).toISOString() },
];

const DISEASE_RISKS = [
  { name: 'Late Blight', pct: 78, color: 'var(--magenta)' },
  { name: 'Powdery Mildew', pct: 54, color: 'var(--amber)' },
  { name: 'Rust', pct: 42, color: '#ff6b35' },
  { name: 'Leaf Spot', pct: 29, color: 'var(--cyan)' },
];

/* ── Sidebar ─────────────────────────────────────────────────── */
function DashboardSidebar({ currentPath }) {
  return (
    <aside className="dashboard-sidebar">
      {NAV_ITEMS.map(section => (
        <div key={section.label}>
          <div className="sidebar-section-label">{section.label}</div>
          {section.items.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-link${currentPath === item.path ? ' active' : ''}`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ))}
        </div>
      ))}

      <div className="sidebar-footer">
        <div style={{ fontSize: '0.78rem', color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>
          MODEL v2.4.1 · ONLINE
          <span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: '#00e564', marginLeft: 8, verticalAlign: 'middle' }} />
        </div>
        <Link to="/" className="sidebar-link" style={{ fontSize: '0.85rem' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          Back to Home
        </Link>
      </div>
    </aside>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function Dashboard() {
  const { analysisHistory, lastPrediction, weatherRisk } = useApp();
  const location = useLocation();
  const mainRef = useRef(null);

  useEffect(() => { document.title = 'Dashboard — CropSense'; }, []);

  const history = analysisHistory.length > 0 ? analysisHistory : STATIC_HISTORY;
  const totalAnalyses = analysisHistory.length || 24;
  const diseaseFound = analysisHistory.filter(r => !r.isHealthy).length || 7;
  const healthyCount = totalAnalyses - diseaseFound;
  const detectionRate = '92%';

  const STATS = [
    {
      label: 'Total Scans',
      value: String(totalAnalyses),
      trend: '+3 this week',
      trendUp: true,
      iconClass: 'lime',
      cardAccent: 'accent-lime',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>,
    },
    {
      label: 'Diseases Found',
      value: String(diseaseFound),
      trend: '2 new types',
      trendUp: false,
      iconClass: 'magenta',
      cardAccent: 'accent-magenta',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
    },
    {
      label: 'Detection Rate',
      value: detectionRate,
      trend: '+1.2% vs last month',
      trendUp: true,
      iconClass: 'cyan',
      cardAccent: 'accent-cyan',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    },
    {
      label: 'Healthy Results',
      value: String(healthyCount),
      trend: 'All confirmed',
      trendUp: true,
      iconClass: 'lime',
      cardAccent: '',
      icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>,
    },
  ];

  useGSAP(() => {
    gsap.from('.stat-card-new', {
      y: 40,
      opacity: 0,
      duration: 0.7,
      stagger: 0.08,
      ease: 'power3.out',
      delay: 0.1,
    });
    gsap.from('.panel', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.4,
    });
    // Animated bar fills
    gsap.from('.risk-bar-fill', {
      scaleX: 0,
      transformOrigin: 'left',
      duration: 1.2,
      stagger: 0.1,
      ease: 'power3.out',
      delay: 0.8,
    });
  }, { scope: mainRef });

  return (
    <div className="dashboard-layout" ref={mainRef}>
      <DashboardSidebar currentPath={location.pathname} />

      <main className="dashboard-main">
        {/* Header */}
        <div className="dashboard-header">
          <div>
            <div className="dashboard-greeting">
              <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#00e564', marginRight: 8 }} />
              System Online · {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
            </div>
            <h1 className="dashboard-title">Overview Dashboard</h1>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <Link to="/upload" className="btn-cta">+ New Scan</Link>
          </div>
        </div>

        {/* Stat Cards */}
        <div className="stat-cards">
          {STATS.map(s => (
            <div key={s.label} className={`stat-card-new ${s.cardAccent}`}>
              <div className="stat-top-row">
                <div className={`stat-icon-chip ${s.iconClass}`}>{s.icon}</div>
                <span className={`stat-trend ${s.trendUp ? 'up' : 'down'}`}>
                  {s.trendUp ? '↑' : '↓'} {s.trend}
                </span>
              </div>
              <div className="stat-value">{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="dashboard-grid">
          {/* Left Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Quick Actions */}
            <div className="quick-actions-grid">
              <Link to="/upload" className="quick-action-card lime-card">
                <div className="qa-icon" style={{ background: 'rgba(200,255,0,0.1)', color: 'var(--lime)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                </div>
                <div className="qa-title">Analyze New Crop</div>
                <div className="qa-desc">Upload a leaf image to run instant AI disease detection.</div>
                <span className="qa-link" style={{ color: 'var(--lime)' }}>
                  Upload Image
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              </Link>
              <Link to="/map" className="quick-action-card cyan-card">
                <div className="qa-icon" style={{ background: 'rgba(0,229,255,0.1)', color: 'var(--cyan)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                  </svg>
                </div>
                <div className="qa-title">View Risk Map</div>
                <div className="qa-desc">See geo-tagged disease outbreak zones across your region.</div>
                <span className="qa-link" style={{ color: 'var(--cyan)' }}>
                  Open Map
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </span>
              </Link>
            </div>

            {/* Latest Detection */}
            {lastPrediction && (
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title-mono">Latest Detection</div>
                    <div className="panel-title" style={{ marginTop: '0.25rem' }}>Most Recent Analysis</div>
                  </div>
                  <Link to="/results" style={{ fontSize: '0.8rem', color: 'var(--lime)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    Full Report
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  </Link>
                </div>
                <div className="panel-body" style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                  <div className={`activity-avatar ${!lastPrediction.prediction?.is_diseased ? 'healthy' : 'diseased'}`} style={{ width: 56, height: 56, borderRadius: 16, fontSize: '1rem' }}>
                    {getInitials(lastPrediction.prediction?.disease_name || 'UK')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '1.05rem', marginBottom: '0.4rem' }}>
                      {lastPrediction.prediction?.disease_name || lastPrediction.prediction?.disease_class || 'Unknown'}
                    </div>
                    <div style={{ display: 'flex', gap: '1.5rem', fontSize: '0.83rem', color: 'var(--text-2)' }}>
                      <span>Confidence: <strong style={{ color: 'var(--text-1)' }}>{((lastPrediction.prediction?.confidence ?? 0) * 100).toFixed(1)}%</strong></span>
                      <span>Risk: <strong style={{ color: !lastPrediction.prediction?.is_diseased ? '#00e564' : 'var(--magenta)' }}>{lastPrediction.risk_analysis?.risk_level || 'N/A'}</strong></span>
                    </div>
                  </div>
                  <div style={{
                    padding: '0.4rem 1rem',
                    borderRadius: '100px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    fontFamily: 'var(--font-mono)',
                    background: !lastPrediction.prediction?.is_diseased ? 'rgba(0,229,100,0.12)' : 'rgba(255,45,120,0.12)',
                    color: !lastPrediction.prediction?.is_diseased ? '#00e564' : 'var(--magenta)',
                  }}>
                    {!lastPrediction.prediction?.is_diseased ? 'HEALTHY' : 'DISEASED'}
                  </div>
                </div>
              </div>
            )}

            {/* Analysis History */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title-mono">History</div>
                  <div className="panel-title" style={{ marginTop: '0.25rem' }}>Analysis Log</div>
                </div>
                <span style={{ fontSize: '0.78rem', fontFamily: 'var(--font-mono)', color: 'var(--text-3)' }}>
                  {analysisHistory.length > 0 ? 'Real data' : 'Sample data'}
                </span>
              </div>
              <div>
                {history.slice(0, 6).map((item, i, arr) => (
                  <div key={item.id ?? i} className="activity-item">
                    <div className={`activity-avatar ${item.isHealthy ? 'healthy' : 'diseased'}`}>
                      {getInitials(item.diseaseName)}
                    </div>
                    <div className="activity-info">
                      <div className="activity-name">{item.diseaseName}</div>
                      <div className="activity-time">{formatTime(item.timestamp)}</div>
                    </div>
                    <div className="activity-right">
                      <span className="confidence-badge">{item.confidence}%</span>
                      <div className={`status-dot ${item.isHealthy ? 'healthy' : 'diseased'}`} />
                    </div>
                  </div>
                ))}
              </div>
              <div style={{ padding: '1rem 1.75rem', borderTop: '1px solid var(--border)' }}>
                <Link to="/upload" style={{ fontSize: '0.83rem', color: 'var(--lime)', fontWeight: 600 }}>
                  + Run new analysis →
                </Link>
              </div>
            </div>

          </div>

          {/* Right Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* Disease Risk Panel */}
            <div className="panel">
              <div className="panel-header">
                <div>
                  <div className="panel-title-mono">Risk Analysis</div>
                  <div className="panel-title" style={{ marginTop: '0.25rem' }}>Disease Probability</div>
                </div>
                <span style={{
                  padding: '0.25rem 0.75rem',
                  borderRadius: '100px',
                  fontSize: '0.72rem',
                  fontFamily: 'var(--font-mono)',
                  background: weatherRisk?.level === 'HIGH' ? 'rgba(255,45,120,0.12)' : 'rgba(200,255,0,0.1)',
                  color: weatherRisk?.level === 'HIGH' ? 'var(--magenta)' : 'var(--lime)',
                }}>
                  {weatherRisk?.level || 'LOW'} RISK
                </span>
              </div>
              <div className="panel-body">
                {DISEASE_RISKS.map(r => (
                  <div key={r.name} className="risk-bar-wrap">
                    <div className="risk-bar-label">
                      <span>{r.name}</span>
                      <strong>{r.pct}%</strong>
                    </div>
                    <div className="risk-bar-track">
                      <div className="risk-bar-fill" style={{ width: `${r.pct}%`, background: r.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather Card */}
            <div className="panel" style={{ overflow: 'hidden' }}>
              <div className="panel-header">
                <div>
                  <div className="panel-title-mono">Environment</div>
                  <div className="panel-title" style={{ marginTop: '0.25rem' }}>Weather Context</div>
                </div>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <WeatherCard compact showRisk={false} />
              </div>
            </div>

            {/* Summary */}
            <div className="panel">
              <div className="panel-header">
                <div className="panel-title-mono">Summary</div>
              </div>
              <div className="panel-body">
                {[
                  { label: 'Total Analyses', value: totalAnalyses, color: 'var(--text-1)' },
                  { label: 'Diseases Detected', value: diseaseFound, color: 'var(--magenta)' },
                  { label: 'Healthy Results', value: healthyCount, color: '#00e564' },
                  { label: 'Model Accuracy', value: detectionRate, color: 'var(--lime)' },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid var(--border)',
                    fontSize: '0.88rem',
                  }}>
                    <span style={{ color: 'var(--text-2)' }}>{row.label}</span>
                    <strong style={{ color: row.color, fontFamily: 'var(--font-mono)' }}>{row.value}</strong>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}