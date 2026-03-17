import React, { useState, useRef, useCallback, useEffect } from 'react';
import { SERVICES } from '../data/services';

export default function ServicesCards3D() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [swipingIndex, setSwipingIndex] = useState(null);
  const [isHovering, setIsHovering] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const touchStartRef = useRef(null);
  const containerRef = useRef(null);

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
        setCurrentIndex((prev) => Math.min(prev + 1, SERVICES.length - 1));
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
          setCurrentIndex((prev) => Math.min(prev + 1, SERVICES.length - 1));
        }, 600);
      }
    },
    [isFlipped, currentIndex]
  );

  const allSwiped = currentIndex >= SERVICES.length;

  return (
    <section
      style={{
        background: '#050A18',
        minHeight: '100vh',
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          textAlign: 'center',
          padding: '80px 20px 40px',
          maxWidth: '800px',
          margin: '0 auto',
        }}
      >
        <p
          style={{
            color: '#F59E0B',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: '16px',
          }}
        >
          PHYSICAL CARD DECK
        </p>
        <h2
          style={{
            color: '#ffffff',
            fontSize: 'clamp(28px, 4vw, 48px)',
            fontWeight: 700,
            fontFamily: "'Syne', sans-serif",
            marginBottom: '16px',
            lineHeight: 1.2,
          }}
        >
          Deal Yourself the Full Stack
        </h2>
        <p
          style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 'clamp(15px, 2vw, 18px)',
            fontFamily: "'DM Sans', sans-serif",
            lineHeight: 1.6,
            maxWidth: '640px',
            margin: '0 auto',
          }}
        >
          Flip each card to explore our services. Swipe through the deck to see
          them all.
        </p>
      </div>

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
              const hoverLift =
                isHovering && !isFlipped ? 'translateY(-12px) rotateX(-2deg)' : '';
              const flipTransform = isFlipped ? 'rotateY(180deg)' : '';
              transform = `${hoverLift} ${flipTransform}`.trim() || 'none';
              transition = isFlipped
                ? 'transform 0.7s ease'
                : 'transform 0.5s ease';
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
                    background: `linear-gradient(135deg, #0D1B2A 0%, #0a1628 100%)`,
                    border: `2px solid ${service.color}44`,
                    borderLeft: `4px solid ${service.color}`,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '32px',
                    boxSizing: 'border-box',
                    boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                  }}
                >
                  <div
                    style={{
                      fontSize: isMobile ? '48px' : '56px',
                      marginBottom: '16px',
                      filter: `drop-shadow(0 0 12px ${service.color}88)`,
                    }}
                  >
                    {service.icon}
                  </div>
                  <h3
                    style={{
                      fontSize: isMobile ? '18px' : '22px',
                      fontWeight: 700,
                      color: '#ffffff',
                      fontFamily: "'Syne', sans-serif",
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
                      fontFamily: "'DM Sans', sans-serif",
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
                    background: `linear-gradient(135deg, #0D1B2A 0%, #0a1628 100%)`,
                    border: `2px solid ${service.color}66`,
                    padding: isMobile ? '24px' : '28px',
                    boxSizing: 'border-box',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                    boxShadow: `0 8px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`,
                    overflow: 'auto',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '17px',
                      fontWeight: 700,
                      color: service.color,
                      fontFamily: "'Syne', sans-serif",
                      marginBottom: '14px',
                    }}
                  >
                    {service.icon} {service.title}
                  </h3>
                  <ul
                    style={{
                      listStyle: 'none',
                      padding: 0,
                      margin: '0 0 14px 0',
                    }}
                  >
                    {service.bullets.map((b, j) => (
                      <li
                        key={j}
                        style={{
                          padding: '3px 0',
                          fontSize: '13px',
                          color: 'rgba(255,255,255,0.85)',
                          fontFamily: "'DM Sans', sans-serif",
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
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
                      fontSize: '13px',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {service.tagline}
                  </p>
                  <p
                    style={{
                      marginTop: '12px',
                      fontSize: '12px',
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    {isMobile ? 'Swipe left or tap' : 'Click'} to dismiss
                  </p>
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
              fontFamily: "'DM Sans', sans-serif",
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
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background:
                i < currentIndex
                  ? s.color
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
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.15)',
          borderRadius: '999px',
          color: '#ffffff',
          fontSize: '14px',
          fontFamily: "'DM Sans', sans-serif",
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(8px)',
        }}
        onMouseEnter={(e) => {
          e.target.style.background = 'rgba(255,255,255,0.12)';
          e.target.style.borderColor = 'rgba(255,255,255,0.3)';
        }}
        onMouseLeave={(e) => {
          e.target.style.background = 'rgba(255,255,255,0.06)';
          e.target.style.borderColor = 'rgba(255,255,255,0.15)';
        }}
      >
        ↻ Shuffle Back
      </button>
    </section>
  );
}
