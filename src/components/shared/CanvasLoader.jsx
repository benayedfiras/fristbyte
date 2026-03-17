import React from 'react';

export default function CanvasLoader({ color = '#1D9E75' }) {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        gap: '16px',
      }}
    >
      <div
        style={{
          width: '44px',
          height: '44px',
          border: '3px solid rgba(255,255,255,0.08)',
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'loaderSpin 0.7s linear infinite',
        }}
      />
      <span
        style={{
          color: 'rgba(255,255,255,0.4)',
          fontSize: '13px',
          fontFamily: "'DM Sans', sans-serif",
          letterSpacing: '1px',
        }}
      >
        Loading...
      </span>
      <style>{`
        @keyframes loaderSpin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
