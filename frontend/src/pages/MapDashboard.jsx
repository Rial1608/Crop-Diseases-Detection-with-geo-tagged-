import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MapView from '../components/MapView';
import { getRiskZones, getUserZoneStatus } from '../utils/api';
import { ShieldCheck, Crosshair, Navigation, Activity, ShieldAlert, RadioTower, Scan } from 'lucide-react';

/* ── Neon Risk Colors ──────────────────────────────────────── */
const RISK_COLOR = { HIGH: '#ff2d78', MEDIUM: '#ffb400', LOW: '#39ff14' };
const RISK_BG = { HIGH: 'rgba(255,45,120,0.06)', MEDIUM: 'rgba(255,180,0,0.06)', LOW: 'rgba(57,255,20,0.06)' };
const RISK_BORDER = { HIGH: 'rgba(255,45,120,0.2)', MEDIUM: 'rgba(255,180,0,0.2)', LOW: 'rgba(57,255,20,0.2)' };

const DEFAULT_CENTER = [28.6139, 77.2090];
const DEFAULT_ZOOM   = 10;

/* ── Inline Styles ─────────────────────────────────────────── */
const S = {
  card: {
    background: '#0a0a0a',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '1rem',
    padding: '1.5rem',
    position: 'relative',
    overflow: 'hidden',
    boxShadow: '0 10px 30px -10px rgba(0,0,0,0.5)',
  },
  iconBox: (color) => ({
    width: 38, height: 38, borderRadius: '0.5rem',
    background: `${color}1a`, border: `1px solid ${color}33`,
    display: 'grid', placeItems: 'center', color, flexShrink: 0,
  }),
  sectionTag: () => ({
    fontSize: '0.85rem', fontWeight: 600, letterSpacing: '0.05em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.6)',
  }),
  statValue: {
    fontFamily: "'Syne', sans-serif", fontSize: '2rem', fontWeight: 800, margin: 0, lineHeight: 1
  },
};

export default function MapDashboard() {
  const { userLocation } = useApp();

  const [zones,      setZones]      = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeZone, setActiveZone] = useState(null);
  const [dataError,  setDataError]  = useState(false);
  const [hasRealData, setHasRealData] = useState(false);

  useEffect(() => {
    document.title = 'Map — Agro Radar';
    loadMapData();
  }, [userLocation]);

  const loadMapData = async () => {
    setLoading(true); setDataError(false);
    try {
      const lat = userLocation?.latitude;
      const lng = userLocation?.longitude;
      const zonesRes = await getRiskZones(lat, lng);
      setZones(zonesRes.zones?.zones || []);
      setHasRealData(zonesRes.zones?.has_real_data || false);

      if (lat && lng) {
        const statusRes = await getUserZoneStatus(lat, lng);
        setUserStatus(statusRes.status || null);
      }
    } catch (err) {
      console.error(err);
      setDataError(true);
    } finally {
      setLoading(false);
    }
  };

  const mapCenter = userLocation ? [userLocation.latitude, userLocation.longitude] : DEFAULT_CENTER;
  const mapZoom = DEFAULT_ZOOM;

  const highCount   = zones.filter(z => z.risk_level === 'HIGH').length;
  const mediumCount = zones.filter(z => z.risk_level === 'MEDIUM').length;
  const lowCount    = zones.filter(z => z.risk_level === 'LOW').length;

  return (
    <div style={{ minHeight: '100vh', background: '#000', color: '#fff', paddingTop: '140px', paddingBottom: '4rem', overflowX: 'hidden' }}>
      
      {/* Decorative BG Grid */}
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% -20%, rgba(57,255,20,0.08), transparent 60%)', pointerEvents: 'none' }} />
      
      <div className="wrap-lg" style={{ position: 'relative', zIndex: 10 }}>
        
        {/* HEADER */}
        <div style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#39ff14', background: 'rgba(57,255,20,0.1)', padding: '0.4rem 1rem', borderRadius: '100px', border: '1px solid rgba(57,255,20,0.2)' }}>
                <RadioTower size={14} /> Live Satellite Intel
              </span>
              {!hasRealData && <span style={{ fontSize: '0.75rem', color: '#ffb400' }}>Demo Mode (Upload to track local data)</span>}
            </div>
            <h1 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.2rem, 4vw, 3.5rem)', fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>
              Pathogen Topography
            </h1>
          </div>
          {userLocation && (
            <div style={{ textAlign: 'right' }}>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.3rem' }}>Sensor Uplink</p>
              <p style={{ fontFamily: "'DM Mono', monospace", fontSize: '1.1rem', color: '#fff', margin: 0 }}>
                {userLocation.latitude.toFixed(4)}N, {userLocation.longitude.toFixed(4)}E
              </p>
            </div>
          )}
        </div>

        {/* MAIN GRID - Wider gap and broader map area */}
        <div className="map-grid">
          
          {/* MAP CONTAINER */}
          <div style={{ ...S.card, padding: 0, height: '780px', display: 'flex', flexDirection: 'column' }}>
            {/* Map Header */}
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#050505', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Navigation size={18} color="#00e5ff" />
                <span style={{ fontWeight: 600, fontSize: '0.95rem', letterSpacing: '0.03em' }}>Geospatial Analysis</span>
              </div>
              <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                {hasRealData ? 'Live Data Feed' : 'Simulated Feed'}
              </span>
            </div>
            
            {/* The Map itself */}
            <div style={{ flex: 1, position: 'relative' }}>
              <MapView zones={zones} userLocation={userLocation} center={mapCenter} zoom={mapZoom} />
              
              {loading && (
                <div style={{ position: 'absolute', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <Scan size={48} color="#39ff14" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
                    <span style={{ fontSize: '0.9rem', color: '#39ff14', letterSpacing: '0.1em', fontWeight: 600 }}>SCANNING REGION...</span>
                  </div>
                </div>
              )}
            </div>

            {/* Map Legend */}
            <div style={{ padding: '1rem 1.5rem', background: '#050505', borderTop: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexWrap: 'wrap', gap: '1.5rem', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.05em', color: 'rgba(255,255,255,0.5)' }}>
              {[['HIGH', '#ff2d78'], ['MEDIUM', '#ffb400'], ['LOW', '#39ff14']].map(([lvl, col]) => (
                <span key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ width: 12, height: 12, borderRadius: '50%', background: col, boxShadow: `0 0 12px ${col}80` }} /> 
                  {lvl} THREAT
                </span>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginLeft: 'auto' }}>
                <span style={{ width: 12, height: 12, borderRadius: '50%', background: '#3b82f6', border: '1px solid #fff' }} /> 
                USER LOCATION
              </span>
            </div>
          </div>

          {/* SIDEBAR */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Status Panel */}
            <div style={{ ...S.card, borderColor: userStatus?.current_zone ? RISK_BORDER[userStatus.current_zone.risk] : 'rgba(57,255,20,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={S.iconBox(userStatus?.current_zone ? RISK_COLOR[userStatus.current_zone.risk] : '#39ff14')}><Activity size={20} /></div>
                <span style={S.sectionTag()}>Area Status</span>
              </div>
              
              {userStatus?.current_zone ? (
                <div style={{ padding: '1.25rem', background: RISK_BG[userStatus.current_zone.risk], border: `1px solid ${RISK_BORDER[userStatus.current_zone.risk]}`, borderRadius: '0.75rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Active Exposure</p>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em', padding: '0.2rem 0.6rem', borderRadius: '100px', background: RISK_COLOR[userStatus.current_zone.risk], color: '#000' }}>
                      {userStatus.current_zone.risk} RISK
                    </span>
                  </div>
                  <p style={{ fontSize: '1.2rem', fontWeight: 600, color: '#fff', margin: 0 }}>{userStatus.current_zone.name}</p>
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '0.75rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <ShieldCheck size={36} color="#39ff14" />
                  <div>
                    <p style={{ color: '#39ff14', fontWeight: 600, fontSize: '1.1rem', margin: '0 0 0.3rem 0' }}>Safe Sector</p>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem', margin: 0, lineHeight: 1.5 }}>No immediate crop threats detected nearby.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Statistics */}
            <div style={S.card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
                <div style={S.iconBox('#00e5ff')}><Crosshair size={20} /></div>
                <span style={S.sectionTag()}>Threat Metrics</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {[
                  { lbl: 'Critical', val: highCount, col: '#ff2d78' },
                  { lbl: 'Warning',  val: mediumCount, col: '#ffb400' },
                  { lbl: 'Controlled', val: lowCount, col: '#39ff14' },
                  { lbl: 'Total Nodes', val: zones.length, col: '#fff' }
                ].map((s, i) => (
                  <div key={i} style={{ padding: '1.25rem', background: s.col === '#fff' ? 'rgba(255,255,255,0.03)' : `${s.col}0a`, border: `1px solid ${s.col === '#fff' ? 'rgba(255,255,255,0.1)' : s.col + '33'}`, borderRadius: '0.75rem' }}>
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem', margin: 0 }}>{s.lbl}</p>
                    <p style={{ ...S.statValue, color: s.col, marginTop: '0.4rem' }}>{s.val}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Zone Details */}
            {zones.length > 0 && (
              <div style={{ ...S.card, flex: 1, display: 'flex', flexDirection: 'column', minHeight: '300px', paddingRight: '0.75rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={S.iconBox('#ffb400')}><ShieldAlert size={20} /></div>
                  <span style={S.sectionTag()}>Outbreak Log</span>
                </div>
                <div className="custom-scroll" style={{ overflowY: 'auto', flex: 1, paddingRight: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {zones.map((zone, i) => (
                    <div key={i} onClick={() => setActiveZone(activeZone === i ? null : i)} style={{ padding: '1rem', background: activeZone === i ? 'rgba(255,255,255,0.05)' : 'transparent', border: `1px solid ${activeZone === i ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.03)'}`, borderRadius: '0.75rem', cursor: 'pointer', transition: 'all 0.2s' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <p style={{ fontSize: '0.9rem', fontWeight: 600, color: activeZone === i ? '#fff' : 'rgba(255,255,255,0.8)', margin: 0 }}>{zone.name}</p>
                          <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.2rem', margin: 0 }}>
                            {zone.source === 'upload' ? `${zone.detection_count} recent detections` : `Radius: ${zone.radius_km}km`}
                          </p>
                        </div>
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: RISK_COLOR[zone.risk_level], boxShadow: `0 0 12px ${RISK_COLOR[zone.risk_level]}80`, flexShrink: 0 }} />
                      </div>
                      
                      {/* Expanded Details */}
                      {activeZone === i && (
                        <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
                          {zone.source === 'upload' && zone.detections?.length > 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                              {zone.detections.slice(0, 3).map((d, di) => (
                                <div key={di} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#000', padding: '0.6rem 0.8rem', borderRadius: '0.5rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                  <span style={{ color: '#e5e7eb', fontWeight: 500 }}>{d.disease_name}</span>
                                  <span style={{ color: RISK_COLOR[zone.risk_level], fontWeight: 700 }}>{Math.round(d.confidence)}%</span>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p style={{ margin: 0, lineHeight: 1.5 }}>Target Crops: <span style={{ color: '#fff' }}>{zone.affected_crops?.join(', ') || 'N/A'}</span></p>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>
        </div>
      </div>
      <style>{`
        .map-grid { display: grid; grid-template-columns: 1fr 400px; gap: 2rem; align-items: start; }
        @media (max-width: 1100px) { .map-grid { grid-template-columns: 1fr; } }
        .custom-scroll::-webkit-scrollbar { width: 4px; }
        .custom-scroll::-webkit-scrollbar-track { background: transparent; }
        .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.15); border-radius: 10px; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
      `}</style>
    </div>
  );
}
