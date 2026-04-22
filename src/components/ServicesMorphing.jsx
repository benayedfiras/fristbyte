import React, { useRef, useState, useMemo, useEffect, useCallback, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Points, PointMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';
import PostEffects from './shared/PostEffects';
import SectionHeader from './shared/SectionHeader';
import CanvasLoader from './shared/CanvasLoader';
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

/* ── Morphing blob mesh with mouse-follow distortion ── */
function MorphBlob({ activeIndex, mouseRef }) {
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

  /* Vertex displacement with mouse-follow distortion */
  useFrame(({ clock }) => {
    if (!meshRef.current) return;
    const positions = geo.attributes.position;
    const time = clock.getElapsedTime();
    const freq = freqRef.current;
    const speed = speedRef.current;
    const amp = ampRef.current;

    /* Get mouse influence direction */
    const mx = mouseRef.current.x;
    const my = mouseRef.current.y;
    const mouseStrength = 0.15;

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
      const nx = ox / len;
      const ny = oy / len;

      /* Mouse-follow: pull vertices toward mouse direction */
      const mouseDot = nx * mx + ny * my;
      const mouseDisplacement = mouseDot * mouseStrength;

      const scale = 1 + (displacement + mouseDisplacement) / len;

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

/* ── Rim light shell (Fresnel approximation) ── */
function RimLightShell({ activeIndex }) {
  const meshRef = useRef();
  const colorRef = useRef(new THREE.Color(SERVICES[0].color));

  useEffect(() => {
    const target = new THREE.Color(SERVICES[activeIndex].color);
    gsap.to(colorRef.current, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.8,
      onUpdate: () => {
        if (meshRef.current) {
          meshRef.current.material.color.copy(colorRef.current);
        }
      },
    });
  }, [activeIndex]);

  return (
    <mesh ref={meshRef} scale={[2.15, 2.15, 2.15]}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshBasicMaterial
        color={SERVICES[0].color}
        transparent
        opacity={0.06}
        side={THREE.BackSide}
      />
    </mesh>
  );
}

/* ── Orbital particles in organized rings ── */
function OrbitalParticles({ activeIndex }) {
  const groupRef = useRef();
  const ring1Ref = useRef();
  const ring2Ref = useRef();
  const ring3Ref = useRef();

  const rings = useMemo(() => {
    const createRing = (count, radius) => {
      const arr = new Float32Array(count * 3);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        arr[i * 3] = radius * Math.cos(angle);
        arr[i * 3 + 1] = (Math.random() - 0.5) * 0.2;
        arr[i * 3 + 2] = radius * Math.sin(angle);
      }
      return arr;
    };
    return {
      ring1: createRing(80, 3.0),
      ring2: createRing(60, 3.8),
      ring3: createRing(50, 4.5),
    };
  }, []);

  /* Animate particle colors */
  const matRef1 = useRef();
  const matRef2 = useRef();
  const matRef3 = useRef();

  useEffect(() => {
    const target = new THREE.Color(SERVICES[activeIndex].color);
    [matRef1, matRef2, matRef3].forEach((ref) => {
      if (ref.current) {
        gsap.to(ref.current.color, {
          r: target.r,
          g: target.g,
          b: target.b,
          duration: 0.8,
        });
      }
    });
  }, [activeIndex]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y = t * 0.15;
      ring1Ref.current.rotation.x = 0.3;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y = -t * 0.1;
      ring2Ref.current.rotation.z = 0.5;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y = t * 0.08;
      ring3Ref.current.rotation.x = -0.4;
      ring3Ref.current.rotation.z = 0.2;
    }
  });

  return (
    <group ref={groupRef}>
      <Points ref={ring1Ref} positions={rings.ring1} stride={3} frustumCulled={false}>
        <PointMaterial
          ref={matRef1}
          transparent
          color={SERVICES[0].color}
          size={0.05}
          sizeAttenuation
          depthWrite={false}
          opacity={0.5}
        />
      </Points>
      <Points ref={ring2Ref} positions={rings.ring2} stride={3} frustumCulled={false}>
        <PointMaterial
          ref={matRef2}
          transparent
          color={SERVICES[0].color}
          size={0.04}
          sizeAttenuation
          depthWrite={false}
          opacity={0.35}
        />
      </Points>
      <Points ref={ring3Ref} positions={rings.ring3} stride={3} frustumCulled={false}>
        <PointMaterial
          ref={matRef3}
          transparent
          color={SERVICES[0].color}
          size={0.03}
          sizeAttenuation
          depthWrite={false}
          opacity={0.25}
        />
      </Points>
    </group>
  );
}

/* ── Rim PointLight behind blob ── */
function RimLight({ activeIndex }) {
  const lightRef = useRef();
  const colorRef = useRef(new THREE.Color(SERVICES[0].color));

  useEffect(() => {
    const target = new THREE.Color(SERVICES[activeIndex].color);
    gsap.to(colorRef.current, {
      r: target.r,
      g: target.g,
      b: target.b,
      duration: 0.8,
      onUpdate: () => {
        if (lightRef.current) {
          lightRef.current.color.copy(colorRef.current);
        }
      },
    });
  }, [activeIndex]);

  return <pointLight ref={lightRef} position={[0, 0, -4]} intensity={2} color={SERVICES[0].color} />;
}

/* ── Scene ── */
function MorphScene({ activeIndex, mouseRef }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[5, 5, 5]} intensity={1} />
      <pointLight
        position={[-3, -2, 4]}
        intensity={0.5}
        color={SERVICES[activeIndex].color}
      />
      <RimLight activeIndex={activeIndex} />
      <fog attach="fog" args={[SERVICES[activeIndex].color, 8, 18]} />
      <MorphBlob activeIndex={activeIndex} mouseRef={mouseRef} />
      <RimLightShell activeIndex={activeIndex} />
      <OrbitalParticles activeIndex={activeIndex} />
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
  const [bgColor, setBgColor] = useState(SERVICES[0].color);
  const timerRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Update background gradient color on service change */
  useEffect(() => {
    setBgColor(SERVICES[activeIndex].color);
  }, [activeIndex]);

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

  /* Mouse tracking for blob distortion */
  const handlePointerMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseRef.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouseRef.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }, []);

  const service = SERVICES[activeIndex];

  return (
    <section style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #0A1628 50%, #0D1B2A 100%)', position: 'relative' }}>
      {/* Section Header */}
      <SectionHeader
        label="MORPHING SHAPE"
        title="One Form, Many Functions"
        description="Watch it morph through each capability. Click any dot to jump. Move your cursor to distort."
        accentColor="#F43F5E"
      />

      <div
        ref={containerRef}
        onPointerMove={handlePointerMove}
        style={{
          width: '100%',
          height: '100vh',
          position: 'relative',
          display: 'flex',
          /* Background gradient that shifts with service color */
          background: `radial-gradient(ellipse at 40% 50%, ${bgColor}12 0%, transparent 60%)`,
          transition: 'background 1.2s ease',
        }}
      >
        {/* Canvas with Suspense + CanvasLoader */}
        <div style={{ flex: 1, position: 'relative' }}>
          <Suspense fallback={<CanvasLoader />}>
            <Canvas
              shadows
              dpr={[1, 2]}
              gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
              style={{ background: 'transparent' }}
              camera={{ position: [0, 0, 6], fov: 50 }}
            >
              <MorphScene activeIndex={activeIndex} mouseRef={mouseRef} />
            </Canvas>
          </Suspense>
        </div>

        {/* Info overlay with staggered bullet animation */}
        <div
          style={{
            position: 'absolute',
            right: isMobile ? '16px' : '8%',
            top: '50%',
            transform: 'translateY(-50%)',
            maxWidth: isMobile ? 'calc(100% - 32px)' : '340px',
            color: '#fff',
            fontFamily: "'Archivo', sans-serif",
            pointerEvents: 'none',
          }}
        >
          <div
            key={activeIndex}
            style={{
              animation: 'morphFadeIn 0.6s ease-out',
              background: 'rgba(8, 14, 26, 0.75)',
              backdropFilter: 'blur(16px)',
              border: `1px solid ${service.color}25`,
              borderRadius: '14px',
              overflow: 'hidden',
              padding: 0,
            }}
          >
            {/* Accent bar */}
            <div style={{ height: '3px', background: `linear-gradient(90deg, ${service.color}, ${service.color}60)` }} />

            <div style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <div style={{ fontSize: '28px', filter: `drop-shadow(0 0 12px ${service.color}66)` }}>{service.icon}</div>
                <div>
                  <h3 style={{ fontSize: isMobile ? '16px' : '18px', fontWeight: 700, fontFamily: "'Archivo', sans-serif", color: '#fff', margin: 0, lineHeight: 1.2 }}>
                    {service.title}
                  </h3>
                  <p style={{ fontStyle: 'italic', color: service.color, fontSize: '12px', margin: '4px 0 0', opacity: 0, animation: `bulletFadeIn 0.4s 0.15s ease-out forwards` }}>
                    {service.tagline}
                  </p>
                </div>
              </div>

              {service.bullets.map((b, i) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                    padding: '6px 0',
                    fontSize: '13px',
                    color: 'rgba(255,255,255,0.7)',
                    lineHeight: 1.4,
                    borderBottom: i < service.bullets.length - 1 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                    opacity: 0,
                    animation: `bulletFadeIn 0.4s ${0.2 + i * 0.08}s ease-out forwards`,
                  }}
                >
                  <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: service.color, marginTop: '6px', flexShrink: 0 }} />
                  {b}
                </div>
              ))}

              {/* Energy bar */}
              {(() => {
                const energy = Math.round(100 - (activeIndex / 5) * 40);
                return (
                  <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', fontFamily: "'Archivo', sans-serif" }}>Capability</span>
                      <span style={{ fontSize: '10px', fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)' }}>{energy}%</span>
                    </div>
                    <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${energy}%`, background: `linear-gradient(90deg, ${service.color}, ${service.color}80)`, borderRadius: '2px', transition: 'width 0.8s ease' }} />
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* Navigation: dots with connecting track + arrows */}
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '0px', position: 'relative' }}>
            {/* Connecting track line */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '5px',
                right: '5px',
                height: '2px',
                background: 'rgba(255,255,255,0.1)',
                transform: 'translateY(-50%)',
                borderRadius: '1px',
                zIndex: 0,
              }}
            />
            {/* Progress fill on track */}
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '5px',
                width: `${(activeIndex / (SERVICES.length - 1)) * 100}%`,
                maxWidth: 'calc(100% - 10px)',
                height: '2px',
                background: service.color,
                transform: 'translateY(-50%)',
                borderRadius: '1px',
                zIndex: 0,
                transition: 'width 0.4s ease, background 0.4s ease',
                boxShadow: `0 0 6px ${service.color}66`,
              }}
            />
            {SERVICES.map((s, i) => (
              <button
                key={i}
                onClick={() => selectService(i)}
                style={{
                  width: i === activeIndex ? '14px' : '10px',
                  height: i === activeIndex ? '14px' : '10px',
                  borderRadius: '50%',
                  background: i === activeIndex ? s.color : 'rgba(255,255,255,0.2)',
                  border: i === activeIndex ? `2px solid ${s.color}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow:
                    i === activeIndex ? `0 0 12px ${s.color}88` : 'none',
                  padding: 0,
                  margin: '0 5px',
                  position: 'relative',
                  zIndex: 1,
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
        @keyframes bulletFadeIn {
          from { opacity: 0; transform: translateX(-8px); }
          to   { opacity: 0.85; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}

const arrowBtnStyle = {
  width: '36px',
  height: '36px',
  borderRadius: '100px',
  background: 'linear-gradient(135deg, #1a1a2e, #2E9DB5)',
  border: 'none',
  color: '#ffffff',
  fontSize: '16px',
  fontFamily: "'Archivo', sans-serif",
  fontWeight: 700,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'background 0.2s',
};
