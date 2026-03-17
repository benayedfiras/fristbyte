import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Html, Billboard, Environment } from '@react-three/drei';
import * as THREE from 'three';
import { damp3 } from 'maath/easing';
import PostEffects from './shared/PostEffects';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';
import { SERVICES } from '../data/services';

/* Door layout: 3 on each wall */
const DOORS = [
  { x: -4.5, z: 4,  side: 'left'  },
  { x: 4.5,  z: 4,  side: 'right' },
  { x: -4.5, z: -2, side: 'left'  },
  { x: 4.5,  z: -2, side: 'right' },
  { x: -4.5, z: -8, side: 'left'  },
  { x: 4.5,  z: -8, side: 'right' },
];

const INITIAL_CAM = new THREE.Vector3(0, 1.6, 12);
const INITIAL_LOOK = new THREE.Vector3(0, 1.6, -15);

/* ── Camera controller ── */
function CameraController({ target, lookTarget }) {
  const { camera } = useThree();
  const posRef = useRef(INITIAL_CAM.clone());
  const lookRef = useRef(INITIAL_LOOK.clone());

  useEffect(() => {
    posRef.current.copy(target);
    lookRef.current.copy(lookTarget);
  }, [target, lookTarget]);

  useFrame((_, delta) => {
    damp3(camera.position, posRef.current, 0.25, delta);
    camera.lookAt(lookRef.current);
  });

  return null;
}

/* ── Ceiling lights ── */
function CeilingLights() {
  const positions = [-8, -4, 0, 4, 8];
  return (
    <>
      {positions.map((z, i) => (
        <React.Fragment key={i}>
          <pointLight position={[0, 3.8, z]} intensity={0.6} distance={8} color="#e8e0d0" />
          <mesh position={[0, 3.9, z]}>
            <boxGeometry args={[1.5, 0.05, 0.3]} />
            <meshStandardMaterial emissive="#ffffff" emissiveIntensity={3} toneMapped={false} color="#ffffff" />
          </mesh>
        </React.Fragment>
      ))}
    </>
  );
}

/* ── Floor with grid ── */
function Floor() {
  const grid = useMemo(() => {
    const points = [];
    for (let i = -5; i <= 5; i++) {
      points.push(new THREE.Vector3(i, 0.01, -15));
      points.push(new THREE.Vector3(i, 0.01, 15));
    }
    for (let j = -15; j <= 15; j += 2) {
      points.push(new THREE.Vector3(-5, 0.01, j));
      points.push(new THREE.Vector3(5, 0.01, j));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    return geo;
  }, []);

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[10, 30]} />
        <meshStandardMaterial color="#080e1a" />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#1D9E75" transparent opacity={0.08} />
      </lineSegments>
    </>
  );
}

/* ── Walls and ceiling ── */
function Hallway() {
  return (
    <>
      {/* Left wall */}
      <mesh position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[30, 4]} />
        <meshStandardMaterial color="#0a1020" side={THREE.DoubleSide} />
      </mesh>
      {/* Right wall */}
      <mesh position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[30, 4]} />
        <meshStandardMaterial color="#0a1020" side={THREE.DoubleSide} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 30]} />
        <meshStandardMaterial color="#060c18" />
      </mesh>
    </>
  );
}

/* ── Portal door ── */
function PortalDoor({ service, index, doorConfig, hoveredIndex, setHoveredIndex, onSelect, isSelected }) {
  const frameRef = useRef();
  const isHovered = hoveredIndex === index;
  const rotY = doorConfig.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  const openAngle = doorConfig.side === 'left' ? 0.4 : -0.4;

  /* Pulsing glow */
  useFrame(({ clock }) => {
    if (frameRef.current) {
      const pulse = 0.4 + Math.sin(clock.getElapsedTime() * 2 + index) * 0.2;
      frameRef.current.material.emissiveIntensity = isHovered ? 1.2 : pulse;
    }
  });

  /* Door swing angle */
  const doorRef = useRef();
  useFrame(() => {
    if (doorRef.current) {
      const target = isHovered ? openAngle : 0;
      doorRef.current.rotation.y += (target - doorRef.current.rotation.y) * 0.08;
    }
  });

  /* Particle drift from door */
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 8; i++) {
      arr.push({
        offset: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
        radius: 0.2 + Math.random() * 0.4,
      });
    }
    return arr;
  }, []);

  return (
    <group position={[doorConfig.x, 2, doorConfig.z]} rotation={[0, rotY, 0]}>
      {/* Glow plane behind door */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[2, 3.2]} />
        <meshBasicMaterial
          color={service.color}
          transparent
          opacity={isHovered ? 0.12 : 0.04}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Door frame glow */}
      <mesh ref={frameRef}>
        <planeGeometry args={[1.6, 2.8]} />
        <meshStandardMaterial
          color={service.color}
          emissive={service.color}
          emissiveIntensity={3}
          toneMapped={false}
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Frame border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.PlaneGeometry(1.6, 2.8)]} />
        <lineBasicMaterial color={service.color} transparent opacity={0.8} />
      </lineSegments>

      {/* Swinging door panel */}
      <group
        ref={doorRef}
        position={[-0.8, 0, 0]}
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
        <mesh position={[0.8, 0, 0.02]}>
          <planeGeometry args={[1.5, 2.7]} />
          <meshStandardMaterial
            color="#0a1428"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Light spill when hovered */}
      {isHovered && (
        <pointLight
          position={[0, 0, 0.5]}
          color={service.color}
          intensity={2}
          distance={4}
        />
      )}

      {/* Icon above door */}
      <Billboard>
        <Text
          position={[0, 1.8, 0.1]}
          fontSize={0.35}
          color="#ffffff"
        >
          {service.icon}
        </Text>
        <Text
          position={[0, -1.7, 0.1]}
          fontSize={0.12}
          color="#ffffff"
          maxWidth={1.4}
          textAlign="center"
        >
          {service.title}
        </Text>
      </Billboard>

      {/* Drifting particles */}
      {particles.map((p, pi) => (
        <DriftParticle key={pi} config={p} color={service.color} />
      ))}
    </group>
  );
}

function DriftParticle({ config, color }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() * config.speed + config.offset;
    ref.current.position.x = Math.sin(t) * config.radius;
    ref.current.position.y = ((t * 0.3) % 3) - 1.5;
    ref.current.position.z = 0.3 + Math.cos(t * 0.7) * 0.2;
    ref.current.material.opacity = 0.15 + Math.sin(t * 2) * 0.1;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.2} />
    </mesh>
  );
}

/* ── Scene ── */
function PortalScene() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const camTarget = useMemo(() => {
    if (selectedIndex === null) return INITIAL_CAM.clone();
    const d = DOORS[selectedIndex];
    const offsetX = d.side === 'left' ? -2 : 2;
    return new THREE.Vector3(d.x * 0.4 + offsetX * 0.2, 1.6, d.z + 2);
  }, [selectedIndex]);

  const lookTarget = useMemo(() => {
    if (selectedIndex === null) return INITIAL_LOOK.clone();
    const d = DOORS[selectedIndex];
    return new THREE.Vector3(d.x, 1.6, d.z);
  }, [selectedIndex]);

  return (
    <>
      <CameraController target={camTarget} lookTarget={lookTarget} />
      <ambientLight intensity={0.15} />
      <fog attach="fog" args={['#050A18', 8, 22]} />
      <Floor />
      <Hallway />
      <CeilingLights />

      {SERVICES.map((service, i) => (
        <PortalDoor
          key={i}
          service={service}
          index={i}
          doorConfig={DOORS[i]}
          hoveredIndex={hoveredIndex}
          setHoveredIndex={setHoveredIndex}
          isSelected={selectedIndex === i}
          onSelect={(idx) => {
            setSelectedIndex(idx);
            setHoveredIndex(null);
            document.body.style.cursor = 'auto';
          }}
        />
      ))}

      {/* Selected service detail panel */}
      {selectedIndex !== null && (
        <Html
          center
          position={[0, 2, DOORS[selectedIndex].z]}
          distanceFactor={5}
          style={{ pointerEvents: 'auto', width: '380px' }}
        >
          <div
            style={{
              background: `linear-gradient(135deg, rgba(5,10,24,0.97), ${SERVICES[selectedIndex].color}11)`,
              border: `1px solid ${SERVICES[selectedIndex].color}`,
              borderRadius: '16px',
              padding: '28px',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              backdropFilter: 'blur(16px)',
              animation: 'portalFadeIn 0.5s ease-out',
            }}
          >
            <button
              onClick={() => setSelectedIndex(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#fff',
                fontSize: '20px',
                cursor: 'pointer',
                opacity: 0.7,
              }}
            >
              ← Back
            </button>
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {SERVICES[selectedIndex].icon}
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '14px',
                fontFamily: "'Syne', sans-serif",
                color: SERVICES[selectedIndex].color,
              }}
            >
              {SERVICES[selectedIndex].title}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px 0' }}>
              {SERVICES[selectedIndex].bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    padding: '4px 0',
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
                color: SERVICES[selectedIndex].color,
                fontSize: '13px',
              }}
            >
              {SERVICES[selectedIndex].tagline}
            </p>
          </div>
        </Html>
      )}
      {/* Ambient dust motes */}
      <DustMotes />
      <Environment preset="city" />
      <PostEffects />
    </>
  );
}

/* ── Floating dust particles ── */
function DustMotes() {
  const count = 30;
  const refs = useRef([]);
  const data = useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 8,
        y: Math.random() * 3.5 + 0.3,
        z: (Math.random() - 0.5) * 20,
        speed: 0.1 + Math.random() * 0.3,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {data.map((d, i) => (
        <DustMote key={i} config={d} index={i} refs={refs} />
      ))}
    </>
  );
}

function DustMote({ config, index, refs }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * config.speed + config.offset;
    ref.current.position.x = config.x + Math.sin(t) * 0.3;
    ref.current.position.y = config.y + Math.sin(t * 0.7) * 0.2;
    ref.current.position.z = config.z + Math.cos(t * 0.5) * 0.4;
    ref.current.material.opacity = 0.15 + Math.sin(t * 2) * 0.1;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.015, 6, 6]} />
      <meshBasicMaterial color="#ffffff" transparent opacity={0.15} />
    </mesh>
  );
}

/* ── Main export ── */
export default function ServicesPortal() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section style={{ background: '#050A18', position: 'relative' }}>
      <SectionHeader
        label="PORTAL DOORS"
        title="Walk Through Our Portals"
        description="Hover to peek inside. Click to step through."
        accentColor="#3B8BD4"
      />

      {isMobile ? (
        <MobileServiceCards />
      ) : (
        <div style={{ width: '100%', height: '100vh' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            style={{ background: '#050A18' }}
          >
            <Suspense fallback={null}>
              <PortalScene />
            </Suspense>
          </Canvas>
          {/* Suspense HTML overlay */}
        </div>
      )}

      <style>{`
        @keyframes portalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </section>
  );
}
