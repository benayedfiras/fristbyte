import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SERVICES } from '../data/services';
import SectionHeader from './shared/SectionHeader';

export default function ServicesCards3D() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipingIndex, setSwipingIndex] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const touchStartRef = useRef(null);
  const containerRef = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current || isFlipped) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 8 });
  }, [isFlipped]);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const handleCardClick = useCallback(() => {
    if (swipingIndex !== null) return;
    if (!isFlipped) {
      setIsFlipped(true);
    } else {
      /* Flip back + swipe off */
      setIsFlipped(false);
      setSwipingIndex(currentIndex);
      setTimeout(() => {
        setSwipingIndex(null);
        setCurrentIndex((prev) => prev + 1);
      }, 600);
    }
  }, [isFlipped, swipingIndex, currentIndex]);

  const handleShuffle = useCallback(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setSwipingIndex(null);
    setIsHovering(false);
  }, []);

  /* Touch swipe support */
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e) => {
      if (touchStartRef.current === null) return;
      const diff = e.changedTouches[0].clientX - touchStartRef.current;
      touchStartRef.current = null;
      if (diff < -60 && isFlipped) {
        setIsFlipped(false);
        setSwipingIndex(currentIndex);
        setTimeout(() => {
          setSwipingIndex(null);
          setCurrentIndex((prev) => prev + 1);
        }, 600);
      }
    },
    [isFlipped, currentIndex]
  );

  const allSwiped = currentIndex >= SERVICES.length;

  return (
    <section
      style={{
        background: 'linear-gradient(180deg, #0D1B2A 0%, #0A1628 50%, #0D1B2A 100%)',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      <SectionHeader
        label="CARD DECK"
        title="Deal Yourself the Full Stack"
        description="Flip to reveal. Swipe to discover. Every card holds a capability ready to deploy."
        accentColor="#8B5CF6"
      />

      {/* Card deck area */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: isMobile ? '92vw' : '480px',
          height: isMobile ? '340px' : '300px',
          margin: '40px auto 60px',
          perspective: '1200px',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {!allSwiped &&
          SERVICES.map((service, i) => {
            if (i < currentIndex && i !== swipingIndex) return null;
            const deckPos = i - currentIndex;
            const isTop = i === currentIndex;
            const isSwiping = swipingIndex === i;

            /* Position in deck */
            let transform = '';
            let transition = 'transform 0.5s ease';
            let zIndex = SERVICES.length - deckPos;
            let opacity = 1;
            let pointerEvents = 'none';

            if (isSwiping) {
              transform = 'translateX(-140%) rotateZ(-18deg)';
              transition = 'transform 0.5s ease';
              zIndex = SERVICES.length + 1;
            } else if (isTop) {
              pointerEvents = 'auto';
              const tiltX = !isFlipped ? tilt.x : 0;
              const tiltY = !isFlipped ? tilt.y : 0;
              const hoverLift =
                isHovering && !isFlipped ? `translateY(-12px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)` : '';
              const flipTransform = isFlipped ? 'rotateY(180deg)' : '';
              transform = `${hoverLift} ${flipTransform}`.trim() || 'none';
              transition = isFlipped
                ? 'transform 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)'
                : 'transform 0.4s ease';
            } else {
              transform = `translateY(${deckPos * 6}px) translateX(${deckPos * 3}px)`;
              opacity = Math.max(0.3, 1 - deckPos * 0.15);
            }

            return (
              <div
                key={i}
                onClick={isTop ? handleCardClick : undefined}
                onMouseEnter={isTop ? () => setIsHovering(true) : undefined}
                onMouseLeave={isTop ? () => setIsHovering(false) : undefined}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  transformStyle: 'preserve-3d',
                  transform,
                  transition,
                  zIndex,
                  opacity,
                  cursor: isTop ? 'pointer' : 'default',
                  pointerEvents,
                }}
              >
                {/* Front face */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    borderRadius: '20px',
                    background: `linear-gradient(135deg, #0D1B2A 0%, #0D1B2A 100%)`,
                    border: `2px solid ${service.color}44`,
                    borderLeft: `4px solid ${service.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px',
                    boxSizing: 'border-box',
                    boxShadow: isTop && isHovering && !isFlipped
                      ? `0 ${16 + tilt.x * 2}px 48px rgba(0,0,0,0.5), 0 0 40px #2E9DB522`
                      : `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    overflow: 'hidden',
                  }}
                >
                  {/* Shine sweep overlay */}
                  {isTop && !isFlipped && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: `linear-gradient(${105 + tilt.y * 10}deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)`,
                        pointerEvents: 'none',
                        borderRadius: '20px',
                        zIndex: 2,
                      }}
                    />
                  )}
                  <div
                    style={{
                      fontSize: isMobile ? '48px' : '56px',
                      marginBottom: '16px',
                      filter: `drop-shadow(0 0 12px ${service.color}88)`,
                      transition: 'transform 0.3s ease',
                      transform: isTop && isHovering && !isFlipped ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {service.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: isMobile ? '18px' : '22px',
                      fontWeight: 700,
                      color: '#ffffff',
                      fontFamily: "'Archivo', sans-serif",
                      textAlign: 'center',
                      marginBottom: '12px',
                    }}
                  >
                    {service.title}
                  </h3>
                  <div
                    style={{
                      width: '40px',
                      height: '3px',
                      background: service.color,
                      borderRadius: '2px',
                    }}
                  />
                  <p
                    style={{
                      marginTop: '16px',
                      fontSize: '13px',
                      color: 'rgba(255,255,255,0.5)',
                      fontFamily: "'Archivo', sans-serif",
                    }}
                  >
                    Click to flip
                  </p>
                </div>

                {/* Back face */}
                <div
                  style={{
                    position: 'absolute',
                    width: '100%',
                    height: '100%',
                    backfaceVisibility: 'hidden',
                    transform: 'rotateY(180deg)',
                    borderRadius: '20px',
                    background: 'rgba(8, 14, 26, 0.95)',
                    border: `1px solid ${service.color}35`,
                    padding: 0,
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px ${service.color}15`,
                    overflow: 'hidden',
                  }}
                >
                  {/* Accent bar */}
                  <div style={{ height: '3px', background: `linear-gradient(90deg, ${service.color}, ${service.color}60)`, flexShrink: 0 }} />

                  <div style={{ padding: isMobile ? '16px' : '20px', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'auto' }}>
                    <h3
                      style={{
                        fontSize: '15px',
                        fontWeight: 700,
                        color: '#ffffff',
                        fontFamily: "'Archivo', sans-serif",
                        margin: '0 0 4px 0',
                      }}
                    >
                      {service.icon} {service.title}
                    </h3>
                    <p style={{ fontStyle: 'italic', color: service.color, fontSize: '12px', fontFamily: "'Archivo', sans-serif", margin: '0 0 14px 0' }}>
                      {service.tagline}
                    </p>

                    <div style={{ flex: 1 }}>
                      {service.bullets.map((b, j) => (
                        <div
                          key={j}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '8px',
                            padding: '5px 0',
                            fontSize: '12px',
                            color: 'rgba(255,255,255,0.7)',
                            fontFamily: "'Archivo', sans-serif",
                            lineHeight: 1.4,
                            borderBottom: j < service.bullets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                          }}
                        >
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: service.color, marginTop: '5px', flexShrink: 0 }} />
                          {b}
                        </div>
                      ))}
                    </div>

                    {/* Energy bar */}
                    {(() => {
                      const energy = Math.round(100 - (i / 5) * 40);
                      return (
                        <div style={{ marginTop: '12px', paddingTop: '10px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
                            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: "'Archivo', sans-serif" }}>Capability</span>
                            <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>{energy}%</span>
                          </div>
                          <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${energy}%`, background: `linear-gradient(90deg, ${service.color}, ${service.color}80)`, borderRadius: '2px' }} />
                          </div>
                        </div>
                      );
                    })()}

                    <p style={{ marginTop: '10px', fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontFamily: "'Archivo', sans-serif", textAlign: 'center' }}>
                      {isMobile ? 'Swipe left or tap' : 'Click'} to dismiss
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

        {allSwiped && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              color: 'rgba(255,255,255,0.5)',
              fontFamily: "'Archivo', sans-serif",
              fontSize: '16px',
            }}
          >
            All cards explored!
          </div>
        )}
      </div>

      {/* Progress dots */}
      <div
        style={{
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
          marginBottom: '16px',
        }}
      >
        {SERVICES.map((s, i) => (
          <div
            key={i}
            onClick={() => {
              setCurrentIndex(i);
              setIsFlipped(false);
              setSwipingIndex(null);
            }}
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              cursor: 'pointer',
              background:
                i < currentIndex
                  ? SERVICES[i].color
                  : i === currentIndex
                  ? '#ffffff'
                  : 'rgba(255,255,255,0.2)',
              transition: 'background 0.3s ease, transform 0.3s ease',
              transform: i === currentIndex ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      {/* Shuffle button */}
      <button
        onClick={handleShuffle}
        style={{
          marginBottom: '60px',
          padding: '10px 28px',
          background: 'linear-gradient(135deg, #1a1a2e, #2E9DB5)',
          border: 'none',
          borderRadius: '100px',
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: "'Archivo', sans-serif",
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.3s ease',
        }}
        onMouseEnter={(e) => {
          e.target.style.opacity = '0.85';
        }}
        onMouseLeave={(e) => {
          e.target.style.opacity = '1';
        }}
      >
        ↻ Shuffle Back
      </button>
    </section>
  );
}
