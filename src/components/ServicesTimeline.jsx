import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Html, Environment } from '@react-three/drei';
import * as THREE from 'three';
import PostEffects from './shared/PostEffects';
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
    mat.emissiveIntensity = isFront ? 0.8 : 0.2;
    mat.opacity = isFront ? 0.25 : 0.1;
  }, [isFront]);

  return (
    <group ref={groupRef} position={[x, 0, z]} rotation={[0, angle, 0]}>
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
          color={service.color}
          emissive={service.color}
          emissiveIntensity={3}
          toneMapped={false}
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Card border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(2.4, 3.2)]} />
        <lineBasicMaterial color={service.color} transparent opacity={isFront ? 0.9 : 0.3} />
      </lineSegments>

      {/* Icon */}
      <Text
        position={[0, 0.6, 0.01]}
        fontSize={0.5}
        color={isFront ? '#ffffff' : service.color}
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
      {isSelected && isFront && (
        <Html
          center
          position={[0, -0.2, 0.5]}
          distanceFactor={6}
          style={{ pointerEvents: 'auto', width: '340px' }}
        >
          <div
            style={{
              background: 'rgba(5,10,24,0.95)',
              border: `1px solid ${service.color}`,
              borderRadius: '16px',
              padding: '24px',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              backdropFilter: 'blur(12px)',
              animation: 'tlFadeIn 0.4s ease-out',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSelect(null);
              }}
              style={{
                position: 'absolute',
                top: '10px',
                right: '14px',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '18px',
                cursor: 'pointer',
                opacity: 0.7,
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: '32px', marginBottom: '6px' }}>
              {service.icon}
            </div>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 700,
                marginBottom: '12px',
                fontFamily: "'Syne', sans-serif",
                color: service.color,
              }}
            >
              {service.title}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
              {service.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    padding: '3px 0',
                    fontSize: '13px',
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
                fontSize: '13px',
              }}
            >
              {service.tagline}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ── Cylinder wireframe shell ── */
function CylinderShell() {
  return (
    <mesh>
      <cylinderGeometry args={[RADIUS, RADIUS, 4, 32, 1, true]} />
      <meshBasicMaterial
        wireframe
        color="#1D9E75"
        transparent
        opacity={0.06}
      />
    </mesh>
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

  /* Spring physics rotation */
  useFrame(() => {
    if (!groupRef.current) return;

    if (!draggingRef.current) {
      /* Auto-rotate when idle (not dragging, nothing selected) */
      if (selectedIndex === null) {
        targetRotRef.current -= 0.002;
      }

      const delta = targetRotRef.current - rotRef.current;
      velRef.current = (velRef.current + delta * 0.08) * 0.82;
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
      <pointLight position={[0, -3, 5]} intensity={0.4} color="#8B5CF6" />

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

/* ── Mobile fallback ── */
function MobileTimeline() {
  return (
    <div style={{ padding: '0 20px 60px' }}>
      {SERVICES.map((s, i) => (
        <div
          key={i}
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: `1px solid ${s.color}33`,
            borderRadius: '16px',
            padding: '28px',
            marginBottom: '16px',
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          <div style={{ fontSize: '32px', marginBottom: '8px' }}>{s.icon}</div>
          <h3
            style={{
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '12px',
              fontFamily: "'Syne', sans-serif",
              color: s.color,
            }}
          >
            {s.title}
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
            {s.bullets.map((b, j) => (
              <li key={j} style={{ padding: '3px 0', fontSize: '14px', opacity: 0.8 }}>
                — {b}
              </li>
            ))}
          </ul>
          <p style={{ fontStyle: 'italic', color: s.color, fontSize: '14px' }}>
            {s.tagline}
          </p>
        </div>
      ))}
    </div>
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
    <section style={{ background: '#050A18', position: 'relative' }}>
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
          CYLINDER TIMELINE
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
          Spin Through Our Services
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
          Drag to rotate the cylinder. Click the front card to explore.
        </p>
      </div>

      {isMobile ? (
        <MobileTimeline />
      ) : (
        <>
          <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
            <Canvas
              shadows
              dpr={[1, 2]}
              gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
              style={{ background: '#050A18' }}
            >
              <TimelineScene
                frontIndex={frontIndex}
                setFrontIndex={setFrontIndex}
              />
            </Canvas>

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
                onMouseEnter={(e) =>
                  (e.target.style.background = 'rgba(255,255,255,0.12)')
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = 'rgba(255,255,255,0.06)')
                }
              >
                ← Prev
              </button>
              <span
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontSize: '14px',
                  fontFamily: "'DM Sans', sans-serif",
                  alignSelf: 'center',
                }}
              >
                {frontIndex + 1} / {CARD_COUNT}
              </span>
              <button
                onClick={() => goTo(1)}
                style={navBtnStyle}
                onMouseEnter={(e) =>
                  (e.target.style.background = 'rgba(255,255,255,0.12)')
                }
                onMouseLeave={(e) =>
                  (e.target.style.background = 'rgba(255,255,255,0.06)')
                }
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
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: '999px',
  color: '#fff',
  fontSize: '14px',
  fontFamily: "'DM Sans', sans-serif",
  cursor: 'pointer',
  transition: 'background 0.2s',
};
