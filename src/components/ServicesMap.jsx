import React, { useState, useEffect, useCallback, useRef } from 'react';
import { SERVICES } from '../data/services';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';

/* Building positions and sizes on the city grid — larger for visibility */
const BUILDINGS = [
  { x: 5,  y: 5,  w: 22, h: 18 },
  { x: 40, y: 3,  w: 24, h: 20 },
  { x: 72, y: 8,  w: 22, h: 18 },
  { x: 5,  y: 50, w: 24, h: 18 },
  { x: 40, y: 52, w: 22, h: 18 },
  { x: 72, y: 50, w: 22, h: 18 },
];

/* Connection lines between related buildings (index pairs) */
const CONNECTIONS = [
  [0, 1], // Branding <-> Web Dev
  [1, 2], // Web Dev <-> AI/Automation
  [1, 4], // Web Dev <-> Growth Marketing
  [2, 3], // AI/Automation <-> Dashboards
  [3, 4], // Dashboards <-> Growth Marketing
  [4, 5], // Growth Marketing <-> Infrastructure
  [0, 3], // Branding <-> Dashboards
  [2, 5], // AI/Automation <-> Infrastructure
];

/* Moving cars on streets */
const CARS = [
  { startX: -5, y: 48, speed: 18, color: '#FF5F57', dir: 1 },
  { startX: 105, y: 35, speed: 14, color: '#FFBD2E', dir: -1 },
  { startX: -5, y: 75, speed: 22, color: '#28C840', dir: 1 },
];

/* Get center point of a building in SVG coords */
function getBuildingCenter(i) {
  const b = BUILDINGS[i];
  return { x: b.x + b.w / 2, y: b.y + b.h / 2 };
}

export default function ServicesMap() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') setSelectedIndex(null);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  /* Intersection Observer for scroll-triggered entrance */
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold: 0.15 }
    );
    observer.observe(node);
    return () => observer.unobserve(node);
  }, []);

  const handleBuildingClick = useCallback((i) => {
    setSelectedIndex(i);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  return (
    <section
      ref={sectionRef}
      style={{
        background: '#050A18',
        minHeight: '100vh',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <SectionHeader
        label="CITY BLUEPRINT"
        title="Navigate the Service City"
        description="Hover to raise buildings. Click to explore."
        accentColor="#1D9E75"
      />

      {isMobile ? (
        <MobileServiceCards />
      ) : (
        <div
          style={{
            width: '100%',
            height: 'calc(100vh - 60px)',
            position: 'relative',
            overflow: 'hidden',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget && selectedIndex !== null)
              handleClose();
          }}
        >
          {/* Map container */}
          <div
            style={{
              position: 'absolute',
              inset: '3%',
              perspective: '800px',
            }}
          ><div style={{ transform: 'rotateX(3deg)', transformStyle: 'preserve-3d' }}>
            {/* Grid streets with pulse effect */}
            <svg
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
              }}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <defs>
                {/* Gradient for horizontal grid pulse */}
                <linearGradient id="gridPulseH" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#1D9E75" stopOpacity="0">
                    <animate attributeName="offset" values="-0.3;1" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="5%" stopColor="#1D9E75" stopOpacity="0.5">
                    <animate attributeName="offset" values="-0.2;1.05" dur="4s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="15%" stopColor="#1D9E75" stopOpacity="0">
                    <animate attributeName="offset" values="0;1.15" dur="4s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
                {/* Gradient for vertical grid pulse */}
                <linearGradient id="gridPulseV" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#1D9E75" stopOpacity="0">
                    <animate attributeName="offset" values="-0.3;1" dur="5s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="5%" stopColor="#1D9E75" stopOpacity="0.5">
                    <animate attributeName="offset" values="-0.2;1.05" dur="5s" repeatCount="indefinite" />
                  </stop>
                  <stop offset="15%" stopColor="#1D9E75" stopOpacity="0">
                    <animate attributeName="offset" values="0;1.15" dur="5s" repeatCount="indefinite" />
                  </stop>
                </linearGradient>
              </defs>

              {/* Horizontal streets - base */}
              {[20, 35, 48, 65, 80].map((y) => (
                <line
                  key={`h${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="#1D9E75"
                  strokeWidth="0.15"
                  opacity="0.15"
                />
              ))}
              {/* Horizontal streets - pulse overlay */}
              {[20, 35, 48, 65, 80].map((y, yi) => (
                <line
                  key={`hp${y}`}
                  x1="0"
                  y1={y}
                  x2="100"
                  y2={y}
                  stroke="url(#gridPulseH)"
                  strokeWidth="0.3"
                  opacity="0.4"
                  style={{ animationDelay: `${yi * 0.8}s` }}
                />
              ))}
              {/* Vertical streets - base */}
              {[12, 30, 48, 70, 90].map((x) => (
                <line
                  key={`v${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="#1D9E75"
                  strokeWidth="0.15"
                  opacity="0.15"
                />
              ))}
              {/* Vertical streets - pulse overlay */}
              {[12, 30, 48, 70, 90].map((x, xi) => (
                <line
                  key={`vp${x}`}
                  x1={x}
                  y1="0"
                  x2={x}
                  y2="100"
                  stroke="url(#gridPulseV)"
                  strokeWidth="0.3"
                  opacity="0.4"
                  style={{ animationDelay: `${xi * 0.6}s` }}
                />
              ))}
              {/* Grid block fills */}
              {[
                [12, 20, 18, 15],
                [30, 35, 18, 13],
                [48, 48, 22, 17],
                [70, 20, 20, 15],
                [12, 65, 18, 15],
                [48, 65, 22, 15],
              ].map(([x, y, w, h], i) => (
                <rect
                  key={`block${i}`}
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill="none"
                  stroke="#1D9E75"
                  strokeWidth="0.1"
                  opacity="0.08"
                />
              ))}

              {/* Glowing connection lines between related buildings */}
              {CONNECTIONS.map(([a, b], ci) => {
                const from = getBuildingCenter(a);
                const to = getBuildingCenter(b);
                const mx = (from.x + to.x) / 2;
                const my = (from.y + to.y) / 2 - 3;
                const colorA = SERVICES[a].color;
                const colorB = SERVICES[b].color;
                const gradId = `connGrad${ci}`;
                const isHighlighted = hoveredIndex === a || hoveredIndex === b
                  || selectedIndex === a || selectedIndex === b;
                return (
                  <g key={`conn${ci}`}>
                    <defs>
                      <linearGradient id={gradId} x1={from.x} y1={from.y} x2={to.x} y2={to.y} gradientUnits="userSpaceOnUse">
                        <stop offset="0%" stopColor={colorA} />
                        <stop offset="100%" stopColor={colorB} />
                      </linearGradient>
                    </defs>
                    {/* Glow layer */}
                    <path
                      d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                      fill="none"
                      stroke={`url(#${gradId})`}
                      strokeWidth={isHighlighted ? '0.7' : '0.3'}
                      opacity={isHighlighted ? '0.5' : '0.1'}
                      strokeLinecap="round"
                      style={{ transition: 'all 0.5s ease', filter: isHighlighted ? 'blur(1.5px)' : 'none' }}
                    />
                    {/* Crisp line layer */}
                    <path
                      d={`M ${from.x} ${from.y} Q ${mx} ${my} ${to.x} ${to.y}`}
                      fill="none"
                      stroke={`url(#${gradId})`}
                      strokeWidth={isHighlighted ? '0.35' : '0.12'}
                      opacity={isHighlighted ? '0.7' : '0.15'}
                      strokeLinecap="round"
                      strokeDasharray="1.5 2"
                      style={{ transition: 'all 0.5s ease' }}
                    >
                      <animate
                        attributeName="stroke-dashoffset"
                        values="0;-7"
                        dur={`${3 + ci * 0.4}s`}
                        repeatCount="indefinite"
                      />
                    </path>
                  </g>
                );
              })}
            </svg>

            {/* Moving cars */}
            {CARS.map((car, ci) => (
              <div
                key={ci}
                style={{
                  position: 'absolute',
                  top: `${car.y}%`,
                  left: 0,
                  width: '100%',
                  height: '4px',
                  pointerEvents: 'none',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '12px',
                    height: '4px',
                    background: car.color,
                    borderRadius: '2px',
                    boxShadow: `0 0 6px ${car.color}88`,
                    animation: `carMove${ci} ${car.speed}s linear infinite`,
                  }}
                />
              </div>
            ))}

            {/* Buildings */}
            {SERVICES.map((service, i) => {
              const b = BUILDINGS[i];
              const isHovered = hoveredIndex === i;
              const isSelected = selectedIndex === i;
              return (
                <div
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleBuildingClick(i);
                  }}
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    position: 'absolute',
                    left: `${b.x}%`,
                    top: `${b.y}%`,
                    width: `${b.w}%`,
                    height: `${b.h}%`,
                    cursor: 'pointer',
                    transition: 'all 0.5s cubic-bezier(0.4,0,0.2,1)',
                    transform: isHovered
                      ? 'translateY(-8px) scale(1.04)'
                      : 'none',
                    zIndex: isHovered || isSelected ? 10 : 2,
                    filter: isSelected ? `drop-shadow(0 0 12px ${service.color}66)` : 'none',
                    /* Stagger fade-in entrance */
                    opacity: isVisible ? 1 : 0,
                    animation: isVisible ? `buildingEntrance 0.7s cubic-bezier(0.22,1,0.36,1) ${i * 0.12}s both` : 'none',
                  }}
                >
                  {/* Hover tooltip */}
                  {isHovered && !isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-32px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        background: 'rgba(5,10,24,0.92)',
                        border: `1px solid ${service.color}88`,
                        borderRadius: '6px',
                        padding: '4px 10px',
                        color: service.color,
                        fontSize: '11px',
                        fontFamily: "'Syne', sans-serif",
                        fontWeight: 600,
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 15,
                        animation: 'tooltipFadeIn 0.22s ease-out',
                        boxShadow: `0 2px 12px ${service.color}22`,
                      }}
                    >
                      {service.title}
                      {/* Tooltip arrow */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '-5px',
                          left: '50%',
                          transform: 'translateX(-50%) rotate(45deg)',
                          width: '8px',
                          height: '8px',
                          background: 'rgba(5,10,24,0.92)',
                          borderRight: `1px solid ${service.color}88`,
                          borderBottom: `1px solid ${service.color}88`,
                        }}
                      />
                    </div>
                  )}

                  {/* Pulsing radar circle at building location */}
                  <div
                    style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      width: '120%',
                      height: '120%',
                      transform: 'translate(-50%, -50%)',
                      borderRadius: '50%',
                      border: `1px solid ${service.color}`,
                      opacity: 0,
                      animation: `radarPulse 3s ease-out ${i * 0.5}s infinite`,
                      pointerEvents: 'none',
                    }}
                  />

                  {/* Spotlight under building - enhanced on hover */}
                  <div
                    style={{
                      position: 'absolute',
                      bottom: '-30%',
                      left: '-10%',
                      width: '120%',
                      height: '60%',
                      borderRadius: '50%',
                      background: `radial-gradient(ellipse, ${service.color}${isHovered ? '33' : '0a'} 0%, transparent 70%)`,
                      pointerEvents: 'none',
                      transition: 'all 0.5s ease',
                    }}
                  />

                  {/* Building body */}
                  <div
                    style={{
                      width: '100%',
                      height: '100%',
                      border: `1.5px solid ${service.color}${isHovered ? 'cc' : '55'}`,
                      borderRadius: '4px',
                      background: `linear-gradient(180deg, ${service.color}${isHovered ? '18' : '08'} 0%, transparent 100%)`,
                      transition: 'all 0.4s ease',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      position: 'relative',
                      /* Isometric shadow */
                      boxShadow: isHovered
                        ? `4px 4px 0 ${service.color}33, 8px 8px 0 ${service.color}11, 0 0 30px ${service.color}22`
                        : `2px 2px 0 ${service.color}15, 4px 4px 0 ${service.color}08`,
                    }}
                  >
                    {/* Blinking light on top */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '4px',
                        height: '4px',
                        borderRadius: '50%',
                        background: service.color,
                        animation: `blink${i % 3} ${1.5 + i * 0.3}s ease-in-out infinite`,
                      }}
                    />

                    {/* Building windows */}
                    <div
                      style={{
                        position: 'absolute',
                        top: '15%',
                        left: '8%',
                        right: '8%',
                        bottom: '35%',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gridTemplateRows: 'repeat(2, 1fr)',
                        gap: '3px',
                        pointerEvents: 'none',
                      }}
                    >
                      {[0,1,2,3,4,5].map((wi) => (
                        <div
                          key={wi}
                          style={{
                            background: service.color,
                            borderRadius: '1px',
                            opacity: 0.15,
                            animation: `windowBlink ${2 + (wi + i) * 0.7}s ease-in-out infinite`,
                            animationDelay: `${wi * 0.4 + i * 0.3}s`,
                          }}
                        />
                      ))}
                    </div>

                    <span style={{ fontSize: 'clamp(16px, 2vw, 28px)' }}>
                      {service.icon}
                    </span>
                    <span
                      style={{
                        color: '#fff',
                        fontSize: 'clamp(7px, 0.9vw, 12px)',
                        fontFamily: "'DM Sans', sans-serif",
                        textAlign: 'center',
                        marginTop: '4px',
                        padding: '0 4px',
                        opacity: 0.9,
                      }}
                    >
                      {service.title}
                    </span>
                  </div>

                </div>
              );
            })}
          </div></div>

          {/* Fixed overlay detail panel */}
          {selectedIndex !== null && (() => {
            const svc = SERVICES[selectedIndex];
            return (
              <>
                {/* Dim overlay */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.5)',
                    zIndex: 15,
                    cursor: 'pointer',
                  }}
                  onClick={handleClose}
                />
                {/* Panel */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '360px',
                    background: 'rgba(5,10,24,0.97)',
                    border: `1px solid ${svc.color}`,
                    borderRadius: '16px',
                    padding: '28px',
                    color: '#fff',
                    fontFamily: "'DM Sans', sans-serif",
                    backdropFilter: 'blur(16px)',
                    animation: 'panelSlideUp 0.45s cubic-bezier(0.22,1,0.36,1)',
                    zIndex: 20,
                    boxShadow: `0 8px 40px rgba(0,0,0,0.5), 0 0 1px ${svc.color}44`,
                  }}
                >
                  <button
                    onClick={handleClose}
                    style={{
                      position: 'absolute',
                      top: '12px',
                      right: '16px',
                      background: `${svc.color}18`,
                      border: `1px solid ${svc.color}44`,
                      borderRadius: '8px',
                      color: '#fff',
                      fontSize: '14px',
                      cursor: 'pointer',
                      padding: '6px 14px',
                      fontFamily: "'DM Sans', sans-serif",
                      transition: 'all 0.2s ease',
                    }}
                  >
                    ✕ Close
                  </button>
                  <div style={{ fontSize: '36px', marginBottom: '8px' }}>
                    {svc.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: '18px',
                      fontWeight: 700,
                      marginBottom: '14px',
                      fontFamily: "'Syne', sans-serif",
                      color: svc.color,
                    }}
                  >
                    {svc.title}
                  </h3>
                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px 0' }}>
                    {svc.bullets.map((bul, j) => (
                      <li
                        key={j}
                        style={{
                          padding: '4px 0',
                          fontSize: '13px',
                          opacity: 0,
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          animation: `bulletFadeIn 0.3s ease-out ${0.15 + j * 0.06}s forwards`,
                        }}
                      >
                        — {bul}
                      </li>
                    ))}
                  </ul>
                  <p
                    style={{
                      fontStyle: 'italic',
                      color: svc.color,
                      fontSize: '13px',
                      opacity: 0,
                      animation: 'bulletFadeIn 0.3s ease-out 0.5s forwards',
                    }}
                  >
                    {svc.tagline}
                  </p>
                </div>
              </>
            );
          })()}
        </div>
      )}

      <style>{`
        @keyframes carMove0 { from{left:-5%} to{left:105%} }
        @keyframes carMove1 { from{left:105%} to{left:-5%} }
        @keyframes carMove2 { from{left:-5%} to{left:105%} }
        @keyframes blink0 { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes blink1 { 0%,100%{opacity:0.15} 50%{opacity:1} }
        @keyframes blink2 { 0%,100%{opacity:0.6} 30%{opacity:0.1} 70%{opacity:1} }

        @keyframes radarPulse {
          0%   { transform: translate(-50%,-50%) scale(0.8); opacity: 0.6; }
          100% { transform: translate(-50%,-50%) scale(1.8); opacity: 0; }
        }

        @keyframes windowBlink {
          0%,100% { opacity: 0.08; }
          40%     { opacity: 0.35; }
          60%     { opacity: 0.12; }
          80%     { opacity: 0.3; }
        }

        @keyframes buildingEntrance {
          0%   { opacity: 0; transform: translateY(20px) scale(0.92); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }

        @keyframes tooltipFadeIn {
          0%   { opacity: 0; transform: translateX(-50%) translateY(4px); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0); }
        }

        @keyframes panelSlideUp {
          0%   { opacity: 0; transform: translateX(-50%) translateY(24px) scale(0.95); }
          100% { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }

        @keyframes connectorGrow {
          0%   { transform: scaleY(0); opacity: 0; }
          100% { transform: scaleY(1); opacity: 1; }
        }

        @keyframes bulletFadeIn {
          0%   { opacity: 0; transform: translateX(-6px); }
          100% { opacity: 0.9; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
