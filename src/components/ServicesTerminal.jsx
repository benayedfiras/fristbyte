import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SERVICES } from '../data/services';

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

export default function ServicesTerminal() {
  const [phase, setPhase] = useState('idle'); // idle, booting, menu, typing, viewing
  const [lines, setLines] = useState([]);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const sectionRef = useRef(null);
  const termBodyRef = useRef(null);
  const bootedRef = useRef(false);
  const typingRef = useRef(null);
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

  const startBoot = useCallback(() => {
    setPhase('booting');
    setLines([]);
    let i = 0;
    const allLines = [...BOOT_LINES, ...MENU_LINES, ''];
    const interval = setInterval(() => {
      setLines((prev) => [...prev, allLines[i]]);
      i++;
      if (i >= allLines.length) {
        clearInterval(interval);
        setPhase('menu');
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  /* IntersectionObserver: trigger boot when section enters viewport */
  useEffect(() => {
    if (!sectionRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
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

  /* Keyboard input */
  useEffect(() => {
    const handleKey = (e) => {
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
            color: '#1D9E75',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: '16px',
          }}
        >
          HACKER TERMINAL
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
          Access the Service Terminal
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
          Type 1-6 on your keyboard or click a service to explore.
        </p>
      </div>

      {/* Terminal window */}
      <div
        style={{
          width: isMobile ? 'calc(100% - 32px)' : '720px',
          maxWidth: '100%',
          margin: '0 auto 80px',
          borderRadius: '14px',
          overflow: 'hidden',
          boxShadow:
            '0 0 60px rgba(29,158,117,0.08), 0 0 120px rgba(29,158,117,0.04), 0 20px 60px rgba(0,0,0,0.5)',
          border: '1px solid rgba(29,158,117,0.15)',
          position: 'relative',
        }}
      >
        {/* Title bar */}
        <div
          style={{
            background: '#111827',
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

        {/* Terminal body */}
        <div
          ref={termBodyRef}
          style={{
            background: '#0a0f1c',
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
                      ? '#1D9E75'
                      : line.startsWith('╔') ||
                        line.startsWith('║') ||
                        line.startsWith('╚')
                      ? SERVICES[selectedService]?.color || '#1D9E75'
                      : isMenuLine
                      ? '#1D9E75'
                      : line.includes('"')
                      ? '#F59E0B'
                      : 'rgba(29,158,117,0.85)',
                    cursor: isMenuLine ? 'pointer' : 'default',
                    transition: 'color 0.2s',
                    whiteSpace: 'pre-wrap',
                    ...(isMenuLine
                      ? {
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: 'rgba(29,158,117,0.04)',
                        }
                      : {}),
                  }}
                  onMouseEnter={(e) => {
                    if (isMenuLine) e.target.style.background = 'rgba(29,158,117,0.12)';
                  }}
                  onMouseLeave={(e) => {
                    if (isMenuLine) e.target.style.background = 'rgba(29,158,117,0.04)';
                  }}
                >
                  {line}
                </div>
              );
            })}

            {/* Cursor line */}
            {(phase === 'menu' || phase === 'viewing') && (
              <div
                style={{
                  fontFamily: "'SF Mono', 'Fira Code', 'Courier New', monospace",
                  fontSize: isMobile ? '13px' : '14px',
                  color: '#1D9E75',
                  lineHeight: '1.7',
                }}
              >
                {'> '}{cursor}
              </div>
            )}
          </div>
        </div>

        {/* CRT screen glow border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '14px',
            boxShadow:
              'inset 0 0 80px rgba(29,158,117,0.03)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Back button when viewing */}
      {(phase === 'viewing' || phase === 'typing') && (
        <button
          onClick={resetToMenu}
          style={{
            marginBottom: '60px',
            padding: '10px 28px',
            background: 'rgba(29,158,117,0.1)',
            border: '1px solid rgba(29,158,117,0.3)',
            borderRadius: '999px',
            color: '#1D9E75',
            fontSize: '14px',
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={(e) => {
            e.target.style.background = 'rgba(29,158,117,0.2)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'rgba(29,158,117,0.1)';
          }}
        >
          ← Back to menu (ESC)
        </button>
      )}
    </section>
  );
}
