import React from 'react';
import useScrollReveal from '../../hooks/useScrollReveal';

export default function SectionHeader({ label, title, description, accentColor = '#2E9DB5', dark = true }) {
  const ref = useScrollReveal();

  return (
    <div
      ref={ref}
      style={{
        textAlign: 'center',
        padding: '80px 20px 48px',
        maxWidth: '800px',
        margin: '0 auto',
        position: 'relative',
        zIndex: 5,
      }}
    >
      {/* Label pill */}
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '24px',
          padding: '6px 16px',
          borderRadius: '999px',
          background: `${accentColor}10`,
          border: `1px solid ${accentColor}25`,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: accentColor,
            boxShadow: `0 0 8px ${accentColor}60`,
          }}
        />
        <span
          style={{
            color: accentColor,
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            fontFamily: "'Archivo', sans-serif",
          }}
        >
          {label}
        </span>
      </div>

      {/* Title */}
      <h2
        style={{
          color: dark ? '#ffffff' : '#1a1a2e',
          fontSize: 'clamp(28px, 4vw, 48px)',
          fontWeight: 700,
          fontFamily: "'Archivo', sans-serif",
          marginBottom: '20px',
          lineHeight: 1.1,
          letterSpacing: '-0.03em',
        }}
      >
        {title}
      </h2>

      {/* Accent line */}
      <div
        style={{
          width: '40px',
          height: '2px',
          background: `linear-gradient(90deg, ${accentColor}, ${accentColor}40)`,
          borderRadius: '2px',
          margin: '0 auto 20px',
        }}
      />

      {/* Description */}
      <p
        style={{
          color: dark ? 'rgba(255,255,255,0.55)' : '#777',
          fontSize: 'clamp(14px, 1.8vw, 17px)',
          fontFamily: "'Archivo', sans-serif",
          lineHeight: 1.7,
          maxWidth: '540px',
          margin: '0 auto',
          fontWeight: 400,
        }}
      >
        {description}
      </p>
    </div>
  );
}
