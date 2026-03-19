import React, { useRef, useEffect } from 'react';
import { SERVICES } from '../../data/services';

function MobileCard({ service, index }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, index * 100);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      style={{
        background: '#1C2E44',
        border: `2px solid #2E9DB5`,
        borderLeft: `4px solid #2E9DB5`,
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '16px',
        color: '#fff',
        fontFamily: "'Archivo', sans-serif",
        backdropFilter: 'blur(8px)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            fontSize: '28px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            background: `${service.color}15`,
          }}
        >
          {service.icon}
        </div>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: "'Archivo', sans-serif",
            color: service.color,
            margin: 0,
          }}
        >
          {service.title}
        </h3>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
        {service.bullets.map((b, j) => (
          <li
            key={j}
            style={{
              padding: '5px 0',
              fontSize: '14px',
              opacity: 0.8,
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              paddingLeft: '12px',
              position: 'relative',
            }}
          >
            <span style={{ position: 'absolute', left: 0, color: service.color }}>-</span>
            {b}
          </li>
        ))}
      </ul>
      <p
        style={{
          fontStyle: 'italic',
          color: service.color,
          fontSize: '14px',
          opacity: 0.9,
          marginTop: '8px',
        }}
      >
        {service.tagline}
      </p>
    </div>
  );
}

export default function MobileServiceCards({ variant = 'dark' }) {
  if (variant === 'light') {
    return (
      <div style={{ padding: '0 20px 60px' }}>
        {SERVICES.map((s, i) => (
          <LightMobileCard key={i} service={s} index={i} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ padding: '0 20px 60px' }}>
      {SERVICES.map((s, i) => (
        <MobileCard key={i} service={s} index={i} />
      ))}
    </div>
  );
}

function LightMobileCard({ service, index }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => {
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            el.style.opacity = '1';
            el.style.transform = 'translateY(0)';
          }, index * 100);
          observer.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [index]);

  return (
    <div
      ref={ref}
      style={{
        background: '#ffffff',
        border: `3px solid ${service.color}`,
        borderRadius: '20px',
        padding: '28px',
        marginBottom: '16px',
        color: '#222',
        fontFamily: "'Archivo', sans-serif",
        boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div
          style={{
            fontSize: '28px',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '12px',
            background: `${service.color}15`,
          }}
        >
          {service.icon}
        </div>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: 700,
            fontFamily: "'Archivo', sans-serif",
            color: service.color,
            margin: 0,
          }}
        >
          {service.title}
        </h3>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
        {service.bullets.map((b, j) => (
          <li key={j} style={{ padding: '3px 0', fontSize: '14px', color: '#555' }}>
            - {b}
          </li>
        ))}
      </ul>
      <p style={{ fontStyle: 'italic', color: service.color, fontSize: '14px', fontWeight: 600 }}>
        {service.tagline}
      </p>
    </div>
  );
}
