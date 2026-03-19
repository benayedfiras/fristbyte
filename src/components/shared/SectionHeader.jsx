import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function SectionHeader({ label, title, description, accentColor = '#2E9DB5', dark = true }) {
  const ref = useScrollReveal();

  return (
    <div
      ref={ref}
      style={{
        textAlign: 'center',
        padding: '80px 20px 40px',
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <p
        style={{
          color: accentColor,
          fontSize: '12px',
          fontWeight: 600,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          fontFamily: "'Archivo', sans-serif",
          marginBottom: '20px',
          display: 'inline-flex',
          alignItems: 'center',
          gap: '12px',
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '24px',
            height: '1px',
            background: `linear-gradient(90deg, transparent, ${accentColor})`,
          }}
        />
        {label}
        <span
          style={{
            display: 'inline-block',
            width: '24px',
            height: '1px',
            background: `linear-gradient(90deg, ${accentColor}, transparent)`,
          }}
        />
      </p>
      <h2
        style={{
          color: dark ? '#ffffff' : '#1a1a2e',
          fontSize: 'clamp(28px, 4vw, 48px)',
          fontWeight: 700,
          fontFamily: "'Archivo', sans-serif",
          marginBottom: '16px',
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        }}
      >
        {title}
      </h2>
      {/* Accent line */}
      <div
        style={{
          width: '48px',
          height: '3px',
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
          borderRadius: '2px',
          margin: '0 auto 20px',
        }}
      />
      <p
        style={{
          color: dark ? 'rgba(255,255,255,0.6)' : '#666666',
          fontSize: 'clamp(15px, 2vw, 18px)',
          fontFamily: "'Archivo', sans-serif",
          lineHeight: 1.6,
          maxWidth: '600px',
          margin: '0 auto',
        }}
      >
        {description}
      </p>
    </div>
  );
}
