import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);


/* ── 3D TILT FEATURE CARD ───────────────────────────────────── */
function FeatureCard({ icon, title, desc, accentClass, delay = 0 }) {
  const cardRef = useRef(null);

  const handleMouseMove = (e) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -8;
    const rotateY = ((x - centerX) / centerX) * 8;
    card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(10px)`;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleMouseLeave = () => {
    const card = cardRef.current;
    if (!card) return;
    card.style.transform = 'perspective(1000px) rotateX(0deg) rotateY(0deg) translateZ(0px)';
  };

  return (
    <div
      ref={cardRef}
      className="feature-card anim-fade-up"
      style={{ transitionDelay: `${delay}ms` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className={`feature-icon ${accentClass}`}>{icon}</div>
      <h3 className="feature-title">{title}</h3>
      <p className="feature-desc">{desc}</p>
    </div>
  );
}

/* ── MARQUEE STATS ──────────────────────────────────────────── */
function StatsMarquee() {
  const stats = [
    { num: '92%', label: 'Detection Accuracy' },
    { num: '16', label: 'Pathogen Classes' },
    { num: '<2s', label: 'Response Time' },
    { num: '50K+', label: 'Scans Completed' },
    { num: '98%', label: 'Uptime SLA' },
    { num: '12', label: 'Crop Varieties' },
  ];
  const doubled = [...stats, ...stats]; // for seamless loop

  return (
    <div className="marquee-wrap">
      <div className="marquee-track">
        {doubled.map((s, i) => (
          <div key={i} className="marquee-item">
            <span className="marquee-num">{s.num}</span>
            <span className="marquee-label">{s.label}</span>
            {i < doubled.length - 1 && <span className="marquee-divider">·</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SCROLL PROCESS STEP ────────────────────────────────────── */
function ProcessStep({ number, title, desc, delay }) {
  return (
    <div className="anim-fade-up" style={{ transitionDelay: `${delay}ms` }}>
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '2rem',
        padding: '2rem 0',
        borderTop: '1px solid var(--border)',
        position: 'relative'
      }}>
        <span style={{
          fontFamily: 'var(--font-mono)',
          fontSize: '0.75rem',
          color: 'var(--lime)',
          letterSpacing: '0.1em',
          padding: '0.3rem 0.75rem',
          border: '1px solid rgba(200,255,0,0.3)',
          borderRadius: '100px',
          flexShrink: 0,
          marginTop: '0.25rem'
        }}>{number}</span>
        <div>
          <h3 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.6rem', letterSpacing: '-0.02em' }}>{title}</h3>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.65, fontSize: '1rem' }}>{desc}</p>
        </div>
      </div>
    </div>
  );
}

/* ── MAIN COMPONENT ─────────────────────────────────────────── */
export default function Home() {
  const { analysisHistory, weatherRisk } = useApp();
  const pageRef = useRef(null);
  const heroRef = useRef(null);
  const featuresRef = useRef(null);
  const processRef = useRef(null);

  useEffect(() => { document.title = 'Agro Radar — AI Crop Disease Intelligence'; }, []);

  /* Intersection observer for fade-up animations */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('visible');
      }),
      { threshold: 0.12, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.anim-fade-up').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);



  /* GSAP scroll animations */
  useGSAP(() => {
    // Hero title split animation
    gsap.from('.hero-title-word', {
      y: 100,
      opacity: 0,
      duration: 1.2,
      stagger: 0.1,
      ease: 'power4.out',
      delay: 0.2,
    });

    gsap.from('.hero-badge, .hero-subtitle, .hero-actions', {
      y: 40,
      opacity: 0,
      duration: 1,
      stagger: 0.12,
      ease: 'power3.out',
      delay: 0.6,
    });

    // Scroll-triggered section titles
    gsap.utils.toArray('.section-title').forEach(el => {
      gsap.from(el, {
        scrollTrigger: { trigger: el, start: 'top 85%' },
        y: 60,
        opacity: 0,
        duration: 1,
        ease: 'power4.out',
      });
    });

    // Parallax hero content
    gsap.to('.hero-content', {
      scrollTrigger: {
        trigger: heroRef.current,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
      y: 100,
      opacity: 0,
    });

    // Feature cards stagger
    gsap.from('.feature-card', {
      scrollTrigger: { trigger: featuresRef.current, start: 'top 80%' },
      y: 80,
      opacity: 0,
      duration: 0.9,
      stagger: 0.08,
      ease: 'power3.out',
    });

    // Process steps
    gsap.from('.process-step', {
      scrollTrigger: { trigger: processRef.current, start: 'top 80%' },
      x: -60,
      opacity: 0,
      duration: 0.8,
      stagger: 0.12,
      ease: 'power3.out',
    });
  }, { scope: pageRef });

  const FEATURES = [
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/><path d="M11 8v6m-3-3h6"/>
        </svg>
      ),
      title: 'Neural Diagnostics',
      desc: 'Our deep CNN model, trained on 87,000+ annotated specimens, identifies 16 pathogen classes with clinical-grade precision.',
      accentClass: 'feature-icon-lime',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
        </svg>
      ),
      title: 'Geo-Tagged Intelligence',
      desc: 'Every scan is geo-referenced. Get hyper-local disease outbreak maps and regional risk forecasts based on your exact coordinates.',
      accentClass: 'feature-icon-cyan',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
        </svg>
      ),
      title: 'Real-Time Risk Assessment',
      desc: 'Weather data fusion with disease models computes dynamic risk scores that adapt in real-time to temperature and humidity shifts.',
      accentClass: 'feature-icon-magenta',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M9 12l2 2 4-4"/><path d="M21 12c.552 0 1-.448 1-1V8a1 1 0 0 0-1-1h-4L14 3H7L5 7H1a1 1 0 0 0-1 1v3c0 .552.448 1 1 1v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2z"/>
        </svg>
      ),
      title: 'Treatment Protocols',
      desc: 'Receive scientifically-backed treatment plans, fungicide recommendations, and organic alternatives tailored to your diagnosis.',
      accentClass: 'feature-icon-amber',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
          <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
        </svg>
      ),
      title: 'Historical Analytics',
      desc: 'Track disease patterns over time. Our analytics dashboard reveals seasonal trends and helps build preventive spray schedules.',
      accentClass: 'feature-icon-cyan',
    },
    {
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>
      ),
      title: 'Secure & Private',
      desc: 'Your farm data stays yours. End-to-end encryption, no third-party sharing, and full GDPR compliance built from the ground up.',
      accentClass: 'feature-icon-lime',
    },
  ];

  const PROCESS_STEPS = [
    { number: '01', title: 'Capture the Leaf', desc: 'Photograph the affected leaf in natural light. Our system works with phone cameras, DSLR, or drone imagery — minimum 1 megapixel.' },
    { number: '02', title: 'Upload & Geolocate', desc: 'Upload your image. We automatically detect your GPS coordinates and cross-reference local weather and outbreak data.' },
    { number: '03', title: 'AI Inference', desc: 'Our convolutional neural network runs inference in under 2 seconds, producing confidence scores across 16 disease categories.' },
    { number: '04', title: 'Receive Report', desc: 'Get a detailed PDF report with diagnosis, risk map, treatment plan, and preventive measures — ready to share with your agronomist.' },
  ];

  return (
    <div ref={pageRef} className="page" style={{ background: 'var(--bg-base)', overflow: 'hidden', paddingTop: 0 }}>

      {/* ── REFERENCE-STYLE HERO ── */}
      <section ref={heroRef} className="hero" style={{ 
        height: '100vh', 
        width: '100%', 
        position: 'relative', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundImage: 'url(/bg2.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        overflow: 'hidden'
      }}>
        {/* Subtle dark overlay for text readability */}
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', zIndex: 1, pointerEvents: 'none' }} />

        {/* Subtle top gradient for navbar readability */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '20vh', background: 'linear-gradient(to bottom, rgba(0,0,0,0.6) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />
        
        {/* Bottom vignette gradient for depth */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40vh', background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)', pointerEvents: 'none', zIndex: 1 }} />

        <div className="hero-content" style={{ zIndex: 2, textAlign: 'center', maxWidth: 900, padding: '0 2rem' }}>
          <h1 className="hero-title" style={{ 
            fontFamily: 'var(--font-display)', 
            fontWeight: 900, 
            color: '#ffffff', 
            lineHeight: 0.95,
            margin: 0,
            letterSpacing: '-0.02em',
            textShadow: '0 15px 30px rgba(0,0,0,0.6), 0 5px 10px rgba(0,0,0,0.4)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center'
          }}>
            <span className="hero-title-word" style={{ fontSize: 'clamp(2rem, 5vw, 4rem)' }}>AGRO</span>
            <span className="hero-title-word" style={{ fontSize: 'clamp(3.5rem, 10vw, 8rem)' }}>RADAR</span>
          </h1>

          <p className="hero-subtitle" style={{ 
            fontSize: '1.05rem',
            lineHeight: 1.6,
            textShadow: '0 2px 4px rgba(0,0,0,0.8)', 
            color: '#ffffff', 
            fontWeight: 500, 
            margin: '1.5rem auto 3rem',
            maxWidth: '560px'
          }}>
            As an agricultural intelligence platform, we're on a mission to make it simple for everyone to protect their harvest by scanning each plant!
          </p>

          <div className="hero-actions" style={{ justifyContent: 'center' }}>
            <Link to="/upload" className="btn-primary" style={{ 
              boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              START A SCAN NOW
            </Link>
          </div>
        </div>
        
        <div className="hero-scroll-hint" style={{ zIndex: 20 }}>
          <div className="scroll-line" />
          <span>Scroll to explore</span>
        </div>
      </section>

      {/* ── STATS MARQUEE ── */}
      <StatsMarquee />

      {/* ── FEATURES ── */}
      <section className="scroll-section" ref={featuresRef}>
        <div className="section-label">Capabilities</div>
        <h2 className="section-title">
          Everything you need to<br/>
          <span style={{ color: 'var(--lime)' }}>protect your harvest.</span>
        </h2>

        <div className="features-grid">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} delay={i * 50} />
          ))}
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="scroll-section" ref={processRef} style={{ borderTop: 'none', paddingTop: '3rem', position: 'relative', overflow: 'hidden' }}>
        {/* Agriculture-themed decorative SVG background */}
        <svg style={{ position: 'absolute', right: '0', top: '50%', transform: 'translateY(-50%)', opacity: 0.06, width: '45%', pointerEvents: 'none', zIndex: 0 }} viewBox="0 0 400 400" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Wheat stalk 1 */}
          <line x1="80" y1="380" x2="80" y2="100" stroke="#39ff14" strokeWidth="3"/>
          <ellipse cx="80" cy="90" rx="12" ry="22" fill="#39ff14" transform="rotate(-20 80 90)"/>
          <ellipse cx="60" cy="140" rx="10" ry="18" fill="#39ff14" transform="rotate(-40 60 140)"/>
          <ellipse cx="100" cy="140" rx="10" ry="18" fill="#39ff14" transform="rotate(40 100 140)"/>
          <ellipse cx="68" cy="190" rx="9" ry="16" fill="#39ff14" transform="rotate(-30 68 190)"/>
          <ellipse cx="92" cy="190" rx="9" ry="16" fill="#39ff14" transform="rotate(30 92 190)"/>
          {/* Wheat stalk 2 */}
          <line x1="200" y1="380" x2="200" y2="80" stroke="#39ff14" strokeWidth="3"/>
          <ellipse cx="200" cy="68" rx="12" ry="24" fill="#39ff14"/>
          <ellipse cx="178" cy="120" rx="10" ry="18" fill="#39ff14" transform="rotate(-35 178 120)"/>
          <ellipse cx="222" cy="120" rx="10" ry="18" fill="#39ff14" transform="rotate(35 222 120)"/>
          <ellipse cx="185" cy="170" rx="9" ry="16" fill="#39ff14" transform="rotate(-25 185 170)"/>
          <ellipse cx="215" cy="170" rx="9" ry="16" fill="#39ff14" transform="rotate(25 215 170)"/>
          {/* Wheat stalk 3 */}
          <line x1="320" y1="380" x2="320" y2="110" stroke="#39ff14" strokeWidth="3"/>
          <ellipse cx="320" cy="100" rx="12" ry="22" fill="#39ff14" transform="rotate(15 320 100)"/>
          <ellipse cx="300" cy="150" rx="10" ry="18" fill="#39ff14" transform="rotate(-30 300 150)"/>
          <ellipse cx="340" cy="150" rx="10" ry="18" fill="#39ff14" transform="rotate(45 340 150)"/>
          <ellipse cx="308" cy="200" rx="9" ry="16" fill="#39ff14" transform="rotate(-20 308 200)"/>
          <ellipse cx="332" cy="200" rx="9" ry="16" fill="#39ff14" transform="rotate(30 332 200)"/>
          {/* Leaf shapes */}
          <path d="M150 280 Q180 220 230 250 Q200 310 150 280Z" fill="#39ff14"/>
          <line x1="150" y1="280" x2="210" y2="248" stroke="#000" strokeWidth="1.5" opacity="0.3"/>
          <path d="M270 320 Q250 260 310 270 Q300 330 270 320Z" fill="#39ff14"/>
          {/* DNA/scan circles */}
          <circle cx="50" cy="320" r="20" stroke="#39ff14" strokeWidth="2" strokeDasharray="4 3"/>
          <circle cx="50" cy="320" r="8" fill="#39ff14" opacity="0.4"/>
          <circle cx="360" cy="280" r="15" stroke="#39ff14" strokeWidth="2" strokeDasharray="3 3"/>
          <circle cx="360" cy="280" r="6" fill="#39ff14" opacity="0.4"/>
        </svg>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '3rem', alignItems: 'center', position: 'relative', zIndex: 1 }}>

          <div>
            <div className="section-label">Process</div>
            <h2 className="section-title">
              From field<br/>to insight,<br/>
              <span style={{ color: 'var(--lime)' }}>in seconds.</span>
            </h2>
            <p style={{ color: 'var(--text-2)', marginTop: '1.5rem', lineHeight: 1.7, maxWidth: '400px' }}>
              CropSense combines computer vision, geospatial data, and agronomy research into a seamless diagnostic pipeline accessible from any device.
            </p>

            <div style={{ marginTop: '2rem' }}>
              <Link to="/upload" className="btn-primary" style={{ boxShadow: '0 0 20px rgba(57,255,20,0.3)' }}>
                Try It Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            </div>
          </div>

          <div ref={processRef}>
            {PROCESS_STEPS.map((step, i) => (
              <ProcessStep key={i} {...step} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA STRIP ── */}
      <section style={{ padding: '4rem 2rem', textAlign: 'center', position: 'relative' }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(200,255,0,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <div className="anim-fade-up" style={{ position: 'relative', zIndex: 1 }}>
          <div className="section-label" style={{ justifyContent: 'center', marginBottom: '1.5rem' }}>Get Started</div>
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 'clamp(2.5rem, 6vw, 5rem)', fontWeight: 800, letterSpacing: '-0.04em', marginBottom: '1.5rem' }}>
            Your crops deserve<br/>
            <span style={{ color: 'var(--lime)' }}>better protection.</span>
          </h2>
          <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', marginBottom: '3rem', maxWidth: '480px', margin: '0 auto 3rem' }}>
            Join thousands of farmers using AI-powered diagnostics to prevent crop loss before it happens.
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <Link to="/upload" className="btn-primary">Start Scanning — Free</Link>
            <Link to="/map" className="btn-secondary">View Live Map</Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '2.5rem 3rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.04em' }}>
          CropSense
          <span style={{ color: 'var(--lime)' }}>.</span>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-3)', letterSpacing: '0.05em' }}>
          © 2026 CropSense AI · Agricultural Intelligence Platform
        </div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {['Privacy', 'Terms', 'API Docs'].map(l => (
            <a key={l} href="#" style={{ fontSize: '0.85rem', color: 'var(--text-2)', transition: 'color 0.2s' }}
              onMouseEnter={e => e.target.style.color = 'var(--lime)'}
              onMouseLeave={e => e.target.style.color = 'var(--text-2)'}>{l}</a>
          ))}
        </div>
      </footer>
    </div>
  );
}
