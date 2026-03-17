import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Html, Billboard, OrbitControls, Points, PointMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import PostEffects from './shared/PostEffects';
import gsap from 'gsap';
import { SERVICES } from '../data/services';

const GLOBE_RADIUS = 3;

/* Lat/lon positions for 6 pins */
const PIN_COORDS = [
  { lat: 45, lon: -30 },
  { lat: 30, lon: 40 },
  { lat: -15, lon: 80 },
  { lat: 55, lon: 120 },
  { lat: -35, lon: -60 },
  { lat: 10, lon: 170 },
];

function latLonToVec3(lat, lon, radius) {
  const phi = ((90 - lat) * Math.PI) / 180;
  const theta = ((lon + 180) * Math.PI) / 180;
  return new THREE.Vector3(
    -(radius * Math.sin(phi) * Math.cos(theta)),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
}

/* ── Starfield ── */
function Stars({ count = 500 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 50;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 50;
    }
    return arr;
  }, [count]);

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial transparent color="#ffffff" size={0.06} sizeAttenuation depthWrite={false} opacity={0.5} />
    </Points>
  );
}

/* ── Pulsing ring at pin location ── */
function PulseRing({ position, color }) {
  const ref = useRef();
  const normal = useMemo(() => position.clone().normalize(), [position]);
  const quat = useMemo(
    () => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal),
    [normal]
  );

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = (clock.getElapsedTime() * 0.6) % 1;
    ref.current.scale.setScalar(1 + t * 3);
    ref.current.material.opacity = 0.25 * (1 - t);
  });

  return (
    <mesh ref={ref} position={position} quaternion={quat}>
      <ringGeometry args={[0.06, 0.1, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ── Pin on globe ── */
function GlobePin({ service, index, position, hoveredIndex, setHoveredIndex, selectedIndex, onSelect }) {
  const groupRef = useRef();
  const sphereRef = useRef();
  const isHovered = hoveredIndex === index;
  const isSelected = selectedIndex === index;

  /* Pin vertical line from surface */
  const surfacePos = position;
  const pinTop = useMemo(() => {
    return position.clone().normalize().multiplyScalar(GLOBE_RADIUS + 0.5);
  }, [position]);

  const lineGeo = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints([surfacePos, pinTop]);
  }, [surfacePos, pinTop]);

  /* Hover scale */
  useFrame((_, delta) => {
    if (!sphereRef.current) return;
    const targetScale = isHovered || isSelected ? 1.6 : 1;
    damp3(sphereRef.current.scale, [targetScale, targetScale, targetScale], 0.15, delta);
  });

  return (
    <group ref={groupRef}>
      {/* Vertical line */}
      <line geometry={lineGeo}>
        <lineBasicMaterial color={service.color} transparent opacity={0.5} />
      </line>

      {/* Pin sphere */}
      <mesh
        ref={sphereRef}
        position={pinTop}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredIndex(index);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredIndex(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(index);
        }}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={service.color}
          emissive={service.color}
          emissiveIntensity={isHovered || isSelected ? 3 : 1.5}
          toneMapped={false}
        />
      </mesh>

      {/* Pulse ring */}
      <PulseRing position={surfacePos} color={service.color} />

      {/* Label on hover */}
      {(isHovered || isSelected) && (
        <Billboard position={[pinTop.x, pinTop.y + 0.35, pinTop.z]}>
          <Text fontSize={0.18} color="#ffffff" anchorX="center" anchorY="middle">
            {service.title}
          </Text>
        </Billboard>
      )}
    </group>
  );
}

/* ── Arc connections between pins ── */
function ArcConnections({ pinPositions }) {
  const arcs = useMemo(() => {
    const lines = [];
    /* Connect in a ring: 0-1, 1-2, ... 5-0, plus cross: 0-3, 1-4, 2-5 */
    const pairs = [
      [0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 0],
      [0, 3], [1, 4], [2, 5],
    ];
    for (const [a, b] of pairs) {
      const pA = pinPositions[a];
      const pB = pinPositions[b];
      const mid = pA.clone().add(pB).multiplyScalar(0.5);
      mid.normalize().multiplyScalar(GLOBE_RADIUS + 1.2);
      const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
      const pts = curve.getPoints(40);
      lines.push(new THREE.BufferGeometry().setFromPoints(pts));
    }
    return lines;
  }, [pinPositions]);

  return (
    <>
      {arcs.map((geo, i) => (
        <line key={i} geometry={geo}>
          <lineBasicMaterial color="#1D9E75" transparent opacity={0.08} />
        </line>
      ))}
    </>
  );
}

/* ── Globe scene ── */
function GlobeScene() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const globeRef = useRef();
  const controlsRef = useRef();

  const pinPositions = useMemo(
    () => PIN_COORDS.map((c) => latLonToVec3(c.lat, c.lon, GLOBE_RADIUS)),
    []
  );

  /* Auto-rotate globe */
  useFrame(() => {
    if (globeRef.current && selectedIndex === null) {
      globeRef.current.rotation.y += 0.002;
    }
  });

  const handleSelect = (index) => {
    if (selectedIndex === index) {
      setSelectedIndex(null);
      return;
    }
    setSelectedIndex(index);

    /* Rotate globe to bring pin to front */
    if (globeRef.current) {
      const coord = PIN_COORDS[index];
      const targetY = -((coord.lon + 180) * Math.PI) / 180 + Math.PI;
      gsap.to(globeRef.current.rotation, {
        y: targetY,
        duration: 1,
        ease: 'power2.inOut',
      });
    }
  };

  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[8, 5, 8]} intensity={1.2} />
      <pointLight position={[-5, -3, 5]} intensity={0.4} color="#1D9E75" />
      <Stars />
      <OrbitControls
        ref={controlsRef}
        enableZoom={false}
        enablePan={false}
        rotateSpeed={0.4}
      />

      <group ref={globeRef}>
        {/* Wireframe globe */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS, 36, 36]} />
          <meshBasicMaterial
            wireframe
            color="#1D9E75"
            transparent
            opacity={0.12}
          />
        </mesh>

        {/* Solid core (very faint) */}
        <mesh>
          <sphereGeometry args={[GLOBE_RADIUS - 0.02, 36, 36]} />
          <meshStandardMaterial color="#050A18" transparent opacity={0.6} />
        </mesh>

        {/* Pins */}
        {SERVICES.map((service, i) => (
          <GlobePin
            key={i}
            service={service}
            index={i}
            position={pinPositions[i]}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            selectedIndex={selectedIndex}
            onSelect={handleSelect}
          />
        ))}

        {/* Arc connections */}
        <ArcConnections pinPositions={pinPositions} />
      </group>

      {/* Info panel */}
      {selectedIndex !== null && (
        <Html
          position={[5, 1, 0]}
          style={{ pointerEvents: 'auto', width: '320px' }}
        >
          <div
            style={{
              background: 'rgba(5,10,24,0.95)',
              border: `1px solid ${SERVICES[selectedIndex].color}`,
              borderRadius: '16px',
              padding: '24px',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              backdropFilter: 'blur(12px)',
              animation: 'globeFadeIn 0.4s ease-out',
            }}
          >
            <button
              onClick={() => setSelectedIndex(null)}
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
              {SERVICES[selectedIndex].icon}
            </div>
            <h3
              style={{
                fontSize: '17px',
                fontWeight: 700,
                marginBottom: '12px',
                fontFamily: "'Syne', sans-serif",
                color: SERVICES[selectedIndex].color,
              }}
            >
              {SERVICES[selectedIndex].title}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
              {SERVICES[selectedIndex].bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    padding: '3px 0',
                    fontSize: '12px',
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
                color: SERVICES[selectedIndex].color,
                fontSize: '12px',
              }}
            >
              {SERVICES[selectedIndex].tagline}
            </p>

            {/* Connection line decoration */}
            <div
              style={{
                position: 'absolute',
                left: '-40px',
                top: '50%',
                width: '40px',
                height: '1px',
                background: `linear-gradient(90deg, transparent, ${SERVICES[selectedIndex].color})`,
              }}
            />
          </div>
        </Html>
      )}
      <Environment preset="city" />
      <PostEffects />
    </>
  );
}

/* ── Mobile fallback ── */
function MobileGlobe() {
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
export default function ServicesGlobe() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

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
            color: '#06B6D4',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: '16px',
          }}
        >
          INTERACTIVE GLOBE
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
          Services That Span the Globe
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
          Spin the globe. Click any pin to explore the service connected to it.
        </p>
      </div>

      {isMobile ? (
        <MobileGlobe />
      ) : (
        <div style={{ width: '100%', height: '100vh' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            style={{ background: '#050A18' }}
            camera={{ position: [0, 2, 8], fov: 50 }}
          >
            <GlobeScene />
          </Canvas>
        </div>
      )}

      <style>{`
        @keyframes globeFadeIn {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
