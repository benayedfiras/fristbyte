import React, { useState, useRef, useEffect, useCallback } from 'react';
import { SERVICES } from '../data/services';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';

/* ── Live clock ── */
function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <span>
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

/* ── Draggable OS Window ── */
function OSWindow({
  win,
  service,
  onClose,
  onMinimize,
  onMaximize,
  onFocus,
  sectionRef,
}) {
  const headerRef = useRef(null);
  const [pos, setPos] = useState({ x: win.x, y: win.y });
  const [isMaximized, setIsMaximized] = useState(false);
  const [closing, setClosing] = useState(false);
  const [minimizing, setMinimizing] = useState(false);
  const dragRef = useRef(null);

  const startDrag = useCallback(
    (e) => {
      if (isMaximized) return;
      e.preventDefault();
      onFocus();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      dragRef.current = {
        startX: clientX,
        startY: clientY,
        startPosX: pos.x,
        startPosY: pos.y,
      };

      const handleMove = (ev) => {
        if (!dragRef.current) return;
        const cx = ev.touches ? ev.touches[0].clientX : ev.clientX;
        const cy = ev.touches ? ev.touches[0].clientY : ev.clientY;
        setPos({
          x: dragRef.current.startPosX + (cx - dragRef.current.startX),
          y: dragRef.current.startPosY + (cy - dragRef.current.startY),
        });
      };
      const handleUp = () => {
        dragRef.current = null;
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
        window.removeEventListener('touchmove', handleMove);
        window.removeEventListener('touchend', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleUp);
    },
    [pos, onFocus, isMaximized]
  );

  const handleClose = useCallback(
    (e) => {
      e.stopPropagation();
      setClosing(true);
      setTimeout(() => onClose(win.id), 250);
    },
    [onClose, win.id]
  );

  const handleMinimize = useCallback(
    (e) => {
      e.stopPropagation();
      setMinimizing(true);
      setTimeout(() => {
        onMinimize(win.id);
        setMinimizing(false);
      }, 400);
    },
    [onMinimize, win.id]
  );

  const handleMaximize = useCallback(
    (e) => {
      e.stopPropagation();
      setIsMaximized((prev) => !prev);
      onFocus();
    },
    [onFocus]
  );

  const windowStyle = isMaximized
    ? {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: 'calc(100% - 72px)',
        borderRadius: '0',
        zIndex: win.zIndex,
      }
    : {
        position: 'absolute',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        width: '520px',
        maxWidth: 'calc(100vw - 32px)',
        height: '420px',
        borderRadius: '16px',
        zIndex: win.zIndex,
      };

  return (
    <div
      style={{
        ...windowStyle,
        overflow: 'hidden',
        boxShadow: `0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.06), 0 0 60px ${service.color}15`,
        display: 'flex',
        flexDirection: 'column',
        transition: closing
          ? 'transform 0.25s ease, opacity 0.25s ease'
          : minimizing
          ? 'transform 0.4s ease, opacity 0.4s ease'
          : isMaximized
          ? 'all 0.25s ease'
          : 'none',
        transform: closing
          ? 'scale(0.7)'
          : minimizing
          ? 'scale(0.15) translateY(60vh)'
          : 'none',
        opacity: closing || minimizing ? 0 : 1,
      }}
      onMouseDown={onFocus}
    >
      {/* Title bar */}
      <div
        ref={headerRef}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
        style={{
          background: service.color,
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          cursor: isMaximized ? 'default' : 'grab',
          userSelect: 'none',
          flexShrink: 0,
        }}
      >
        {/* Traffic lights */}
        <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
          <button
            onClick={handleClose}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#FF5F57',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Close"
          />
          <button
            onClick={handleMinimize}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#FFBD2E',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Minimize"
          />
          <button
            onClick={handleMaximize}
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#28C840',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
            title="Maximize"
          />
        </div>
        <span
          style={{
            flex: 1,
            textAlign: 'center',
            color: '#fff',
            fontSize: '14px',
            fontWeight: 600,
            fontFamily: "'Syne', sans-serif",
            marginRight: '62px',
          }}
        >
          {service.icon} {service.title}
        </span>
      </div>

      {/* Window body */}
      <div
        style={{
          flex: 1,
          background: '#0D1B2A',
          padding: '24px',
          overflowY: 'auto',
          color: '#fff',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
          {service.bullets.map((b, j) => (
            <li
              key={j}
              style={{
                padding: '6px 0',
                fontSize: '14px',
                opacity: 0.9,
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
            fontSize: '14px',
            marginTop: '16px',
          }}
        >
          {service.tagline}
        </p>
      </div>
    </div>
  );
}

/* ── Mobile fallback (stacked non-draggable) ── */
function MobileOS() {
  const [openIndices, setOpenIndices] = useState([]);

  const toggleWindow = (i) => {
    setOpenIndices((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]
    );
  };

  return (
    <div style={{ padding: '0 16px 100px' }}>
      {/* Mobile dock */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '12px',
          padding: '20px 0 32px',
          flexWrap: 'wrap',
        }}
      >
        {SERVICES.map((s, i) => (
          <button
            key={i}
            onClick={() => toggleWindow(i)}
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: s.color,
              border: openIndices.includes(i)
                ? '2px solid #fff'
                : '2px solid transparent',
              color: '#fff',
              fontSize: '22px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {s.icon}
          </button>
        ))}
      </div>

      {/* Open windows stacked */}
      {openIndices.map((idx) => {
        const s = SERVICES[idx];
        return (
          <div
            key={idx}
            style={{
              borderRadius: '16px',
              overflow: 'hidden',
              marginBottom: '16px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            <div
              style={{
                background: s.color,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <button
                onClick={() => toggleWindow(idx)}
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: '#FF5F57',
                  border: 'none',
                  cursor: 'pointer',
                  marginRight: '12px',
                  padding: 0,
                }}
              />
              <span
                style={{
                  color: '#fff',
                  fontSize: '14px',
                  fontWeight: 600,
                  fontFamily: "'Syne', sans-serif",
                }}
              >
                {s.icon} {s.title}
              </span>
            </div>
            <div
              style={{
                background: '#0D1B2A',
                padding: '20px',
                color: '#fff',
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              <ul
                style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}
              >
                {s.bullets.map((b, j) => (
                  <li
                    key={j}
                    style={{
                      padding: '4px 0',
                      fontSize: '14px',
                      opacity: 0.9,
                    }}
                  >
                    — {b}
                  </li>
                ))}
              </ul>
              <p
                style={{
                  fontStyle: 'italic',
                  color: s.color,
                  fontSize: '14px',
                }}
              >
                {s.tagline}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Desktop file icons (decorative) ── */
const DESKTOP_FILES = [
  { name: 'Client Brief.pdf', icon: '📄', x: '8%', y: '15%' },
  { name: 'Our Process.md', icon: '📝', x: '85%', y: '25%' },
  { name: 'Case Studies/', icon: '📁', x: '12%', y: '55%' },
];

/* ── Main export ── */
export default function ServicesOS() {
  const [windows, setWindows] = useState([]);
  const [nextZ, setNextZ] = useState(10);
  const [hoveredDock, setHoveredDock] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const openWindow = useCallback(
    (serviceIndex) => {
      /* If already open, just focus it */
      const existing = windows.find((w) => w.serviceIndex === serviceIndex);
      if (existing) {
        setWindows((prev) =>
          prev.map((w) =>
            w.id === existing.id
              ? { ...w, zIndex: nextZ, minimized: false }
              : w
          )
        );
        setNextZ((z) => z + 1);
        return;
      }

      const offsetX = 80 + (serviceIndex % 3) * 60;
      const offsetY = 60 + (serviceIndex % 3) * 40;

      setWindows((prev) => [
        ...prev,
        {
          id: Date.now(),
          serviceIndex,
          x: offsetX,
          y: offsetY,
          zIndex: nextZ,
          minimized: false,
        },
      ]);
      setNextZ((z) => z + 1);
    },
    [windows, nextZ]
  );

  const closeWindow = useCallback((id) => {
    setWindows((prev) => prev.filter((w) => w.id !== id));
  }, []);

  const minimizeWindow = useCallback((id) => {
    setWindows((prev) =>
      prev.map((w) => (w.id === id ? { ...w, minimized: true } : w))
    );
  }, []);

  const focusWindow = useCallback(
    (id) => {
      setWindows((prev) =>
        prev.map((w) => (w.id === id ? { ...w, zIndex: nextZ } : w))
      );
      setNextZ((z) => z + 1);
    },
    [nextZ]
  );

  const getDockIconScale = useCallback(
    (index) => {
      if (hoveredDock === null) return { scale: 1, translateY: 0 };
      const dist = Math.abs(index - hoveredDock);
      if (dist === 0) return { scale: 1.4, translateY: -16 };
      if (dist === 1) return { scale: 1.15, translateY: -5 };
      return { scale: 1, translateY: 0 };
    },
    [hoveredDock]
  );

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
        label="THE DESKTOP EXPERIENCE"
        title="Your Business Operating System"
        description="Click the dock icons to explore each service. Drag, stack, and manage windows like a real desktop."
        accentColor="#06B6D4"
      />

      {isMobile ? (
        <MobileServiceCards />
      ) : (
        /* Desktop area */
        <div
          style={{
            position: 'relative',
            width: '100%',
            minHeight: 'calc(100vh - 200px)',
            background:
              'radial-gradient(ellipse at 50% 40%, #0c1a30 0%, #050A18 60%)',
          }}
        >
          {/* Menu bar */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '32px',
              background: 'rgba(255,255,255,0.06)',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              display: 'flex',
              alignItems: 'center',
              padding: '0 16px',
              zIndex: 200,
              fontFamily: "'DM Sans', sans-serif",
              fontSize: '13px',
              color: 'rgba(255,255,255,0.7)',
              gap: '20px',
            }}
          >
            <span style={{ fontWeight: 700, color: '#06B6D4' }}>FristByte</span>
            <span>File</span>
            <span>Edit</span>
            <span>View</span>
            <span>Services</span>
            <span style={{ marginLeft: 'auto' }}>
              <Clock />
            </span>
          </div>

          {/* Dot grid background */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Animated aurora blobs */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              overflow: 'hidden',
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: '500px',
                height: '500px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)',
                top: '10%',
                left: '15%',
                animation: 'auroraFloat1 12s ease-in-out infinite',
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background:
                  'radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)',
                top: '30%',
                right: '10%',
                animation: 'auroraFloat2 15s ease-in-out infinite',
              }}
            />
          </div>

          {/* Clock top-right */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              right: '20px',
              color: 'rgba(255,255,255,0.7)',
              fontSize: '14px',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              zIndex: 2,
              background: 'rgba(255,255,255,0.05)',
              padding: '6px 14px',
              borderRadius: '8px',
              backdropFilter: 'blur(8px)',
            }}
          >
            <Clock />
          </div>

          {/* Desktop file icons */}
          {DESKTOP_FILES.map((file, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: file.x,
                top: file.y,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <span style={{ fontSize: '36px' }}>{file.icon}</span>
              <span
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '11px',
                  fontFamily: "'DM Sans', sans-serif",
                  textAlign: 'center',
                  maxWidth: '80px',
                  textShadow: '0 1px 4px rgba(0,0,0,0.8)',
                }}
              >
                {file.name}
              </span>
            </div>
          ))}

          {/* Open windows */}
          {windows
            .filter((w) => !w.minimized)
            .map((win) => (
              <OSWindow
                key={win.id}
                win={win}
                service={SERVICES[win.serviceIndex]}
                onClose={closeWindow}
                onMinimize={minimizeWindow}
                onMaximize={() => {}}
                onFocus={() => focusWindow(win.id)}
                sectionRef={sectionRef}
              />
            ))}

          {/* Dock */}
          <div
            style={{
              position: 'absolute',
              bottom: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              display: 'flex',
              alignItems: 'flex-end',
              gap: '6px',
              padding: '10px 20px 10px',
              background: 'rgba(255,255,255,0.08)',
              borderRadius: '24px',
              border: '1px solid rgba(255,255,255,0.1)',
              backdropFilter: 'blur(16px)',
              zIndex: 100,
            }}
            onMouseLeave={() => setHoveredDock(null)}
          >
            {SERVICES.map((s, i) => {
              const { scale, translateY } = getDockIconScale(i);
              const hasOpenWindow = windows.some(
                (w) => w.serviceIndex === i && !w.minimized
              );
              const hasMinimized = windows.some(
                (w) => w.serviceIndex === i && w.minimized
              );
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                  onMouseEnter={() => setHoveredDock(i)}
                >
                  {/* Name label on hover */}
                  {hoveredDock === i && (
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '70px',
                        background: 'rgba(0,0,0,0.75)',
                        color: '#fff',
                        padding: '4px 10px',
                        borderRadius: '6px',
                        fontSize: '11px',
                        fontFamily: "'DM Sans', sans-serif",
                        whiteSpace: 'nowrap',
                        pointerEvents: 'none',
                        zIndex: 200,
                      }}
                    >
                      {s.title}
                    </div>
                  )}
                  <button
                    onClick={() => openWindow(i)}
                    style={{
                      width: '56px',
                      height: '56px',
                      borderRadius: '14px',
                      background: s.color,
                      border: 'none',
                      cursor: 'pointer',
                      color: '#fff',
                      fontSize: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'transform 0.2s ease',
                      transform: `scale(${scale}) translateY(${translateY}px)`,
                      boxShadow:
                        hoveredDock === i
                          ? `0 4px 20px ${s.color}66`
                          : '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {s.icon}
                  </button>
                  {/* Minimized badge */}
                  {hasMinimized && (
                    <div
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#FFBD2E',
                        border: '2px solid rgba(0,0,0,0.3)',
                        zIndex: 201,
                      }}
                    />
                  )}
                  {/* Open indicator dot */}
                  {hasOpenWindow && (
                    <div
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: '#fff',
                        marginTop: '4px',
                      }}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <style>{`
        @keyframes auroraFloat1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(30px, -20px) scale(1.1); }
        }
        @keyframes auroraFloat2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          50% { transform: translate(-25px, 15px) scale(1.05); }
        }
      `}</style>
    </section>
  );
}
