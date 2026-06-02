import React from 'react';

function SuspenseFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#ffffff',
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Spinner */}
        <div
          style={{
            width: 36,
            height: 36,
            border: '2.5px solid #e5e7eb',
            borderTopColor: '#16a34a',
            borderRadius: '50%',
            animation: 'spin 0.7s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p style={{ fontSize: 14, color: '#6b7280', fontWeight: 500 }}>
          Loading SmartCrop…
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

export default SuspenseFallback;
