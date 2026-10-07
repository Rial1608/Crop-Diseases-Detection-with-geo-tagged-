import React, { useState, useEffect, useCallback } from 'react';
import { NavLink, Link } from 'react-router-dom';

/* ── Theme helpers ──────────────────────────────────────────── */
function applyTheme(dark) {
  document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  localStorage.setItem('cropsense-theme', dark ? 'dark' : 'light');
}

function getInitialDark() {
  try {
    const saved = localStorage.getItem('cropsense-theme');
    if (saved) return saved !== 'light';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  } catch { return true; }
}

/* ── Icons ──────────────────────────────────────────────────── */
const LogoIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a10 10 0 0 1 0 20 10 10 0 0 1 0-20"/>
    <path d="M12 6a6 6 0 0 1 0 12"/>
    <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/>
  </svg>
);

const SunIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5"/>
    <line x1="12" y1="1" x2="12" y2="3"/>
    <line x1="12" y1="21" x2="12" y2="23"/>
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
    <line x1="1" y1="12" x2="3" y2="12"/>
    <line x1="21" y1="12" x2="23" y2="12"/>
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
  </svg>
);

const MoonIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
  </svg>
);

/* ── Component ──────────────────────────────────────────────── */
export default function Navbar() {
  const [dark, setDark] = useState(getInitialDark);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => { applyTheme(dark); }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler, { passive: true });
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const toggleTheme = useCallback(() => {
    setDark(prev => {
      const next = !prev;
      applyTheme(next);
      return next;
    });
  }, []);

  return (
    <header className={`navbar${scrolled ? ' scrolled' : ''}`}>
      {/* Logo */}
      <Link to="/" className="navbar-logo">
        Agro Radar
      </Link>

      {/* Nav Links */}
      <nav className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Home</NavLink>
        <NavLink to="/dashboard" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Dashboard</NavLink>
        <NavLink to="/upload" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Analyze</NavLink>
        <NavLink to="/map" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Map</NavLink>
        <NavLink to="/results" className={({ isActive }) => `navbar-link${isActive ? ' active' : ''}`}>Results</NavLink>
      </nav>

      {/* Actions */}
      <div className="navbar-actions">
        <button className="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
          {dark ? <SunIcon /> : <MoonIcon />}
        </button>
        <Link to="/upload" className="btn-cta">Start Analysis</Link>
      </div>
    </header>
  );
}
