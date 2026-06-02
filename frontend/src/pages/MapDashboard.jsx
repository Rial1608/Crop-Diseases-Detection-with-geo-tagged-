import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import MapView from '../components/MapView';
import { getRiskZones, getUserZoneStatus, getMapConfig } from '../utils/api';

/* ── Risk-level helpers ───────────────────────────────────── */
const RISK_COLOR = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' };
const riskBg     = { HIGH: '#fef2f2', MEDIUM: '#fffbeb', LOW: '#f0fdf4' };
const riskBorder = { HIGH: '#fecaca', MEDIUM: '#fde68a', LOW: '#bbf7d0' };

/* Default centre: New Delhi */
const DEFAULT_CENTER = [28.6139, 77.2090];
const DEFAULT_ZOOM   = 10;

export default function MapDashboard() {
  /* Pull location from global context — no prop needed */
  const { userLocation } = useApp();

  const [zones,      setZones]      = useState([]);
  const [userStatus, setUserStatus] = useState(null);
  const [mapConfig,  setMapConfig]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeZone, setActiveZone] = useState(null);
  const [dataError,  setDataError]  = useState(false);

  useEffect(() => {
    document.title = 'Map — SmartCrop';
    loadMapData();
  }, [userLocation]);   // re-fetch when location resolves

  const loadMapData = async () => {
    setLoading(true);
    setDataError(false);
    try {
      /* Config */
      const cfgRes = await getMapConfig();
      setMapConfig(cfgRes.config || null);

      /* Zones — pass coords so backend can sort by proximity */
      const lat = userLocation?.latitude;
      const lng = userLocation?.longitude;
      const zonesRes = await getRiskZones(lat, lng);
      const fetchedZones = zonesRes.zones?.zones || [];
      setZones(fetchedZones);

      /* User status only when we have a real location */
      if (lat && lng) {
        const statusRes = await getUserZoneStatus(lat, lng);
        setUserStatus(statusRes.status || null);
      }
    } catch (err) {
      console.error('[Map] Error loading map data:', err);
      setDataError(true);
    } finally {
      setLoading(false);
    }
  };

  /* Derive map centre: prefer config → user location → default */
  const mapCenter = mapConfig?.center
    || (userLocation ? [userLocation.latitude, userLocation.longitude] : DEFAULT_CENTER);
  const mapZoom = mapConfig?.zoom || DEFAULT_ZOOM;

  /* Zone statistics */
  const highCount   = zones.filter(z => z.risk_level === 'HIGH').length;
  const mediumCount = zones.filter(z => z.risk_level === 'MEDIUM').length;
  const lowCount    = zones.filter(z => z.risk_level === 'LOW').length;

  return (
    <div className="page-bg" style={{ minHeight: 'calc(100vh - 62px)' }}>
      <div className="wrap-lg py-8">

        {/* ── PAGE HEADER ───────────────────────────────────── */}
        <div style={{ marginBottom: '1.5rem' }}>
          <p className="eyebrow" style={{ marginBottom: '0.375rem' }}>Disease Risk Map</p>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700, color: '#111827', letterSpacing: '-.025em', marginBottom: '0.375rem' }}>
            Geographic Risk Zones
          </h1>
          <p style={{ fontSize: '.875rem', color: '#6b7280' }}>
            Real-time disease outbreak zones near your location
            {userLocation && (
              <span style={{ color: '#9ca3af' }}>
                {' '}— {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </span>
            )}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: '1.25rem', alignItems: 'start' }}>

          {/* ── MAP (always rendered) ──────────────────────── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>

            {/* Map header bar */}
            <div style={{
              padding: '0.875rem 1.25rem',
              borderBottom: '1px solid #f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'white',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem' }}>
                <div className="icon-pill icon-pill-blue" style={{ width: 28, height: 28, borderRadius: 7 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                    <line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/>
                  </svg>
                </div>
                <span style={{ fontSize: '.875rem', fontWeight: 600, color: '#374151' }}>OpenStreetMap</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                {loading && (
                  <span style={{ fontSize: '.75rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                    <span style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#d1d5db',
                      animation: 'pulse 1.4s ease-in-out infinite',
                      display: 'inline-block',
                    }} />
                    Fetching zones…
                  </span>
                )}
                <span style={{ fontSize: '.75rem', color: '#9ca3af' }}>
                  {zones.length} zone{zones.length !== 1 ? 's' : ''} loaded
                </span>
              </div>
            </div>

            {/* Map container — ALWAYS renders, never blocked */}
            <div style={{ height: '520px', position: 'relative' }}>
              <MapView
                zones={zones}
                userLocation={userLocation}
                center={mapCenter}
                zoom={mapZoom}
              />

              {/* Loading shimmer overlay — sits on top of the live map */}
              {loading && (
                <div style={{
                  position: 'absolute', inset: 0, zIndex: 1000,
                  background: 'rgba(255,255,255,0.55)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{
                      width: 40, height: 40, border: '3px solid #e5e7eb',
                      borderTopColor: '#16a34a', borderRadius: '50%',
                      animation: 'spin 0.8s linear infinite',
                      margin: '0 auto 0.75rem',
                    }} />
                    <p style={{ fontSize: '.8125rem', color: '#6b7280', fontWeight: 500 }}>Loading zone data…</p>
                  </div>
                </div>
              )}

              {/* Data-error banner inside map (non-blocking) */}
              {!loading && dataError && (
                <div style={{
                  position: 'absolute', bottom: 12, left: 12, right: 12, zIndex: 1000,
                  padding: '0.625rem 1rem',
                  background: 'rgba(254,242,242,0.95)',
                  border: '1px solid #fecaca',
                  borderRadius: '0.75rem',
                  fontSize: '.8125rem', color: '#b91c1c',
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  Zone data unavailable — map still functional with your location marker.
                  <button onClick={loadMapData}
                    style={{ marginLeft: 'auto', fontSize: '.75rem', color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Retry
                  </button>
                </div>
              )}
            </div>

            {/* Legend */}
            <div style={{
              padding: '0.75rem 1.25rem',
              borderTop: '1px solid #f3f4f6',
              display: 'flex',
              gap: '1.25rem',
              flexWrap: 'wrap',
              background: '#fafafa',
            }}>
              {[['HIGH', '#dc2626'], ['MEDIUM', '#d97706'], ['LOW', '#16a34a']].map(([lvl, col]) => (
                <span key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '.75rem', color: '#6b7280' }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: col, opacity: 0.8, flexShrink: 0 }} />
                  {lvl.charAt(0) + lvl.slice(1).toLowerCase()} Risk
                </span>
              ))}
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '.75rem', color: '#6b7280', marginLeft: 'auto' }}>
                <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                Your Location
              </span>
            </div>
          </div>

          {/* ── SIDEBAR ───────────────────────────────────────── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

            {/* Your Location Status */}
            <div className="card">
              <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: '0.875rem' }}>Your Location</p>

              {userStatus?.current_zone ? (
                <div style={{
                  padding: '0.75rem',
                  background: riskBg[userStatus.current_zone.risk] || '#fef2f2',
                  border: `1px solid ${riskBorder[userStatus.current_zone.risk] || '#fecaca'}`,
                  borderRadius: '0.75rem',
                  marginBottom: '0.75rem',
                }}>
                  <p style={{ fontSize: '.7rem', color: '#6b7280', marginBottom: '0.25rem' }}>Active zone</p>
                  <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#111827' }}>{userStatus.current_zone.name}</p>
                  <p style={{ fontSize: '.8125rem', fontWeight: 600, color: RISK_COLOR[userStatus.current_zone.risk] || '#b91c1c', marginTop: '0.25rem' }}>
                    {userStatus.current_zone.risk} Risk
                  </p>
                </div>
              ) : (
                <div style={{
                  padding: '0.75rem',
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '0.75rem',
                  marginBottom: '0.75rem',
                }}>
                  <p style={{ fontSize: '.875rem', fontWeight: 600, color: '#15803d' }}>✓ Safe Zone</p>
                  <p style={{ fontSize: '.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    {userLocation ? 'No active disease zones detected near you.' : 'Enable location for accurate status.'}
                  </p>
                </div>
              )}

              {userStatus?.nearby_zones?.length > 0 && (
                <div>
                  <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: '0.5rem' }}>Nearby Zones</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {userStatus.nearby_zones.slice(0, 3).map((zone, i) => (
                      <div key={i} style={{
                        padding: '0.5rem 0.75rem',
                        background: '#f9fafb',
                        border: '1px solid #f3f4f6',
                        borderRadius: '0.625rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}>
                        <div>
                          <p style={{ fontSize: '.8125rem', fontWeight: 500, color: '#111827' }}>{zone.name}</p>
                          <p style={{ fontSize: '.7rem', color: '#9ca3af' }}>{zone.distance_km?.toFixed(1)} km away</p>
                        </div>
                        <span style={{
                          fontSize: '.7rem', fontWeight: 600,
                          color: RISK_COLOR[zone.risk] || '#6b7280',
                          background: riskBg[zone.risk] || '#f9fafb',
                          padding: '0.125rem 0.5rem',
                          borderRadius: '9999px',
                        }}>
                          {zone.risk}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!userLocation && (
                <p style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: '0.5rem', fontStyle: 'italic' }}>
                  Allow location access for personalised status
                </p>
              )}
            </div>

            {/* Zone List */}
            {zones.length > 0 && (
              <div className="card" style={{ maxHeight: '220px', overflowY: 'auto' }}>
                <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: '0.75rem' }}>
                  Risk Zones ({zones.length})
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {zones.map((zone, i) => (
                    <div key={i}
                      onClick={() => setActiveZone(activeZone === i ? null : i)}
                      style={{
                        padding: '0.625rem 0.75rem',
                        background: activeZone === i ? '#f9fafb' : 'white',
                        border: `1px solid ${activeZone === i ? '#e5e7eb' : '#f3f4f6'}`,
                        borderRadius: '0.625rem',
                        cursor: 'pointer',
                        transition: 'all 0.15s',
                      }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p style={{ fontSize: '.8125rem', fontWeight: 500, color: '#111827' }}>{zone.name}</p>
                        <span style={{ width: 10, height: 10, borderRadius: '50%', background: zone.color, flexShrink: 0 }} />
                      </div>
                      {activeZone === i && (
                        <div style={{ marginTop: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid #f3f4f6', fontSize: '.75rem', color: '#6b7280' }}>
                          <p>Radius: {zone.radius_km}km</p>
                          <p>Crops: {zone.affected_crops?.join(', ') || 'N/A'}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="card">
              <p style={{ fontSize: '.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em', color: '#9ca3af', marginBottom: '0.75rem' }}>Statistics</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                {[
                  { label: 'High Risk',   count: highCount,   bg: '#fef2f2', color: '#dc2626', border: '#fecaca' },
                  { label: 'Medium Risk', count: mediumCount, bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
                  { label: 'Low Risk',    count: lowCount,    bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0' },
                ].map(({ label, count, bg, color, border }) => (
                  <div key={label} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '0.5rem 0.75rem',
                    background: bg, border: `1px solid ${border}`,
                    borderRadius: '0.625rem',
                  }}>
                    <span style={{ fontSize: '.8125rem', color: '#374151', fontWeight: 500 }}>{label}</span>
                    <span style={{ fontSize: '.875rem', fontWeight: 700, color }}>{count}</span>
                  </div>
                ))}
                <div style={{ padding: '0.5rem 0.75rem', background: '#f9fafb', border: '1px solid #f3f4f6', borderRadius: '0.625rem', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '.8125rem', color: '#374151', fontWeight: 500 }}>Total Zones</span>
                  <span style={{ fontSize: '.875rem', fontWeight: 700, color: '#374151' }}>{zones.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyframes */}
      <style>{`
        @keyframes spin  { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100% { opacity:.4; } 50% { opacity:1; } }
      `}</style>
    </div>
  );
}
