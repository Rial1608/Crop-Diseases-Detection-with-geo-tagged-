import React from 'react';

export default function SuspenseFallback() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-base, #030303)',
      flexDirection: 'column',
      gap: '1.5rem',
    }}>
      {/* Logo */}
      <div style={{
        fontFamily: "'Syne', sans-serif",
        fontWeight: 800,
        fontSize: '1.5rem',
        letterSpacing: '-0.04em',
        color: '#fff',
      }}>
        CropSense<span style={{ color: '#c8ff00' }}>.</span>
      </div>

      {/* Loading bar */}
      <div style={{ width: 200, height: 2, background: '#1a1a1a', borderRadius: 100, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          background: '#c8ff00',
          borderRadius: 100,
          animation: 'suspense-load 1.5s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        }} />
      </div>

      <style>{`
        @keyframes suspense-load { from { width: 0% } to { width: 100% } }
      `}</style>
    </div>
  );
}
