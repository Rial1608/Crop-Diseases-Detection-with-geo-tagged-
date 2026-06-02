import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { predictDisease } from '../utils/api';

/* ── Icons ──────────────────────────────────────────────── */
const IcoUpload = () => (
  <svg className="upload-zone-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);
const IcoX = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);
const IcoAlert = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
);
const IcoImage = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
  </svg>
);
const IcoCheck = () => (
  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const IcoPin = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0369a1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);

/* ── Tips ─────────────────────────────────────────────────── */
const TIPS = [
  'Use clear photos in natural daylight — avoid flash or dim lighting.',
  'Focus the camera directly on the affected leaf area for best accuracy.',
  'Keep the leaf centered in frame and avoid blurry or overexposed shots.',
  'High-resolution images (above 1 MP) produce more reliable AI results.',
];

/* ── Component ────────────────────────────────────────────── */
export default function Upload() {
  const navigate = useNavigate();
  const { userLocation, weather, weatherRisk, savePrediction } = useApp();

  const [file,     setFile]     = useState(null);
  const [preview,  setPreview]  = useState(null);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => { document.title = 'Analyze — SmartCrop'; }, []);

  const processFile = (f) => {
    if (!f) return;
    const allowed = ['image/jpeg','image/png','image/gif','image/bmp','image/webp'];
    if (!allowed.includes(f.type)) { setError('Invalid file type. Upload JPG, PNG, GIF, BMP, or WebP.'); return; }
    if (f.size > 10 * 1024 * 1024) { setError('File too large — max 10 MB.'); return; }
    setFile(f); setError(null);
    const r = new FileReader();
    r.onload = (e) => setPreview(e.target.result);
    r.readAsDataURL(f);
  };

  const handleInput     = (e) => processFile(e.target.files?.[0]);
  const handleDrop      = useCallback((e) => { e.preventDefault(); setDragOver(false); processFile(e.dataTransfer.files?.[0]); }, []);
  const handleDragOver  = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const clearFile       = () => { setFile(null); setPreview(null); setError(null); };

  const handleAnalyze = async () => {
    if (!file) { setError('Please select an image first.'); return; }
    setLoading(true); setError(null);
    try {
      const res = await predictDisease(
        file,
        userLocation?.latitude,
        userLocation?.longitude,
      );
      if (res.success) {
        savePrediction(res, preview);                    // ← persist to global context (with image)
        navigate('/results', {
          state: {
            prediction:    res,
            originalImage: preview,   // ← data URL for side-by-side display
          },
        });
      } else {
        setError('Prediction failed. Please try again.');
      }
    } catch (e) {
      setError(e.message || 'Error analysing image. Please try again.');
    } finally { setLoading(false); }
  };


  return (
    <div className="page-bg" style={{ minHeight:'calc(100vh - 62px)' }}>
      <div className="wrap-sm py-14 anim-up">

        {/* Header */}
        <div className="mb-8">
          <p className="eyebrow mb-1">AI Detection</p>
          <h1 className="text-3xl font-bold mb-2" style={{ color:'#111827', letterSpacing:'-.025em' }}>
            Analyze Your Crop
          </h1>
          <p className="text-sm leading-relaxed" style={{ color:'#6b7280' }}>
            Upload a clear image of your plant leaf to get instant AI-powered disease detection, risk scoring, and a personalised treatment plan.
          </p>
        </div>

        {/* Live weather risk hint */}
        {weather && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5" style={{ background:'#eff6ff', border:'1px solid #bfdbfe' }}>
            <IcoPin />
            <p className="text-xs" style={{ color:'#0369a1' }}>
              <strong>{weather.location?.name}</strong> · {Math.round(weather.temperature ?? 0)}°C · {weather.description}
            </p>
            <span className={`badge ${weatherRisk.badge} ml-auto`} style={{ fontSize:'.68rem' }}>
              {weatherRisk.level} Disease Risk
            </span>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="alert alert-error mb-5 anim-in">
            <IcoAlert /><span>{error}</span>
            <button onClick={() => setError(null)}
              style={{ background:'none', border:'none', cursor:'pointer', marginLeft:'auto', opacity:.6, display:'flex', alignItems:'center' }}>
              <IcoX />
            </button>
          </div>
        )}

        {/* Upload Card */}
        <div className="card mb-4" style={{ padding:'1.75rem' }}>
          <div className="flex items-center gap-2 mb-4">
            <div className="icon-pill icon-pill-green" style={{ width:30, height:30, borderRadius:8 }}>
              <IcoImage />
            </div>
            <p className="text-sm font-semibold" style={{ color:'#374151' }}>Upload Plant Image</p>
          </div>

          {!preview ? (
            <label
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input type="file" accept="image/*" onChange={handleInput} className="sr-only" disabled={loading} />
              <IcoUpload />
              <p className="text-sm font-semibold" style={{ color:'#374151' }}>Click to upload or drag &amp; drop</p>
              <p className="text-xs" style={{ color:'#9ca3af' }}>JPG, PNG, GIF, BMP or WebP — max 10 MB</p>
            </label>
          ) : (
            <div>
              <div className="relative mb-4 rounded-2xl overflow-hidden"
                style={{ height:'20rem', background:'#f9fafb', border:'1px solid #f3f4f6' }}>
                <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                <button onClick={clearFile} disabled={loading}
                  style={{ position:'absolute', top:10, right:10, width:28, height:28, borderRadius:'50%',
                    background:'white', border:'1px solid #e5e7eb', cursor:'pointer',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    boxShadow:'0 1px 4px rgba(0,0,0,.1)' }}>
                  <IcoX />
                </button>
              </div>
              <p className="text-xs mb-4 truncate" style={{ color:'#9ca3af' }}>{file?.name}</p>
              <div className="flex gap-3">
                <button onClick={clearFile} disabled={loading} className="btn btn-secondary flex-1">
                  Change Image
                </button>
                <button onClick={handleAnalyze} disabled={loading || !file} className="btn btn-primary flex-1">
                  {loading ? <><span className="spinner" /><span>Analyzing…</span></> : 'Analyze Now'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tips */}
        <div className="card-green">
          <p className="section-title st-green mb-3">Tips for Best Results</p>
          <ul className="space-y-1">
            {TIPS.map((t) => (
              <li key={t} className="flex items-start gap-2.5 py-1.5">
                <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background:'#bbf7d0', color:'#15803d' }}>
                  <IcoCheck />
                </span>
                <span className="text-sm leading-relaxed" style={{ color:'#374151' }}>{t}</span>
              </li>
            ))}
          </ul>
        </div>

      </div>
    </div>
  );
}
