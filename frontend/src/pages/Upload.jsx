import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { predictDisease } from '../utils/api';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';

/* ── Icons ─────────────────────────────────────────────────── */
const IconUpload = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
  </svg>
);
const IconX = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IconAlert = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
);
const IconScan = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/>
    <path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/>
    <rect x="7" y="7" width="10" height="10" rx="1"/>
  </svg>
);
const IconPin = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

const TIPS = [
  { text: 'Shoot in natural daylight, avoid flash reflections on the leaf surface.', num: '01' },
  { text: 'Focus directly on the affected area — fill at least 60% of the frame.', num: '02' },
  { text: 'Avoid heavily blurred or shadowed shots for best accuracy.', num: '03' },
  { text: 'Minimum recommended resolution is 1 megapixel (1MP).', num: '04' },
];

/* ── Scanning animation overlay ────────────────────────────── */
function ScanLine() {
  return (
    <div style={{
      position: 'absolute',
      inset: 0,
      pointerEvents: 'none',
      overflow: 'hidden',
      borderRadius: 'var(--radius-xl)',
      zIndex: 3,
    }}>
      <div style={{
        position: 'absolute',
        left: 0,
        right: 0,
        height: '2px',
        background: 'linear-gradient(90deg, transparent, var(--lime), transparent)',
        boxShadow: '0 0 12px var(--lime)',
        animation: 'scan-line 1.5s ease-in-out infinite',
      }} />
      <style>{`
        @keyframes scan-line {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
      {/* Corner brackets */}
      {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map(corner => (
        <div key={corner} style={{
          position: 'absolute',
          width: 20,
          height: 20,
          ...(corner.includes('top') ? { top: 16 } : { bottom: 16 }),
          ...(corner.includes('left') ? { left: 16 } : { right: 16 }),
          borderTop: corner.includes('top') ? '2px solid var(--lime)' : 'none',
          borderBottom: corner.includes('bottom') ? '2px solid var(--lime)' : 'none',
          borderLeft: corner.includes('left') ? '2px solid var(--lime)' : 'none',
          borderRight: corner.includes('right') ? '2px solid var(--lime)' : 'none',
        }} />
      ))}
    </div>
  );
}

/* ── Main Component ─────────────────────────────────────────── */
export default function Upload() {
  const navigate = useNavigate();
  const { userLocation, weather, savePrediction } = useApp();
  const pageRef = useRef(null);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { document.title = 'Analyze — CropSense'; }, []);

  useGSAP(() => {
    gsap.from('.upload-page-layout > *', {
      y: 50,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
    });
  }, { scope: pageRef });

  const processFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
    if (!allowed.includes(f.type)) { setError('Invalid format. Use JPG, PNG, GIF, BMP, or WebP.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File too large. Max 10 MB.'); return; }
    setFile(f); setError(null);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target.result);
    r.readAsDataURL(f);
  };

  const handleInput = (e) => processFile(e.target.files?.[0]);
  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); }, []);
  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const clearFile = () => { setFile(null); setPreview(null); setError(null); };

  const handleAnalyze = async () => {
    if (!file) { setError('Please select an image first.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await predictDisease(file, userLocation?.latitude, userLocation?.longitude);
      if (res.success) {
        savePrediction(res, preview);
        navigate('/results', { state: { prediction: res, originalImage: preview } });
      } else {
        setError('Analysis failed. Please try again.');
      }
    } catch (e) {
      setError(e.message || 'Error processing image. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="page" ref={pageRef}>
      {/* Page Header */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '2.5rem 2rem 0',
      }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--lime)', letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ width: 24, height: 1, background: 'var(--lime)', display: 'inline-block' }} />
          Diagnostics
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '0.5rem' }}>
          Upload & Analyze
        </h1>
        <p style={{ color: 'var(--text-2)', maxWidth: 480, lineHeight: 1.6 }}>
          Provide a clear image of the affected plant. Our AI will return a full diagnostic report in under 2 seconds.
        </p>
      </div>

      {/* Error */}
      {error && (
        <div style={{ maxWidth: 1200, margin: '1.5rem auto 0', padding: '0 2rem' }}>
          <div className="error-alert">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <IconAlert />
              {error}
            </div>
            <button onClick={() => setError(null)} style={{ color: 'var(--magenta)', flexShrink: 0 }}>
              <IconX />
            </button>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div className="upload-page-layout">
        {/* Upload Zone */}
        <div>
          {!preview ? (
            <label
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{ cursor: loading ? 'not-allowed' : 'pointer' }}
            >
              <input type="file" accept="image/*" onChange={handleInput} style={{ display: 'none' }} disabled={loading} />
              <div className="upload-icon-wrap">
                <IconUpload />
              </div>
              <h3 className="upload-title">
                {dragOver ? 'Release to Upload' : 'Drop Image Here'}
              </h3>
              <p className="upload-sub">or click to browse files</p>
              <div className="upload-meta">JPG · PNG · WEBP · GIF · BMP &nbsp;·&nbsp; MAX 10 MB</div>
            </label>
          ) : (
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'relative', borderRadius: 'var(--radius-xl)', overflow: 'hidden', background: 'var(--bg-1)', border: '1px solid var(--border)' }}>
                <img src={preview} alt="Preview" className="preview-img" />
                {loading && <ScanLine />}
                {loading && (
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(3,3,3,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    zIndex: 4,
                    backdropFilter: 'blur(4px)',
                  }}>
                    <div style={{
                      width: 56,
                      height: 56,
                      border: '3px solid rgba(200,255,0,0.2)',
                      borderTopColor: 'var(--lime)',
                      borderRadius: '50%',
                      animation: 'spin 0.7s linear infinite',
                    }} />
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--lime)', letterSpacing: '0.15em' }}>
                      RUNNING INFERENCE...
                    </div>
                  </div>
                )}
                <div className="preview-toolbar">
                  <button className="preview-tool-btn" onClick={clearFile} disabled={loading}>
                    <IconX />
                  </button>
                </div>
                {/* File info bar */}
                {file && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '1rem 1.25rem',
                    background: 'linear-gradient(to top, rgba(3,3,3,0.9), transparent)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    zIndex: 2,
                  }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.05em' }}>
                      {file.name}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'rgba(255,255,255,0.5)' }}>
                      {(file.size / 1024).toFixed(0)} KB
                    </span>
                  </div>
                )}
              </div>

              {/* Analyze Button */}
              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="analyze-btn"
              >
                {loading ? (
                  <>
                    <div className="spinner-ring" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} />
                    Processing Model...
                  </>
                ) : (
                  <>
                    <IconScan />
                    Execute Analysis
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div>
          {/* Location context */}
          {weather && (
            <div className="upload-sidebar-card" style={{ marginBottom: '1.25rem' }}>
              <div className="upload-sidebar-title">
                <span style={{ color: 'var(--cyan)' }}><IconPin /></span>
                Location Context
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-2)' }}>Location</span>
                  <strong>{weather.location?.name || 'Unknown'}</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-2)' }}>Temperature</span>
                  <strong>{Math.round(weather.temperature ?? 0)}°C</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <span style={{ color: 'var(--text-2)' }}>Conditions</span>
                  <strong style={{ textAlign: 'right', maxWidth: '55%' }}>{weather.description}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Photography Tips */}
          <div className="upload-sidebar-card">
            <div className="upload-sidebar-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--lime)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Photo Guidelines
            </div>
            {TIPS.map((tip, i) => (
              <div key={i} className="tip-item">
                <span className="tip-num">{tip.num}</span>
                <span>{tip.text}</span>
              </div>
            ))}
          </div>

          {/* Supported Crops */}
          <div className="upload-sidebar-card" style={{ marginTop: '1.25rem' }}>
            <div className="upload-sidebar-title">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10z"/>
                <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>
              </svg>
              Supported Diseases
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {['Late Blight', 'Powdery Mildew', 'Rust', 'Early Blight', 'Leaf Spot', 'Downy Mildew', 'Anthracnose', 'Mosaic Virus'].map(d => (
                <span key={d} style={{
                  padding: '0.25rem 0.65rem',
                  borderRadius: '100px',
                  background: 'var(--bg-2)',
                  border: '1px solid var(--border)',
                  fontSize: '0.75rem',
                  color: 'var(--text-2)',
                  fontFamily: 'var(--font-mono)',
                }}>
                  {d}
                </span>
              ))}
              <span style={{
                padding: '0.25rem 0.65rem',
                borderRadius: '100px',
                background: 'rgba(200,255,0,0.08)',
                border: '1px solid rgba(200,255,0,0.2)',
                fontSize: '0.75rem',
                color: 'var(--lime)',
                fontFamily: 'var(--font-mono)',
              }}>
                +8 more
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
