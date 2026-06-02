import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';

/* ── Theme helpers ─────────────────────────────────────────── */
function applyTheme(dark) {
  const root = document.documentElement;
  if (dark) {
    root.classList.add('dark');
    root.setAttribute('data-theme', 'dark');
    localStorage.setItem('smartcrop-theme', 'dark');
  } else {
    root.classList.remove('dark');
    root.setAttribute('data-theme', 'light');
    localStorage.setItem('smartcrop-theme', 'light');
  }
}

function getInitialDark() {
  try {
    const saved = localStorage.getItem('smartcrop-theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch { return false; }
}

/* ── Sun icon ──────────────────────────────────────────────── */
const IcoSun = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

/* ── Moon icon ─────────────────────────────────────────────── */
const IcoMoon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/* ── Logo ──────────────────────────────────────────────────── */
const Logo = () => (
  <Link to="/" className="nav-logo">
    <span className="nav-logo-dot" />
    SmartCrop
  </Link>
);

/* ── Component ─────────────────────────────────────────────── */
function Navbar() {
  const [dark, setDark] = useState(getInitialDark);

  /* Sync to DOM on mount (in case inline script didn't run) */
  useEffect(() => { applyTheme(dark); }, []);   // eslint-disable-line

  const toggleTheme = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <header className="nav">
      <div className="nav-inner">
        <Logo />

        <nav className="nav-links">
          <NavLink to="/" end className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Home</NavLink>
          <NavLink to="/upload" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Analyze</NavLink>
          <NavLink to="/map" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Map</NavLink>
          <NavLink to="/dashboard" className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
        </nav>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {/* Dark-mode toggle */}
          <button
            id="theme-toggle"
            onClick={toggleTheme}
            aria-label={dark ? 'Switch to light mode' : 'Switch to dark mode'}
            title={dark ? 'Light mode' : 'Dark mode'}
            className="theme-toggle-btn"
          >
            <span className="theme-toggle-track">
              <span className="theme-toggle-thumb">
                {dark ? <IcoSun /> : <IcoMoon />}
              </span>
            </span>
          </button>

          <Link to="/upload" className="nav-btn">Start Analysis</Link>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
