import React, { useState, useEffect, useRef, useCallback } from 'react';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';
import { SERVICES } from '../data/services';

/* ── Icon mapping for each service ── */
const SERVICE_ICONS = [
  /* Branding */    (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  /* Web Dev */     (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>,
  /* Automation */  (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  /* Dashboards */  (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  /* Growth */      (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  /* Infra */       (size) => <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
];

const ACCENT = '#A78BFA';

/* ── Build orbital data from services ── */
const ORBITAL_DATA = SERVICES.map((s, i) => ({
  id: i + 1,
  title: s.title.split(' ').slice(0, 2).join(' '),
  fullTitle: s.title,
  tagline: s.tagline,
  color: s.color,
  bullets: s.bullets,
  relatedIds: i === 0 ? [SERVICES.length] : i === SERVICES.length - 1 ? [1] : [i, i + 2],
  energy: Math.round(100 - (i / (SERVICES.length - 1)) * 40),
  iconIndex: i,
}));

export default function ServicesOrbital() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section style={{
      background: 'linear-gradient(180deg, #0D1B2A 0%, #080E1A 50%, #0D1B2A 100%)',
      position: 'relative',
    }}>
      <SectionHeader
        label="RADIAL ORBITAL"
        title="Services in Orbit"
        description="Explore our interconnected services — each node is part of a larger system designed to accelerate your digital growth."
        accentColor={ACCENT}
      />
      {isMobile ? <MobileServiceCards /> : <OrbitalTimeline />}
    </section>
  );
}

/* ── Main Orbital Timeline (desktop) ── */
function OrbitalTimeline() {
  const [expandedId, setExpandedId] = useState(null);
  const [rotationAngle, setRotationAngle] = useState(0);
  const [autoRotate, setAutoRotate] = useState(true);
  const [pulsingIds, setPulsingIds] = useState({});
  const containerRef = useRef(null);
  const orbitRef = useRef(null);

  const handleContainerClick = useCallback((e) => {
    if (e.target === containerRef.current || e.target === orbitRef.current) {
      setExpandedId(null);
      setPulsingIds({});
      setAutoRotate(true);
    }
  }, []);

  const toggleItem = useCallback((id) => {
    setExpandedId((prev) => {
      if (prev === id) {
        setAutoRotate(true);
        setPulsingIds({});
        return null;
      }
      setAutoRotate(false);
      const item = ORBITAL_DATA.find((d) => d.id === id);
      if (item) {
        const pulse = {};
        item.relatedIds.forEach((rid) => { pulse[rid] = true; });
        setPulsingIds(pulse);
      }
      // Center on node
      const idx = ORBITAL_DATA.findIndex((d) => d.id === id);
      const targetAngle = (idx / ORBITAL_DATA.length) * 360;
      setRotationAngle(270 - targetAngle);
      return id;
    });
  }, []);

  /* Auto-rotation */
  useEffect(() => {
    if (!autoRotate) return;
    const timer = setInterval(() => {
      setRotationAngle((prev) => (prev + 0.25) % 360);
    }, 50);
    return () => clearInterval(timer);
  }, [autoRotate]);

  const getNodePosition = (index, total) => {
    const angle = ((index / total) * 360 + rotationAngle) % 360;
    const radius = 220;
    const radian = (angle * Math.PI) / 180;
    const x = radius * Math.cos(radian);
    const y = radius * Math.sin(radian);
    const zIndex = Math.round(100 + 50 * Math.cos(radian));
    const opacity = Math.max(0.35, Math.min(1, 0.35 + 0.65 * ((1 + Math.sin(radian)) / 2)));
    return { x, y, zIndex, opacity, radian };
  };

  return (
    <div
      ref={containerRef}
      onClick={handleContainerClick}
      style={{
        width: '100%',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        position: 'relative',
        cursor: 'default',
      }}
    >
      {/* Radial background glow */}
      <div style={{
        position: 'absolute',
        width: '600px',
        height: '600px',
        borderRadius: '50%',
        background: `radial-gradient(circle, ${ACCENT}08 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div
        ref={orbitRef}
        style={{
          position: 'relative',
          width: '500px',
          height: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {/* Center nucleus */}
        <CenterNucleus />

        {/* Orbit ring */}
        <div style={{
          position: 'absolute',
          width: '440px',
          height: '440px',
          borderRadius: '50%',
          border: '1px solid rgba(167, 139, 250, 0.1)',
          pointerEvents: 'none',
        }} />

        {/* Second ring */}
        <div style={{
          position: 'absolute',
          width: '480px',
          height: '480px',
          borderRadius: '50%',
          border: '1px solid rgba(167, 139, 250, 0.05)',
          pointerEvents: 'none',
        }} />

        {/* Connection lines to active related nodes */}
        {expandedId !== null && (
          <ConnectionLines
            activeId={expandedId}
            data={ORBITAL_DATA}
            getPosition={getNodePosition}
          />
        )}

        {/* Nodes */}
        {ORBITAL_DATA.map((item, index) => {
          const pos = getNodePosition(index, ORBITAL_DATA.length);
          const isExpanded = expandedId === item.id;
          const isRelated = pulsingIds[item.id];
          const Icon = SERVICE_ICONS[item.iconIndex];

          return (
            <OrbitalNode
              key={item.id}
              item={item}
              position={pos}
              isExpanded={isExpanded}
              isRelated={isRelated}
              Icon={Icon}
              onToggle={toggleItem}
              onNavigate={toggleItem}
              allData={ORBITAL_DATA}
            />
          );
        })}
      </div>
    </div>
  );
}

/* ── Center pulsing nucleus ── */
function CenterNucleus() {
  return (
    <div style={{
      position: 'absolute',
      width: '64px',
      height: '64px',
      borderRadius: '50%',
      background: `linear-gradient(135deg, ${ACCENT}, #6366F1, #2DD4BF)`,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10,
      animation: 'orbitalPulse 3s ease-in-out infinite',
      boxShadow: `0 0 40px ${ACCENT}40, 0 0 80px ${ACCENT}20`,
    }}>
      {/* Ping rings */}
      <div style={{
        position: 'absolute',
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        border: '1px solid rgba(167, 139, 250, 0.25)',
        animation: 'orbitalPing 2s cubic-bezier(0, 0, 0.2, 1) infinite',
      }} />
      <div style={{
        position: 'absolute',
        width: '96px',
        height: '96px',
        borderRadius: '50%',
        border: '1px solid rgba(167, 139, 250, 0.12)',
        animation: 'orbitalPing 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.5s',
      }} />
      {/* Inner core */}
      <div style={{
        width: '28px',
        height: '28px',
        borderRadius: '50%',
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(8px)',
      }} />
    </div>
  );
}

/* ── SVG Connection lines between active and related nodes ── */
function ConnectionLines({ activeId, data, getPosition }) {
  const activeItem = data.find((d) => d.id === activeId);
  if (!activeItem) return null;
  const activeIdx = data.findIndex((d) => d.id === activeId);
  const activePos = getPosition(activeIdx, data.length);

  return (
    <svg
      style={{
        position: 'absolute',
        width: '500px',
        height: '500px',
        top: 0,
        left: 0,
        pointerEvents: 'none',
        zIndex: 5,
      }}
      viewBox="0 0 500 500"
    >
      {activeItem.relatedIds.map((rid) => {
        const relIdx = data.findIndex((d) => d.id === rid);
        if (relIdx === -1) return null;
        const relPos = getPosition(relIdx, data.length);
        return (
          <line
            key={rid}
            x1={250 + activePos.x}
            y1={250 + activePos.y}
            x2={250 + relPos.x}
            y2={250 + relPos.y}
            stroke={ACCENT}
            strokeWidth="1"
            strokeOpacity="0.3"
            strokeDasharray="4 4"
          />
        );
      })}
    </svg>
  );
}

/* ── Single orbital node ── */
function OrbitalNode({ item, position, isExpanded, isRelated, Icon, onToggle, onNavigate, allData }) {
  const nodeSize = 44;

  const bgColor = isExpanded
    ? item.color
    : isRelated
    ? `${item.color}80`
    : 'rgba(13, 27, 42, 0.9)';

  const borderColor = isExpanded
    ? item.color
    : isRelated
    ? item.color
    : 'rgba(255,255,255,0.2)';

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${isExpanded ? 1.4 : 1})`,
        zIndex: isExpanded ? 200 : position.zIndex,
        opacity: isExpanded ? 1 : position.opacity,
        transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1)',
        cursor: 'pointer',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onToggle(item.id);
      }}
    >
      {/* Energy glow */}
      <div style={{
        position: 'absolute',
        width: `${item.energy * 0.5 + 44}px`,
        height: `${item.energy * 0.5 + 44}px`,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${item.color}25 0%, transparent 70%)`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        animation: isRelated ? 'orbitalPulse 1.5s ease-in-out infinite' : 'none',
        pointerEvents: 'none',
      }} />

      {/* Node circle */}
      <div style={{
        width: `${nodeSize}px`,
        height: `${nodeSize}px`,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bgColor,
        border: `2px solid ${borderColor}`,
        transition: 'all 0.3s ease',
        boxShadow: isExpanded
          ? `0 0 20px ${item.color}50, 0 0 40px ${item.color}20`
          : isRelated
          ? `0 0 12px ${item.color}30`
          : 'none',
        color: isExpanded || isRelated ? '#fff' : 'rgba(255,255,255,0.8)',
      }}>
        {Icon(16)}
      </div>

      {/* Label */}
      <div style={{
        position: 'absolute',
        top: `${nodeSize + 8}px`,
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap',
        fontSize: '11px',
        fontWeight: 600,
        fontFamily: "'Archivo', sans-serif",
        letterSpacing: '0.03em',
        color: isExpanded ? '#fff' : 'rgba(255,255,255,0.6)',
        transition: 'color 0.3s ease',
        textAlign: 'center',
      }}>
        {item.title}
      </div>

      {/* Expanded card */}
      {isExpanded && (
        <ExpandedCard item={item} allData={allData} onNavigate={onNavigate} />
      )}
    </div>
  );
}

/* ── Expanded detail card ── */
function ExpandedCard({ item, allData, onNavigate }) {
  return (
    <div style={{
      position: 'absolute',
      top: '72px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '280px',
      background: 'rgba(8, 14, 26, 0.95)',
      backdropFilter: 'blur(16px)',
      border: `1px solid ${item.color}40`,
      borderRadius: '12px',
      padding: '0',
      boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${item.color}15`,
      animation: 'orbitalFadeIn 0.3s ease-out',
      fontFamily: "'Archivo', sans-serif",
      zIndex: 300,
    }}
    onClick={(e) => e.stopPropagation()}
    >
      {/* Connector line */}
      <div style={{
        position: 'absolute',
        top: '-12px',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '1px',
        height: '12px',
        background: `${item.color}60`,
      }} />

      {/* Header */}
      <div style={{ padding: '16px 16px 12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <span style={{
            display: 'inline-block',
            padding: '2px 8px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: '#fff',
            background: item.color,
          }}>
            Active
          </span>
          <span style={{
            fontSize: '10px',
            fontFamily: 'monospace',
            color: 'rgba(255,255,255,0.4)',
          }}>
            {item.energy}% energy
          </span>
        </div>
        <h4 style={{
          margin: 0,
          fontSize: '14px',
          fontWeight: 700,
          color: '#fff',
          lineHeight: 1.3,
        }}>
          {item.fullTitle}
        </h4>
        <p style={{
          margin: '6px 0 0',
          fontSize: '12px',
          color: 'rgba(255,255,255,0.5)',
          fontStyle: 'italic',
          lineHeight: 1.4,
        }}>
          {item.tagline}
        </p>
      </div>

      {/* Bullets */}
      <div style={{ padding: '0 16px 12px' }}>
        {item.bullets.map((b, i) => (
          <div key={i} style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
            marginBottom: '6px',
            fontSize: '11px',
            color: 'rgba(255,255,255,0.7)',
            lineHeight: 1.4,
          }}>
            <span style={{
              display: 'inline-block',
              width: '4px',
              height: '4px',
              borderRadius: '50%',
              background: item.color,
              marginTop: '5px',
              flexShrink: 0,
            }} />
            {b}
          </div>
        ))}
      </div>

      {/* Energy bar */}
      <div style={{
        padding: '0 16px 12px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingTop: '12px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
            Energy Level
          </span>
          <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.5)' }}>
            {item.energy}%
          </span>
        </div>
        <div style={{
          width: '100%',
          height: '3px',
          background: 'rgba(255,255,255,0.08)',
          borderRadius: '2px',
          overflow: 'hidden',
        }}>
          <div style={{
            height: '100%',
            width: `${item.energy}%`,
            background: `linear-gradient(90deg, ${item.color}, ${ACCENT})`,
            borderRadius: '2px',
            transition: 'width 0.6s ease',
          }} />
        </div>
      </div>

      {/* Connected nodes */}
      {item.relatedIds.length > 0 && (
        <div style={{
          padding: '0 16px 16px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
          paddingTop: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginBottom: '8px',
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
          }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Connected Nodes
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
            {item.relatedIds.map((rid) => {
              const related = allData.find((d) => d.id === rid);
              if (!related) return null;
              return (
                <button
                  key={rid}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(rid);
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '3px 8px',
                    fontSize: '10px',
                    fontFamily: "'Archivo', sans-serif",
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.7)',
                    background: 'transparent',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.borderColor = `${related.color}60`;
                    e.currentTarget.style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }}
                >
                  {related.title}
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
