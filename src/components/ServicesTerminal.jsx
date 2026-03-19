import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SERVICES } from '../data/services';
import SectionHeader from './shared/SectionHeader';

const BOOT_LINES = [
  '> Initializing FirstByte Services...',
  '> Loading modules...',
  '> Scanning service registry...',
  '> 6 services found.',
  '',
  'Type a number to explore:',
  '',
];

const MENU_LINES = SERVICES.map(
  (s, i) => `  [${i + 1}] ${s.icon}  ${s.title}`
);

/* Matrix rain characters */
const MATRIX_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%^&*()_+-=[]{}|;:,.<>?/~`';

function MatrixRain() {
  const columnCount = 30;
  const columns = Array.from({ length: columnCount }, (_, i) => ({
    left: `${(i / columnCount) * 100}%`,
    delay: `${Math.random() * 5}s`,
    duration: `${4 + Math.random() * 6}s`,
    chars: Array.from({ length: 20 }, () => MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)]),
    opacity: 0.08 + Math.random() * 0.12,
  }));

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {columns.map((col, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: col.left,
            top: '-100%',
            animation: `matrixFall ${col.duration} ${col.delay} linear infinite`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            opacity: col.opacity,
          }}
        >
          {col.chars.map((char, j) => (
            <span
              key={j}
              style={{
                color: '#2E9DB5',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                fontSize: '12px',
                textShadow: '0 0 6px rgba(46,157,181,0.6)',
              }}
            >
              {char}
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

/* Typing waveform indicator - 4 bars that bounce */
function TypingWaveform() {
  return (
    <span
      style={{
        display: 'inline-flex',
        gap: '2px',
        marginLeft: '6px',
        alignItems: 'flex-end',
        height: '14px',
        verticalAlign: 'middle',
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: '3px',
            background: '#2E9DB5',
            borderRadius: '1px',
            animation: `waveformBounce 0.6s ${i * 0.1}s ease-in-out infinite alternate`,
            boxShadow: '0 0 4px rgba(46,157,181,0.5)',
          }}
        />
      ))}
    </span>
  );
}

/* Boot progress bar */
function BootProgressBar({ progress }) {
  return (
    <div
      style={{
        width: '100%',
        height: '3px',
        background: 'rgba(46,157,181,0.15)',
        borderRadius: '2px',
        overflow: 'hidden',
        margin: '6px 0 10px',
      }}
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #1A6B7C, #2E9DB5)',
          borderRadius: '2px',
          transition: 'width 0.15s ease-out',
          boxShadow: '0 0 8px rgba(46,157,181,0.5)',
        }}
      />
    </div>
  );
}

export default function ServicesTerminal() {
  const [phase, setPhase] = useState('idle'); // idle, booting, menu, typing, viewing
  const [lines, setLines] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [bootProgress, setBootProgress] = useState(0);
  const [isFlickering, setIsFlickering] = useState(false);
  const sectionRef = useRef(null);
  const termBodyRef = useRef(null);
  const bootedRef = useRef(false);
  const typingRef = useRef(null);
  const isVisibleRef = useRef(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Blinking cursor */
  useEffect(() => {
    const id = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(id);
  }, []);

  /* Auto-scroll terminal to bottom */
  useEffect(() => {
    if (termBodyRef.current) {
      termBodyRef.current.scrollTop = termBodyRef.current.scrollHeight;
    }
  }, [lines]);

  /* Screen flicker on boot */
  useEffect(() => {
    if (phase === 'booting') {
      setIsFlickering(true);
      const timeout = setTimeout(() => setIsFlickering(false), 600);
      return () => clearTimeout(timeout);
    }
  }, [phase]);

  const startBoot = useCallback(() => {
    setPhase('booting');
    setLines([]);
    setBootProgress(0);
    let i = 0;
    const allLines = [...BOOT_LINES, ...MENU_LINES, ''];
    const interval = setInterval(() => {
      setLines((prev) => [...prev, allLines[i]]);
      setBootProgress(Math.round(((i + 1) / allLines.length) * 100));
      i++;
      if (i >= allLines.length) {
        clearInterval(interval);
        setPhase('menu');
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  /* IntersectionObserver: trigger boot when section enters viewport + track visibility */
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        isVisibleRef.current = entry.isIntersecting;
        if (entry.isIntersecting && !bootedRef.current) {
          bootedRef.current = true;
          startBoot();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [startBoot]);

  /* Typewriter for service details */
  const showService = useCallback((idx) => {
    if (typingRef.current) clearInterval(typingRef.current);
    setSelectedService(idx);
    setPhase('typing');

    const service = SERVICES[idx];
    const detailLines = [
      `> ${idx + 1}`,
      '',
      `╔══════════════════════════════════════╗`,
      `║  ${service.icon}  ${service.title}`,
      `╚══════════════════════════════════════╝`,
      '',
      ...service.bullets.map((b) => `  • ${b}`),
      '',
      `  "${service.tagline}"`,
      '',
      "  Type 'back' or press ESC to return",
    ];

    setLines([]);
    let lineIdx = 0;
    let charIdx = 0;

    typingRef.current = setInterval(() => {
      if (lineIdx >= detailLines.length) {
        clearInterval(typingRef.current);
        typingRef.current = null;
        setPhase('viewing');
        return;
      }

      const currentLine = detailLines[lineIdx];
      charIdx++;

      if (charIdx >= currentLine.length) {
        setLines((prev) => {
          const copy = [...prev];
          if (copy.length === 0) {
            return [currentLine, ''];
          }
          copy[copy.length - 1] = currentLine;
          return [...copy, ''];
        });
        lineIdx++;
        charIdx = 0;
      } else {
        setLines((prev) => {
          const copy = [...prev];
          if (copy.length === 0) {
            return [currentLine.slice(0, charIdx)];
          }
          copy[copy.length - 1] = currentLine.slice(0, charIdx);
          return copy;
        });
      }
    }, 18);
  }, []);

  const resetToMenu = useCallback(() => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
    setSelectedService(null);
    setPhase('menu');
    setLines([...BOOT_LINES, ...MENU_LINES, '']);
  }, []);

  /* Keyboard input — only when section is visible */
  useEffect(() => {
    const handleKey = (e) => {
      if (!isVisibleRef.current) return;
      if (phase === 'menu') {
        const num = parseInt(e.key);
        if (num >= 1 && num <= 6) {
          showService(num - 1);
        }
      } else if (phase === 'viewing' || phase === 'typing') {
        if (e.key === 'Escape') {
          resetToMenu();
        }
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, showService, resetToMenu]);

  /* Click handler for menu items */
  const handleMenuClick = useCallback(
    (idx) => {
      if (phase === 'menu') {
        showService(idx);
      }
    },
    [phase, showService]
  );

  const cursor = cursorVisible ? '█' : ' ';

  return (
    <section
      ref={sectionRef}
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
      {/* Matrix Rain Background */}
      <MatrixRain />

      {/* Section Header */}
      <SectionHeader
        label="HACKER TERMINAL"
        title="Access the Service Terminal"
        description="Type 1-6 on your keyboard or click a service to explore."
        accentColor="#2E9DB5"
      />

      {/* Terminal window with ambient glow */}
      <div
        style={{
          position: 'relative',
          width: isMobile ? 'calc(100% - 32px)' : '720px',
          maxWidth: '100%',
          margin: '0 auto 80px',
          zIndex: 2,
        }}
      >
        {/* Pulsing ambient glow behind terminal */}
        <div
          style={{
            position: 'absolute',
            inset: '-20px',
            borderRadius: '30px',
            background: 'radial-gradient(ellipse at center, rgba(46,157,181,0.12) 0%, transparent 70%)',
            animation: 'ambientGlow 3s ease-in-out infinite',
            pointerEvents: 'none',
            zIndex: -1,
          }}
        />

        <div
          className={isFlickering ? 'terminal-flicker' : ''}
          style={{
            borderRadius: '14px',
            overflow: 'hidden',
            boxShadow:
              '0 0 60px rgba(46,157,181,0.15), 0 0 120px rgba(46,157,181,0.08), 0 20px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(46,157,181,0.1)',
            border: '1px solid rgba(46,157,181,0.2)',
            position: 'relative',
          }}
        >
          {/* Title bar */}
          <div
            style={{
              background: '#1C2E44',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#FF5F57',
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#FFBD2E',
                }}
              />
              <div
                style={{
                  width: '12px',
                  height: '12px',
                  borderRadius: '50%',
                  background: '#28C840',
                }}
              />
            </div>
            <span
              style={{
                flex: 1,
                textAlign: 'center',
                color: 'rgba(255,255,255,0.5)',
                fontSize: '13px',
                fontFamily: "'SF Mono', 'Fira Code', monospace",
                marginRight: '60px',
              }}
            >
              firstbyte@services:~$
            </span>
          </div>

          {/* Terminal body with CRT effects */}
          <div
            ref={termBodyRef}
            style={{
              background: '#0D1B2A',
              padding: '20px',
              minHeight: '400px',
              maxHeight: '500px',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            {/* Scanline overlay */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                background:
                  'repeating-linear-gradient(0deg, rgba(0,0,0,0.12) 0px, rgba(0,0,0,0.12) 1px, transparent 1px, transparent 3px)',
                pointerEvents: 'none',
                zIndex: 2,
              }}
            />

            {/* RGB color fringe at edges */}
            <div
              style={{
                position: 'absolute',
                inset: 0,
                boxShadow:
                  'inset 3px 0 8px rgba(255,0,0,0.03), inset -3px 0 8px rgba(0,0,255,0.03), inset 0 3px 8px rgba(0,255,0,0.02), inset 0 -3px 8px rgba(255,0,255,0.02)',
                pointerEvents: 'none',
                zIndex: 3,
              }}
            />

            {/* Boot progress bar */}
            {phase === 'booting' && (
              <div style={{ position: 'relative', zIndex: 1, marginBottom: '4px' }}>
                <BootProgressBar progress={bootProgress} />
              </div>
            )}

            {/* Terminal content */}
            <div style={{ position: 'relative', zIndex: 1 }}>
              {lines.map((line, i) => {
                if (line == null) return null;
                /* Check if this is a clickable menu item */
                const menuMatch = line.match(/^\s+\[(\d)\]/);
                const isMenuLine = menuMatch && phase === 'menu';
                const menuIdx = menuMatch ? parseInt(menuMatch[1]) - 1 : -1;

                return (
                  <div
                    key={i}
                    onClick={isMenuLine ? () => handleMenuClick(menuIdx) : undefined}
                    style={{
                      fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
                      fontSize: isMobile ? '13px' : '14px',
                      lineHeight: '1.7',
                      color: line.startsWith('>')
                        ? '#2E9DB5'
                        : line.startsWith('╔') ||
                          line.startsWith('║') ||
                          line.startsWith('╚')
                        ? SERVICES[selectedService]?.color || '#2E9DB5'
                        : isMenuLine
                        ? '#2E9DB5'
                        : line.includes('"')
                        ? '#2E9DB5'
                        : 'rgba(46,157,181,0.85)',
                      cursor: isMenuLine ? 'pointer' : 'default',
                      transition: 'color 0.2s',
                      whiteSpace: 'pre-wrap',
                      textShadow: line.startsWith('>') ? '0 0 8px rgba(46,157,181,0.4)' : 'none',
                      ...(isMenuLine
                        ? {
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: 'rgba(46,157,181,0.04)',
                          }
                        : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (isMenuLine) e.target.style.background = 'rgba(46,157,181,0.12)';
                    }}
                    onMouseLeave={(e) => {
                      if (isMenuLine) e.target.style.background = 'rgba(46,157,181,0.04)';
                    }}
                  >
                    {line}
                  </div>
                );
              })}

              {/* Cursor line with typing waveform */}
              {(phase === 'menu' || phase === 'viewing') && (
                <div
                  style={{
                    fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
                    fontSize: isMobile ? '13px' : '14px',
                    color: '#2E9DB5',
                    lineHeight: '1.7',
                    textShadow: '0 0 8px rgba(46,157,181,0.4)',
                  }}
                >
                  {'> '}{cursor}
                </div>
              )}
              {phase === 'typing' && (
                <div
                  style={{
                    fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
                    fontSize: isMobile ? '13px' : '14px',
                    color: '#2E9DB5',
                    lineHeight: '1.7',
                    display: 'flex',
                    alignItems: 'center',
                    textShadow: '0 0 8px rgba(46,157,181,0.4)',
                  }}
                >
                  {'> '}{cursor}
                  <TypingWaveform />
                </div>
              )}
            </div>
          </div>

          {/* CRT barrel distortion + screen glow border */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '14px',
              boxShadow:
                'inset 0 0 80px rgba(46,157,181,0.04), inset 0 0 120px rgba(0,0,0,0.3)',
              pointerEvents: 'none',
              /* Subtle barrel distortion via border radius trick */
              border: '2px solid transparent',
              backgroundClip: 'padding-box',
            }}
          />

          {/* CRT vignette corners */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '14px',
              background: 'radial-gradient(ellipse at center, transparent 65%, rgba(0,0,0,0.3) 100%)',
              pointerEvents: 'none',
            }}
          />
        </div>
      </div>

      {/* Back button when viewing */}
      {(phase === 'viewing' || phase === 'typing') && (
        <button
          onClick={resetToMenu}
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
            transition: 'all 0.2s',
            position: 'relative',
            zIndex: 2,
          }}
          onMouseEnter={(e) => {
            e.target.style.opacity = '0.9';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1';
          }}
        >
          ← Back to menu (ESC)
        </button>
      )}

      <style>{`
        @keyframes matrixFall {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(calc(100vh + 100%)); }
        }
        @keyframes ambientGlow {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.02); }
        }
        @keyframes waveformBounce {
          0% { height: 3px; }
          100% { height: 12px; }
        }
        .terminal-flicker {
          animation: termFlicker 0.6s ease-out;
        }
        @keyframes termFlicker {
          0% { opacity: 0.3; }
          10% { opacity: 1; }
          20% { opacity: 0.7; }
          30% { opacity: 1; }
          40% { opacity: 0.85; }
          50% { opacity: 1; }
          60% { opacity: 0.92; }
          80% { opacity: 0.97; }
          100% { opacity: 1; }
        }
      `}</style>
    </section>
  );
}
