import React, { useRef, useEffect, useState } from 'react';
import { SERVICES } from '../../data/services';

function MobileCard({ service, index, variant }) {
  const ref = useRef(null);
  const [expanded, setExpanded] = useState(false);
  const isLight = variant === 'light';

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(40px) scale(0.97)';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1), transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0) scale(1)';
          }, index * 80);
          observer.unobserve(el);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  const energy = Math.round(100 - (index / (SERVICES.length - 1)) * 40);

  return (
    <div
      ref={ref}
      onClick={() => setExpanded(!expanded)}
      style={{
        background: isLight
          ? 'rgba(255,255,255,0.95)'
          : 'rgba(13, 27, 42, 0.85)',
        border: `1px solid ${isLight ? `${service.color}25` : `${service.color}30`}`,
        borderRadius: '16px',
        padding: 0,
        marginBottom: '12px',
        color: isLight ? '#1a1a2e' : '#fff',
        fontFamily: "'Archivo', sans-serif",
        backdropFilter: 'blur(16px)',
        boxShadow: isLight
          ? `0 4px 20px rgba(0,0,0,0.06)`
          : `0 8px 32px rgba(0,0,0,0.3), inset 0 1px 0 ${service.color}10`,
        overflow: 'hidden',
        cursor: 'pointer',
        transition: 'box-shadow 0.3s ease, border-color 0.3s ease',
      }}
    >
      {/* Color accent top bar */}
      <div style={{
        height: '3px',
        background: `linear-gradient(90deg, ${service.color}, ${service.color}60)`,
        borderRadius: '16px 16px 0 0',
      }} />

      {/* Header */}
      <div style={{ padding: '20px 20px 16px', display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: `linear-gradient(135deg, ${service.color}20, ${service.color}08)`,
          border: `1px solid ${service.color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '22px',
          flexShrink: 0,
        }}>
          {service.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: 700,
            color: isLight ? '#1a1a2e' : '#fff',
            margin: 0,
            lineHeight: 1.3,
          }}>
            {service.title}
          </h3>
          <p style={{
            fontSize: '12px',
            color: service.color,
            margin: '4px 0 0',
            fontStyle: 'italic',
            opacity: 0.9,
          }}>
            {service.tagline}
          </p>
        </div>
        {/* Expand indicator */}
        <div style={{
          width: '28px',
          height: '28px',
          borderRadius: '50%',
          background: `${service.color}12`,
          border: `1px solid ${service.color}25`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'transform 0.3s ease',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
        }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={service.color} strokeWidth="2.5" strokeLinecap="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Expandable content */}
      <div style={{
        maxHeight: expanded ? '500px' : '0',
        overflow: 'hidden',
        transition: 'max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
      }}>
        <div style={{ padding: '0 20px 20px' }}>
          {/* Energy bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
          }}>
            <span style={{
              fontSize: '10px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
            }}>
              Capability
            </span>
            <span style={{
              fontSize: '10px',
              fontFamily: 'monospace',
              color: isLight ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.4)',
            }}>
              {energy}%
            </span>
          </div>
          <div style={{
            width: '100%',
            height: '3px',
            background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
            borderRadius: '2px',
            overflow: 'hidden',
            marginBottom: '16px',
          }}>
            <div style={{
              height: '100%',
              width: `${energy}%`,
              background: `linear-gradient(90deg, ${service.color}, ${service.color}80)`,
              borderRadius: '2px',
              transition: 'width 0.8s ease',
            }} />
          </div>

          {/* Bullet points */}
          {service.bullets.map((b, j) => (
            <div
              key={j}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '7px 0',
                borderBottom: j < service.bullets.length - 1
                  ? `1px solid ${isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)'}`
                  : 'none',
              }}
            >
              <span style={{
                display: 'inline-block',
                width: '5px',
                height: '5px',
                borderRadius: '50%',
                background: service.color,
                marginTop: '6px',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: '13px',
                lineHeight: 1.5,
                color: isLight ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.75)',
              }}>
                {b}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function MobileServiceCards({ variant = 'dark' }) {
  return (
    <div style={{ padding: '0 16px 60px' }}>
      {SERVICES.map((s, i) => (
        <MobileCard key={i} service={s} index={i} variant={variant} />
      ))}
    </div>
  );
}
