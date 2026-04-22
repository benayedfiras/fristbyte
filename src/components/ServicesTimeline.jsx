import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import PostEffects from './shared/PostEffects';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';
import CanvasLoader from './shared/CanvasLoader';
import { SERVICES } from '../data/services';

const CARD_COUNT = SERVICES.length;
const STEP = (Math.PI * 2) / CARD_COUNT;
const RADIUS = 3;

/* ── Camera setup ── */
function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 0, 9);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

/* ── Single card on cylinder surface ── */
function CylinderCard({ service, index, frontIndex, onSelect, selectedIndex }) {
  const angle = index * STEP;
  const x = Math.sin(angle) * RADIUS;
  const z = Math.cos(angle) * RADIUS;
  const isFront = index === frontIndex;
  const isSelected = selectedIndex === index;
  const groupRef = useRef();
  const meshRef = useRef();

  useEffect(() => {
    if (!meshRef.current) return;
    const mat = meshRef.current.material;
    mat.emissiveIntensity = isFront ? 1.8 : 0.4;
    mat.opacity = isFront ? 0.25 : 0.1;
  }, [isFront]);

  return (
    <group ref={groupRef} position={[x, 0, z]} rotation={[0, angle, 0]}>
      {/* Card depth shadow (offset plane behind for thickness) */}
      <mesh position={[0.04, -0.04, -0.06]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshBasicMaterial
          color="#000000"
          transparent
          opacity={isFront ? 0.35 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Card plane */}
      <mesh
        ref={meshRef}
        onClick={(e) => {
          e.stopPropagation();
          if (isFront) onSelect(index);
        }}
        onPointerOver={() => {
          if (isFront) document.body.style.cursor = 'pointer';
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'auto';
        }}
      >
        <planeGeometry args={[2.4, 3.2]} />
        <meshStandardMaterial
          color="#1A6B7C"
          emissive="#2E9DB5"
          emissiveIntensity={0.4}
          toneMapped={false}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Gradient overlay on card */}
      <mesh position={[0, 0, 0.005]}>
        <planeGeometry args={[2.4, 3.2]} />
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={isFront ? 0.04 : 0.01}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Card border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.4, 3.2)]} />
        <lineBasicMaterial color="#2E9DB5" transparent opacity={isFront ? 0.9 : 0.3} />
      </lineSegments>

      {/* Icon */}
      <Text
        position={[0, 0.6, 0.01]}
        fontSize={0.5}
        color={isFront ? '#ffffff' : '#2E9DB5'}
        anchorX="center"
        anchorY="middle"
      >
        {service.icon}
      </Text>

      {/* Title */}
      <Text
        position={[0, -0.2, 0.01]}
        fontSize={0.18}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={2}
        textAlign="center"
        font={undefined}
      >
        {service.title}
      </Text>

      {/* Detail panel for selected front card */}
      {isSelected && isFront && (() => {
        const energyValue = Math.round(100 - (index / 5) * 40);
        return (
          <Html
            center
            position={[0, -0.2, 0.5]}
            distanceFactor={6}
            style={{ pointerEvents: 'auto', width: '260px' }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(8, 14, 26, 0.92)',
                backdropFilter: 'blur(16px)',
                border: `1px solid ${service.color}35`,
                borderRadius: '14px',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                width: '260px',
                padding: 0,
                overflow: 'hidden',
                fontFamily: "'Archivo', sans-serif",
                animation: 'tlFadeIn 0.4s ease-out',
              }}
            >
              {/* Top accent bar */}
              <div
                style={{
                  height: '3px',
                  background: `linear-gradient(90deg, ${service.color}, ${service.color}60)`,
                }}
              />

              {/* Header section */}
              <div style={{ padding: '16px' }}>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#ffffff',
                    fontFamily: "'Archivo', sans-serif",
                    margin: 0,
                  }}
                >
                  {service.title}
                </div>
                <div
                  style={{
                    fontSize: '12px',
                    fontStyle: 'italic',
                    color: service.color,
                    fontFamily: "'Archivo', sans-serif",
                    marginTop: '4px',
                  }}
                >
                  {service.tagline}
                </div>
              </div>

              {/* Bullets section */}
              <div style={{ padding: '0 16px 12px' }}>
                {service.bullets.map((b, i) => (
                  <div
                    key={i}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '6px 0',
                      borderBottom: '1px solid rgba(255,255,255,0.05)',
                    }}
                  >
                    <div
                      style={{
                        width: '5px',
                        height: '5px',
                        borderRadius: '50%',
                        background: service.color,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: '12px',
                        color: 'rgba(255,255,255,0.7)',
                        fontFamily: "'Archivo', sans-serif",
                      }}
                    >
                      {b}
                    </span>
                  </div>
                ))}
              </div>

              {/* Energy bar section */}
              <div
                style={{
                  padding: '12px 16px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '6px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: "'Archivo', sans-serif",
                    }}
                  >
                    Capability
                  </span>
                  <span
                    style={{
                      fontSize: '10px',
                      color: 'rgba(255,255,255,0.4)',
                      fontFamily: "'Archivo', monospace",
                    }}
                  >
                    {energyValue}%
                  </span>
                </div>
                <div
                  style={{
                    height: '3px',
                    borderRadius: '2px',
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${energyValue}%`,
                      borderRadius: '2px',
                      background: `linear-gradient(90deg, ${service.color}, ${service.color}80)`,
                    }}
                  />
                </div>
              </div>
            </div>
          </Html>
        );
      })()}
    </group>
  );
}

/* ── Floating particles inside cylinder ── */
function CylinderParticles({ count = 40 }) {
  const ref = useRef();
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * (RADIUS - 0.3);
      arr.push({
        x: Math.sin(angle) * r,
        y: (Math.random() - 0.5) * 3.5,
        z: Math.cos(angle) * r,
        speed: 0.1 + Math.random() * 0.2,
        offset: Math.random() * Math.PI * 2,
        drift: 0.1 + Math.random() * 0.2,
      });
    }
    return arr;
  }, [count]);

  const positions = useMemo(() => new Float32Array(count * 3), [count]);
  const opacities = useMemo(() => new Float32Array(count), [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const y = ((p.y + t * p.speed) % 3.5) - 1.75;
      positions[i * 3] = p.x + Math.sin(t * p.drift + p.offset) * 0.15;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = p.z + Math.cos(t * p.drift + p.offset) * 0.15;
      opacities[i] = 0.15 + Math.sin(t * 0.8 + p.offset) * 0.1;
    }
    ref.current.geometry.attributes.position.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#2E9DB5"
        size={0.04}
        transparent
        opacity={0.3}
        sizeAttenuation
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/* ── Cylinder wireframe shell ── */
function CylinderShell() {
  return (
    <>
      {/* Outer wireframe */}
      <mesh>
        <cylinderGeometry args={[RADIUS, RADIUS, 4, 32, 1, true]} />
        <meshBasicMaterial
          wireframe
          color="#1A6B7C"
          transparent
          opacity={0.12}
        />
      </mesh>
      {/* Inner wireframe for depth */}
      <mesh>
        <cylinderGeometry args={[RADIUS - 0.15, RADIUS - 0.15, 3.8, 24, 1, true]} />
        <meshBasicMaterial
          wireframe
          color="#2E9DB5"
          transparent
          opacity={0.04}
        />
      </mesh>
      {/* Floating particles */}
      <CylinderParticles />
    </>
  );
}

/* ── Spotlight that follows the front card ── */
function FrontCardSpotlight({ frontIndex }) {
  const lightRef = useRef();
  const angle = frontIndex * STEP;
  const targetX = Math.sin(angle) * RADIUS;
  const targetZ = Math.cos(angle) * RADIUS;

  useFrame((_, delta) => {
    if (!lightRef.current) return;
    lightRef.current.position.x += (targetX - lightRef.current.position.x) * 0.08;
    lightRef.current.position.z += (targetZ + 2 - lightRef.current.position.z) * 0.08;
  });

  const color = SERVICES[frontIndex]?.color || '#2E9DB5';

  return (
    <pointLight
      ref={lightRef}
      position={[targetX, 0, targetZ + 2]}
      color={color}
      intensity={2.5}
      distance={6}
    />
  );
}

/* ── Scene ── */
function TimelineScene({ frontIndex, setFrontIndex }) {
  const groupRef = useRef();
  const rotRef = useRef(0);
  const targetRotRef = useRef(0);
  const velRef = useRef(0);
  const draggingRef = useRef(false);
  const dragStartRef = useRef(0);
  const dragRotStartRef = useRef(0);
  const [selectedIndex, setSelectedIndex] = useState(null);

  /* Sync rotation when frontIndex changes from Next/Prev buttons */
  useEffect(() => {
    targetRotRef.current = -(frontIndex * STEP);
  }, [frontIndex]);

  /* Spring physics rotation */
  const idleTimerRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (!draggingRef.current) {
      const dist = Math.abs(targetRotRef.current - rotRef.current);

      /* Only auto-rotate after settling for 3 seconds with nothing selected */
      if (selectedIndex === null && dist < 0.01) {
        idleTimerRef.current += delta;
        if (idleTimerRef.current > 3) {
          targetRotRef.current -= 0.002;
        }
      } else {
        idleTimerRef.current = 0;
      }

      const d = targetRotRef.current - rotRef.current;
      velRef.current = (velRef.current + d * 0.08) * 0.82;
      rotRef.current += velRef.current;
    }

    groupRef.current.rotation.y = rotRef.current;

    /* Determine front card */
    const normRot =
      ((-rotRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const idx = Math.round(normRot / STEP) % CARD_COUNT;
    if (idx !== frontIndex) setFrontIndex(idx);
  });

  const handlePointerDown = (e) => {
    if (selectedIndex !== null) return;
    draggingRef.current = true;
    dragStartRef.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    dragRotStartRef.current = rotRef.current;
  };

  const handlePointerMove = (e) => {
    if (!draggingRef.current) return;
    const cx = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const delta = (cx - dragStartRef.current) * 0.005;
    rotRef.current = dragRotStartRef.current + delta;
    targetRotRef.current = rotRef.current;
    velRef.current = 0;
  };

  const handlePointerUp = () => {
    if (!draggingRef.current) return;
    draggingRef.current = false;
    /* Snap to nearest card */
    const normRot =
      ((-rotRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    const nearestIdx = Math.round(normRot / STEP) % CARD_COUNT;
    targetRotRef.current = -(nearestIdx * STEP);
  };

  const handleSelect = (index) => {
    setSelectedIndex(index === selectedIndex ? null : index);
  };

  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.4} />
      <pointLight position={[0, 5, 8]} intensity={1.5} />
      <pointLight position={[0, -3, 5]} intensity={0.4} color="#2E9DB5" />
      <FrontCardSpotlight frontIndex={frontIndex} />

      <group
        ref={groupRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <CylinderShell />
        {SERVICES.map((service, i) => (
          <CylinderCard
            key={i}
            service={service}
            index={i}
            frontIndex={frontIndex}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        ))}
      </group>
      <Environment preset="city" />
      <PostEffects />
    </>
  );
}

/* ── Main export ── */
export default function ServicesTimeline() {
  const [isMobile, setIsMobile] = useState(false);
  const [frontIndex, setFrontIndex] = useState(0);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const goTo = (dir) => {
    setFrontIndex((prev) => (prev + dir + CARD_COUNT) % CARD_COUNT);
  };

  return (
    <section style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #0A1628 50%, #0D1B2A 100%)', position: 'relative' }}>
      <SectionHeader
        label="ROTATING CYLINDER"
        title="Spin Through Our Services"
        description="Drag to rotate. Click the front card to expand. Momentum carries you through."
        accentColor="#2DD4BF"
      />

      {isMobile ? (
        <MobileServiceCards />
      ) : (
        <>
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <Suspense fallback={<CanvasLoader color="#2E9DB5" />}>
              <Canvas
                shadows
                dpr={[1, 2]}
                gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
                style={{ background: '#0D1B2A' }}
              >
                <TimelineScene
                  frontIndex={frontIndex}
                  setFrontIndex={setFrontIndex}
                />
              </Canvas>
            </Suspense>

            {/* Prev / Next buttons */}
            <div
              style={{
                position: 'absolute',
                bottom: '40px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '24px',
                zIndex: 10,
              }}
            >
              <button
                onClick={() => goTo(-1)}
                style={navBtnStyle}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 0 24px rgba(46,157,181,0.5)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                ← Prev
              </button>
              <span
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '14px',
                  fontFamily: "'Archivo', sans-serif",
                  alignSelf: 'center',
                }}
              >
                {frontIndex + 1} / {CARD_COUNT}
              </span>
              <button
                onClick={() => goTo(1)}
                style={navBtnStyle}
                onMouseEnter={(e) => {
                  e.target.style.boxShadow = '0 0 24px rgba(46,157,181,0.5)';
                  e.target.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.boxShadow = 'none';
                  e.target.style.transform = 'scale(1)';
                }}
              >
                Next →
              </button>
            </div>
          </div>
        </>
      )}

      <style>{`
        @keyframes tlFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}

const navBtnStyle = {
  padding: '10px 24px',
  background: 'linear-gradient(135deg, #1A6B7C, #2E9DB5)',
  border: 'none',
  borderRadius: '100px',
  color: '#ffffff',
  fontSize: '14px',
  fontFamily: "'Archivo', sans-serif",
  fontWeight: 700,
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: 'none',
};
