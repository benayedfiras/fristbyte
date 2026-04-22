import React, { Suspense, useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Billboard, Environment } from '@react-three/drei';
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
const BASE_FOG_COLOR = new THREE.Color('#0D1B2A');

/* ── Camera controller ── */
function CameraController({ target, lookTarget }) {
  const { camera } = useThree();
  const posRef = useRef(INITIAL_CAM.clone());
  const lookRef = useRef(INITIAL_LOOK.clone());
  const lookSmoothRef = useRef(INITIAL_LOOK.clone());

  useEffect(() => {
    posRef.current.copy(target);
    lookRef.current.copy(lookTarget);
  }, [target, lookTarget]);

  useFrame((_, delta) => {
    damp3(camera.position, posRef.current, 0.18, delta);
    /* Smooth the lookAt target too for cinematic feel */
    lookSmoothRef.current.lerp(lookRef.current, 1 - Math.exp(-3.5 * delta));
    camera.lookAt(lookSmoothRef.current);
  });

  return null;
}

/* ── Fog color controller ── */
function FogController({ hoveredIndex }) {
  const { scene } = useThree();
  const targetColor = useRef(BASE_FOG_COLOR.clone());

  useFrame((_, delta) => {
    if (!scene.fog) return;
    if (hoveredIndex !== null && hoveredIndex < SERVICES.length) {
      const svcColor = new THREE.Color(SERVICES[hoveredIndex].color);
      targetColor.current.copy(BASE_FOG_COLOR).lerp(svcColor, 0.08);
    } else {
      targetColor.current.copy(BASE_FOG_COLOR);
    }
    scene.fog.color.lerp(targetColor.current, 1 - Math.exp(-4 * delta));
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
            <meshStandardMaterial emissive="#2E9DB5" emissiveIntensity={3} toneMapped={false} color="#2E9DB5" />
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
        <meshStandardMaterial color="#0D1B2A" />
      </mesh>
      <lineSegments geometry={grid}>
        <lineBasicMaterial color="#2E9DB5" transparent opacity={0.08} />
      </lineSegments>
    </>
  );
}

/* ── Floor reflection light under each door ── */
function FloorReflection({ doorConfig, color, isHovered }) {
  const ref = useRef();

  useFrame((_, delta) => {
    if (!ref.current) return;
    const target = isHovered ? 0.18 : 0.06;
    ref.current.material.opacity += (target - ref.current.material.opacity) * (1 - Math.exp(-6 * delta));
  });

  return (
    <mesh
      ref={ref}
      position={[doorConfig.x, 0.02, doorConfig.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <circleGeometry args={[1.2, 32]} />
      <meshBasicMaterial
        color={color}
        transparent
        opacity={0.06}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  );
}

/* ── Walls and ceiling ── */
function Hallway() {
  return (
    <>
      {/* Left wall */}
      <mesh position={[-5, 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[30, 4]} />
        <meshStandardMaterial color="#0D1B2A" side={THREE.DoubleSide} />
      </mesh>
      {/* Right wall */}
      <mesh position={[5, 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[30, 4]} />
        <meshStandardMaterial color="#0D1B2A" side={THREE.DoubleSide} />
      </mesh>
      {/* Ceiling */}
      <mesh position={[0, 4, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[10, 30]} />
        <meshStandardMaterial color="#0D1B2A" />
      </mesh>
    </>
  );
}

/* ── Instruction hint text ── */
function InstructionHint() {
  const ref = useRef();
  const matRef = useRef();

  useFrame(({ clock }) => {
    if (!ref.current || !matRef.current) return;
    const t = clock.getElapsedTime();
    /* Fade in over 3 seconds, starting after 1s delay */
    const fadeIn = Math.min(1, Math.max(0, (t - 1) / 3));
    /* Gentle bob */
    ref.current.position.y = 1.0 + Math.sin(t * 0.8) * 0.05;
    matRef.current.opacity = fadeIn * (0.5 + Math.sin(t * 1.5) * 0.1);
  });

  return (
    <Billboard>
      <group ref={ref} position={[0, 1.0, 8]}>
        <Text
          fontSize={0.14}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={4}
          textAlign="center"
        >
          Hover the doors to peek inside
          <meshBasicMaterial ref={matRef} transparent opacity={0} color="#ffffff" />
        </Text>
      </group>
    </Billboard>
  );
}

/* ── Portal door ── */
function PortalDoor({ service, index, doorConfig, hoveredIndex, setHoveredIndex, onSelect, isSelected }) {
  const frameRef = useRef();
  const burstRef = useRef();
  const isHovered = hoveredIndex === index;
  const rotY = doorConfig.side === 'left' ? Math.PI / 2 : -Math.PI / 2;
  /* More dramatic open angle */
  const openAngle = doorConfig.side === 'left' ? 0.75 : -0.75;

  /* Pulsing glow */
  useFrame(({ clock }) => {
    if (frameRef.current) {
      const pulse = 0.4 + Math.sin(clock.getElapsedTime() * 2 + index) * 0.2;
      frameRef.current.material.emissiveIntensity = isHovered ? 1.8 : pulse;
    }
  });

  /* Door swing angle */
  const doorRef = useRef();
  useFrame((_, delta) => {
    if (doorRef.current) {
      const target = isHovered ? openAngle : 0;
      doorRef.current.rotation.y += (target - doorRef.current.rotation.y) * (1 - Math.exp(-5 * delta));
    }
  });

  /* Light burst when door opens */
  useFrame((_, delta) => {
    if (burstRef.current) {
      const targetIntensity = isHovered ? 4 : 0;
      burstRef.current.intensity += (targetIntensity - burstRef.current.intensity) * (1 - Math.exp(-6 * delta));
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

  /* Shared event handlers for click area */
  const handlePointerOver = (e) => {
    e.stopPropagation();
    setHoveredIndex(index);
    document.body.style.cursor = 'pointer';
  };
  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHoveredIndex(null);
    document.body.style.cursor = 'auto';
  };
  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(index);
  };

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

      {/* Door frame glow - also clickable */}
      <mesh
        ref={frameRef}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <planeGeometry args={[1.6, 2.8]} />
        <meshStandardMaterial
          color="#1A6B7C"
          emissive="#2E9DB5"
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
        <lineBasicMaterial color="#2E9DB5" transparent opacity={0.8} />
      </lineSegments>

      {/* Swinging door panel */}
      <group
        ref={doorRef}
        position={[-0.8, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={handleClick}
      >
        <mesh position={[0.8, 0, 0.02]}>
          <planeGeometry args={[1.5, 2.7]} />
          <meshStandardMaterial
            color="#0D1B2A"
            transparent
            opacity={0.85}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>

      {/* Light burst when door opens */}
      <pointLight
        ref={burstRef}
        position={[0, 0, 0.5]}
        color={service.color}
        intensity={0}
        distance={6}
      />

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
function PortalScene({ selectedIndex, setSelectedIndex }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const camTarget = useMemo(() => {
    if (selectedIndex === null) return INITIAL_CAM.clone();
    const d = DOORS[selectedIndex];
    /* Stop camera well in front of the door, offset to side */
    const sideOffset = d.side === 'left' ? -1.2 : 1.2;
    return new THREE.Vector3(d.x * 0.4 + sideOffset, 1.6, d.z + 3.5);
  }, [selectedIndex]);

  const lookTarget = useMemo(() => {
    if (selectedIndex === null) return INITIAL_LOOK.clone();
    const d = DOORS[selectedIndex];
    return new THREE.Vector3(d.x, 1.6, d.z);
  }, [selectedIndex]);

  return (
    <>
      <CameraController target={camTarget} lookTarget={lookTarget} />
      <FogController hoveredIndex={hoveredIndex} />
      <ambientLight intensity={0.15} />
      <fog attach="fog" args={['#0D1B2A', 8, 22]} />
      <Floor />
      <Hallway />
      <CeilingLights />

      {SERVICES.map((service, i) => (
        <React.Fragment key={i}>
          <PortalDoor
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
          <FloorReflection
            doorConfig={DOORS[i]}
            color={service.color}
            isHovered={hoveredIndex === i}
          />
        </React.Fragment>
      ))}

      {/* Instruction hint near entrance */}
      {selectedIndex === null && <InstructionHint />}

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
        <DustMote key={i} config={d} />
      ))}
    </>
  );
}

function DustMote({ config }) {
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
  const [selectedIndex, setSelectedIndex] = useState(null);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const selected = selectedIndex !== null ? SERVICES[selectedIndex] : null;

  return (
    <section style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #0A1628 50%, #0D1B2A 100%)', position: 'relative' }}>
      <SectionHeader
        label="PORTAL DOORS"
        title="Step Through Each Portal"
        description="Hover to crack open. Click to walk through. Each door leads to a different capability."
        accentColor="#EC4899"
      />

      {isMobile ? (
        <MobileServiceCards />
      ) : (
        <div style={{ width: '100%', height: '100vh', position: 'relative' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            camera={{ position: [0, 1.6, 12], fov: 60 }}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            style={{ background: '#0D1B2A' }}
            onPointerMissed={() => {
              if (selectedIndex !== null) {
                setSelectedIndex(null);
                document.body.style.cursor = 'auto';
              }
            }}
          >
            <Suspense fallback={null}>
              <PortalScene selectedIndex={selectedIndex} setSelectedIndex={setSelectedIndex} />
            </Suspense>
          </Canvas>

          {/* Fixed CSS overlay info panel */}
          {selected && (() => {
            const energyValue = Math.round(100 - (selectedIndex / 5) * 40);
            return (
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  paddingRight: '5%',
                  pointerEvents: 'none',
                  zIndex: 10,
                }}
              >
                <div
                  style={{
                    width: '260px',
                    background: 'rgba(8, 14, 26, 0.92)',
                    backdropFilter: 'blur(16px)',
                    border: `1px solid ${selected.color}35`,
                    borderRadius: '14px',
                    boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
                    padding: 0,
                    overflow: 'hidden',
                    color: '#fff',
                    fontFamily: "'Archivo', sans-serif",
                    animation: 'portalSlideIn 0.5s cubic-bezier(0.22,1,0.36,1)',
                    pointerEvents: 'auto',
                  }}
                >
                  {/* Top accent bar */}
                  <div
                    style={{
                      height: '3px',
                      background: `linear-gradient(90deg, ${selected.color}, ${selected.color}60)`,
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
                        lineHeight: 1.3,
                      }}
                    >
                      {selected.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        fontStyle: 'italic',
                        color: selected.color,
                        fontFamily: "'Archivo', sans-serif",
                        marginTop: '4px',
                      }}
                    >
                      {selected.tagline}
                    </div>
                  </div>

                  {/* Bullets section */}
                  <div style={{ padding: '0 16px 12px' }}>
                    {selected.bullets.map((b, bi) => (
                      <div
                        key={bi}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '7px 0',
                          borderBottom: '1px solid rgba(255,255,255,0.05)',
                        }}
                      >
                        <div
                          style={{
                            width: '5px',
                            height: '5px',
                            borderRadius: '50%',
                            backgroundColor: selected.color,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: '12px',
                            fontFamily: "'Archivo', sans-serif",
                            color: 'rgba(255,255,255,0.7)',
                            lineHeight: 1.4,
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
                          fontFamily: "'Archivo', sans-serif",
                          color: 'rgba(255,255,255,0.4)',
                          textTransform: 'uppercase',
                          letterSpacing: '0.5px',
                        }}
                      >
                        Capability
                      </span>
                      <span
                        style={{
                          fontSize: '10px',
                          fontFamily: 'monospace',
                          color: 'rgba(255,255,255,0.4)',
                        }}
                      >
                        {energyValue}%
                      </span>
                    </div>
                    <div
                      style={{
                        width: '100%',
                        height: '3px',
                        borderRadius: '2px',
                        background: 'rgba(255,255,255,0.06)',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${energyValue}%`,
                          height: '100%',
                          borderRadius: '2px',
                          background: `linear-gradient(90deg, ${selected.color}, ${selected.color}80)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <style>{`
        @keyframes portalFadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes portalSlideIn {
          from { opacity: 0; transform: translateX(30px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </section>
  );
}
