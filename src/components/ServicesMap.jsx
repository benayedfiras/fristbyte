import React, { useState, useEffect, useCallback } from 'react';
import { SERVICES } from '../data/services';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';

/* Building positions and sizes on the city grid */
const BUILDINGS = [
  { x: 15, y: 12, w: 14, h: 10 },
  { x: 55, y: 8,  w: 16, h: 12 },
  { x: 82, y: 18, w: 12, h: 9  },
  { x: 25, y: 55, w: 15, h: 11 },
  { x: 60, y: 52, w: 13, h: 10 },
  { x: 78, y: 60, w: 14, h: 8  },
];

/* Moving cars on streets */
const CARS = [
  { startX: -5, y: 48, speed: 18, color: '#FF5F57', dir: 1 },
  { startX: 105, y: 35, speed: 14, color: '#FFBD2E', dir: -1 },
  { startX: -5, y: 75, speed: 22, color: '#28C840', dir: 1 },
];

export default function ServicesMap() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

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

  const handleBuildingClick = useCallback((i) => {
    setSelectedIndex(i);
  }, []);

  const handleClose = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  /* Compute map transform for zoom */
  const getMapTransform = () => {
    if (selectedIndex === null) return 'scale(1) translate(0,0)';
    const b = BUILDINGS[selectedIndex];
    const cx = b.x + b.w / 2;
    const cy = b.y + b.h / 2;
    return `scale(2.2) translate(${50 - cx}%, ${50 - cy}%)`;
  };

  return (
    <section
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
        description="Hover to raise buildings. Click to zoom in and explore."
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
          {/* Overlay dim when zoomed */}
          {selectedIndex !== null && (
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.4)',
                zIndex: 3,
                cursor: 'pointer',
              }}
              onClick={handleClose}
            />
          )}

          {/* Map container with isometric perspective tilt */}
          <div
            style={{
              position: 'absolute',
              inset: '5%',
              transition: 'transform 0.8s cubic-bezier(0.4,0,0.2,1)',
              transform: getMapTransform(),
              transformOrigin: '50% 50%',
              zIndex: selectedIndex !== null ? 4 : 1,
              perspective: '800px',
            }}
          ><div style={{ transform: selectedIndex === null ? 'rotateX(5deg)' : 'rotateX(0deg)', transition: 'transform 0.8s ease', transformStyle: 'preserve-3d' }}>
            {/* Grid streets */}
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
              {/* Horizontal streets */}
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
              {/* Vertical streets */}
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
                  }}
                >
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

                  {/* Expanded detail panel when selected */}
                  {isSelected && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '110%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '280px',
                        background: 'rgba(5,10,24,0.97)',
                        border: `1px solid ${service.color}`,
                        borderRadius: '14px',
                        padding: '22px',
                        color: '#fff',
                        fontFamily: "'DM Sans', sans-serif",
                        animation: 'mapPanelIn 0.35s ease-out',
                        zIndex: 20,
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '16px',
                          fontWeight: 700,
                          fontFamily: "'Syne', sans-serif",
                          color: service.color,
                          marginBottom: '10px',
                        }}
                      >
                        {service.icon} {service.title}
                      </h3>
                      <ul
                        style={{
                          listStyle: 'none',
                          padding: 0,
                          margin: '0 0 10px 0',
                        }}
                      >
                        {service.bullets.map((b, j) => (
                          <li
                            key={j}
                            style={{
                              padding: '3px 0',
                              fontSize: '12px',
                              opacity: 0.9,
                              borderBottom:
                                '1px solid rgba(255,255,255,0.06)',
                            }}
                          >
                            — {b}
                          </li>
                        ))}
                      </ul>
                      <p
                        style={{
                          fontStyle: 'italic',
                          color: service.color,
                          fontSize: '12px',
                        }}
                      >
                        {service.tagline}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div></div>
        </div>
      )}

      <style>{`
        @keyframes carMove0 { from{left:-5%} to{left:105%} }
        @keyframes carMove1 { from{left:105%} to{left:-5%} }
        @keyframes carMove2 { from{left:-5%} to{left:105%} }
        @keyframes blink0 { 0%,100%{opacity:1} 50%{opacity:0.15} }
        @keyframes blink1 { 0%,100%{opacity:0.15} 50%{opacity:1} }
        @keyframes blink2 { 0%,100%{opacity:0.6} 30%{opacity:0.1} 70%{opacity:1} }
        @keyframes mapPanelIn {
          from { opacity:0; transform:translateX(-50%) translateY(8px); }
          to   { opacity:1; transform:translateX(-50%) translateY(0); }
        }
      `}</style>
    </section>
  );
}
