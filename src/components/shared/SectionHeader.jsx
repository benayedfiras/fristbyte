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
          letterSpacing: '0.15em',
          textTransform: 'uppercase',
          fontFamily: "'Archivo', sans-serif",
          fontVariant: 'small-caps',
          marginBottom: '16px',
        }}
      >
        {label}
      </p>
      <h2
        style={{
          color: dark ? '#ffffff' : '#222222',
          fontSize: 'clamp(28px, 4vw, 48px)',
          fontWeight: 700,
          fontFamily: "'Archivo', sans-serif",
          marginBottom: '16px',
          lineHeight: 1.2,
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: dark ? 'rgba(255,255,255,0.7)' : '#666666',
          fontSize: 'clamp(15px, 2vw, 18px)',
          fontFamily: "'Archivo', sans-serif",
          lineHeight: 1.6,
          maxWidth: '640px',
          margin: '0 auto',
        }}
      >
        {description}
      </p>
    </div>
  );
}
