import React, { useRef, useState, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';
import PostEffects from './shared/PostEffects';
import gsap from 'gsap';
import { SERVICES } from '../data/services';

/* Per-service blob parameters */
const BLOB_CONFIGS = [
  { freq: 2.0, speed: 1.5, amplitude: 0.35 },
  { freq: 3.0, speed: 1.0, amplitude: 0.25 },
  { freq: 1.5, speed: 2.0, amplitude: 0.45 },
  { freq: 2.5, speed: 1.2, amplitude: 0.30 },
  { freq: 1.8, speed: 1.8, amplitude: 0.40 },
  { freq: 2.2, speed: 0.8, amplitude: 0.28 },
];

/* ── Morphing blob mesh ── */
function MorphBlob({ activeIndex }) {
  const meshRef = useRef();
  const geo = useMemo(() => new THREE.SphereGeometry(2, 64, 64), []);
  const origPositions = useMemo(
    () => new Float32Array(geo.attributes.position.array),
    [geo]
  );

  /* Animate morph config with refs for smooth interpolation */
  const freqRef = useRef(BLOB_CONFIGS[0].freq);
  const speedRef = useRef(BLOB_CONFIGS[0].speed);
  const ampRef = useRef(BLOB_CONFIGS[0].amplitude);

  useEffect(() => {
    const cfg = BLOB_CONFIGS[activeIndex];
    gsap.to(freqRef, { current: cfg.freq, duration: 0.8, ease: 'power2.out' });
    gsap.to(speedRef, { current: cfg.speed, duration: 0.8, ease: 'power2.out' });
    gsap.to(ampRef, { current: cfg.amplitude, duration: 0.8, ease: 'power2.out' });
  }, [activeIndex]);

  /* Color transition */
  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    const target = new THREE.Color(SERVICES[activeIndex].color);
    gsap.to(mat.color, { r: target.r, g: target.g, b: target.b, duration: 0.8 });
    gsap.to(mat.emissive, { r: target.r, g: target.g, b: target.b, duration: 0.8 });
  }, [activeIndex]);

  /* Vertex displacement */
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const positions = geo.attributes.position;
    const time = clock.getElapsedTime();
    const freq = freqRef.current;
    const speed = speedRef.current;
    const amp = ampRef.current;

    for (let i = 0; i < positions.count; i++) {
      const ox = origPositions[i * 3];
      const oy = origPositions[i * 3 + 1];
      const oz = origPositions[i * 3 + 2];

      const displacement =
        Math.sin(ox * freq + time * speed) *
        Math.cos(oy * freq + time * speed * 0.8) *
        Math.sin(oz * freq + time * speed * 0.6) *
        amp;

      const len = Math.sqrt(ox * ox + oy * oy + oz * oz);
      const scale = 1 + displacement / len;

      positions.array[i * 3] = ox * scale;
      positions.array[i * 3 + 1] = oy * scale;
      positions.array[i * 3 + 2] = oz * scale;
    }

    positions.needsUpdate = true;
    geo.computeVertexNormals();
  });

  return (
    <mesh ref={meshRef} geometry={geo}>
      <meshStandardMaterial
        color={SERVICES[0].color}
        emissive={SERVICES[0].color}
        emissiveIntensity={3}
        toneMapped={false}
        roughness={0.4}
        metalness={0.2}
        transparent
        opacity={0.85}
      />
    </mesh>
  );
}

/* ── Floating particles ── */
function BlobParticles({ activeIndex }) {
  const ref = useRef();
  const count = 200;
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = 2.5 + Math.random() * 2;
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  /* Animate particle color */
  useEffect(() => {
    if (!ref.current) return;
    const target = new THREE.Color(SERVICES[activeIndex].color);
    gsap.to(ref.current.material.color, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.8,
    });
  }, [activeIndex]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const pos = ref.current.geometry.attributes.position;
    const time = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] += Math.sin(time + i * 0.1) * 0.002;
    }
    pos.needsUpdate = true;
    ref.current.rotation.y = time * 0.05;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color={SERVICES[0].color}
        size={0.04}
        sizeAttenuation
        depthWrite={false}
        opacity={0.4}
      />
    </Points>
  );
}

/* ── Scene ── */
function MorphScene({ activeIndex }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight
        position={[-3, -2, 4]}
        intensity={0.5}
        color={SERVICES[activeIndex].color}
      />
      <fog attach="fog" args={[SERVICES[activeIndex].color, 8, 18]} />
      <MorphBlob activeIndex={activeIndex} />
      <BlobParticles activeIndex={activeIndex} />
      <Environment preset="city" />
      <PostEffects />
    </>
  );
}

/* ── Main export ── */
export default function ServicesMorphing() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userInteracted, setUserInteracted] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Auto-cycle every 4 seconds if user hasn't interacted */
  useEffect(() => {
    if (userInteracted) {
      /* Resume auto-cycle after 10s of no interaction */
      timerRef.current = setTimeout(() => {
        setUserInteracted(false);
      }, 10000);
      return () => clearTimeout(timerRef.current);
    }

    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % SERVICES.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [userInteracted]);

  const selectService = useCallback((idx) => {
    setActiveIndex(idx);
    setUserInteracted(true);
  }, []);

  const goPrev = useCallback(() => {
    setActiveIndex((prev) => (prev - 1 + SERVICES.length) % SERVICES.length);
    setUserInteracted(true);
  }, []);

  const goNext = useCallback(() => {
    setActiveIndex((prev) => (prev + 1) % SERVICES.length);
    setUserInteracted(true);
  }, []);

  const service = SERVICES[activeIndex];

  return (
    <section style={{ background: '#050A18', position: 'relative' }}>
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
            color: '#EC4899',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: '16px',
          }}
        >
          MORPHING BLOB
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
          One Shape, Many Services
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
          Watch the blob morph as it cycles through each service. Click a dot to
          jump to any service.
        </p>
      </div>

      <div
        style={{
          width: '100%',
          height: '100vh',
          position: 'relative',
          display: 'flex',
        }}
      >
        {/* Canvas */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            style={{ background: 'transparent' }}
            camera={{ position: [0, 0, 6], fov: 50 }}
          >
            <MorphScene activeIndex={activeIndex} />
          </Canvas>
        </div>

        {/* Info overlay */}
        <div
          style={{
            position: 'absolute',
            right: isMobile ? '16px' : '8%',
            top: '50%',
            transform: 'translateY(-50%)',
            maxWidth: isMobile ? 'calc(100% - 32px)' : '340px',
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            pointerEvents: 'none',
          }}
        >
          <div
            key={activeIndex}
            style={{ animation: 'morphFadeIn 0.6s ease-out' }}
          >
            <div
              style={{
                fontSize: '40px',
                marginBottom: '8px',
                filter: `drop-shadow(0 0 15px ${service.color}66)`,
              }}
            >
              {service.icon}
            </div>
            <h3
              style={{
                fontSize: isMobile ? '20px' : '24px',
                fontWeight: 700,
                fontFamily: "'Syne', sans-serif",
                color: service.color,
                marginBottom: '16px',
              }}
            >
              {service.title}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px 0' }}>
              {service.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    padding: '4px 0',
                    fontSize: '14px',
                    opacity: 0.85,
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
              }}
            >
              {service.tagline}
            </p>
          </div>
        </div>

        {/* Navigation: dots + arrows */}
        <div
          style={{
            position: 'absolute',
            bottom: '40px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            zIndex: 10,
          }}
        >
          <button onClick={goPrev} style={arrowBtnStyle}>
            ←
          </button>
          <div style={{ display: 'flex', gap: '10px' }}>
            {SERVICES.map((s, i) => (
              <button
                key={i}
                onClick={() => selectService(i)}
                style={{
                  width: i === activeIndex ? '14px' : '10px',
                  height: i === activeIndex ? '14px' : '10px',
                  borderRadius: '50%',
                  background: i === activeIndex ? s.color : 'rgba(255,255,255,0.2)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow:
                    i === activeIndex ? `0 0 12px ${s.color}88` : 'none',
                  padding: 0,
                }}
              />
            ))}
          </div>
          <button onClick={goNext} style={arrowBtnStyle}>
            →
          </button>
        </div>
      </div>

      <style>{`
        @keyframes morphFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

const arrowBtnStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '50%',
  background: 'rgba(255,255,255,0.08)',
  border: '1px solid rgba(255,255,255,0.15)',
  color: '#fff',
  fontSize: '16px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};
