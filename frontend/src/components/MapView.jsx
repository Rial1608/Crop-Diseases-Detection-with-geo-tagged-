import React from 'react';
import { MapContainer, TileLayer, Circle, Popup, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

/* ── Fix Leaflet's broken default marker paths in bundlers ── */
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

/* ── Custom coloured SVG icon (no emoji — cross-browser safe) */
function makeRiskIcon(riskLevel) {
  const colors = { HIGH: '#dc2626', MEDIUM: '#d97706', LOW: '#16a34a' };
  const col = colors[riskLevel] || '#6b7280';
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="12" fill="${col}" fill-opacity="0.9" stroke="white" stroke-width="2.5"/>
      <circle cx="14" cy="14" r="5"  fill="white" fill-opacity="0.85"/>
    </svg>`;
  return L.divIcon({
    className:   '',   // suppress leaflet's default class
    html:        svg,
    iconSize:    [28, 28],
    iconAnchor:  [14, 14],
    popupAnchor: [0, -16],
  });
}

/* ── User location pulsing marker ──────────────────────────── */
const USER_ICON = L.divIcon({
  className: '',
  html: `
    <div style="position:relative;width:20px;height:20px">
      <div style="
        position:absolute;inset:0;
        border-radius:50%;
        background:rgba(59,130,246,0.25);
        animation:pulse-ring 1.8s ease-out infinite;
      "></div>
      <div style="
        position:absolute;inset:4px;
        border-radius:50%;
        background:#3b82f6;
        border:2.5px solid white;
        box-shadow:0 1px 6px rgba(59,130,246,0.5);
      "></div>
    </div>
    <style>
      @keyframes pulse-ring {
        0%   { transform:scale(1);   opacity:.9; }
        100% { transform:scale(2.4); opacity:0;  }
      }
    </style>`,
  iconSize:    [20, 20],
  iconAnchor:  [10, 10],
  popupAnchor: [0, -14],
});

/* ── Default fallback coords ────────────────────────────────── */
const DEFAULT_CENTER = [28.6139, 77.2090];
const DEFAULT_ZOOM   = 10;

/* ── Component ──────────────────────────────────────────────── */
function MapView({ zones = [], userLocation = null, center = null, zoom = null }) {
  const mapCenter = center
    || (userLocation ? [userLocation.latitude, userLocation.longitude] : DEFAULT_CENTER);
  const mapZoom = zoom || DEFAULT_ZOOM;

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom
    >
      {/* OSM tile layer */}
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        maxZoom={19}
      />

      {/* User location marker */}
      {userLocation && (
        <Marker
          position={[userLocation.latitude, userLocation.longitude]}
          icon={USER_ICON}
        >
          <Popup>
            <div style={{ textAlign: 'center', minWidth: 140 }}>
              <p style={{ fontWeight: 700, marginBottom: 4 }}>Your Location</p>
              <p style={{ fontSize: '.8125rem', color: '#6b7280' }}>
                {userLocation.latitude.toFixed(4)}, {userLocation.longitude.toFixed(4)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}

      {/* Risk zone circles */}
      {zones.map((zone, i) => (
        <Circle
          key={`circle-${i}`}
          center={[zone.latitude, zone.longitude]}
          radius={(zone.radius_km || 5) * 1000}
          pathOptions={{
            fillColor:   zone.color || '#ef4444',
            color:       zone.color || '#ef4444',
            weight:      2,
            opacity:     0.75,
            fillOpacity: 0.25,
          }}
        >
          <Popup>
            <div style={{ minWidth: 160 }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 4 }}>{zone.name}</p>
              <p style={{ fontSize: '.8125rem', color: zone.color || '#ef4444', fontWeight: 600, marginBottom: 6 }}>
                {zone.risk_level} Risk
              </p>
              <p style={{ fontSize: '.8125rem', color: '#6b7280' }}>Radius: {zone.radius_km} km</p>
              {zone.affected_crops?.length > 0 && (
                <p style={{ fontSize: '.8125rem', color: '#6b7280', marginTop: 4 }}>
                  <strong>Crops:</strong> {zone.affected_crops.join(', ')}
                </p>
              )}
              {zone.description && (
                <p style={{ fontSize: '.75rem', color: '#9ca3af', marginTop: 6 }}>{zone.description}</p>
              )}
            </div>
          </Popup>
        </Circle>
      ))}

      {/* Zone centre markers */}
      {zones.map((zone, i) => (
        <Marker
          key={`marker-${i}`}
          position={[zone.latitude, zone.longitude]}
          icon={makeRiskIcon(zone.risk_level)}
        />
      ))}
    </MapContainer>
  );
}

export default MapView;
