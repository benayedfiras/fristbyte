import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Html, Points, PointMaterial, Environment } from '@react-three/drei';
import PostEffects from './shared/PostEffects';
import * as THREE from 'three';
import gsap from 'gsap';
import { SERVICES as BASE_SERVICES } from '../data/services';

const HEX_POSITIONS = [
  [-2.2, 1.3, 0],
  [0, 1.3, 0],
  [-3.3, -0.65, 0],
  [1.1, -0.65, 0],
  [-2.2, -2.6, 0],
  [0, -2.6, 0],
];

const SERVICES = BASE_SERVICES.map((s, i) => ({
  ...s,
  position: HEX_POSITIONS[i],
}));

/* ── Floating Particles ── */
function Particles({ count = 300 }) {
  const ref = useRef();
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 20;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 10 - 5;
    }
    return arr;
  }, [count]);

  useFrame(() => {
    const pos = ref.current.geometry.attributes.position;
    for (let i = 0; i < count; i++) {
      pos.array[i * 3 + 1] += 0.003;
      if (pos.array[i * 3 + 1] > 10) {
        pos.array[i * 3 + 1] = -10;
      }
    }
    pos.needsUpdate = true;
  });

  return (
    <Points ref={ref} positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.2}
      />
    </Points>
  );
}

/* ── Single Hex Prism ── */
function HexPrism({
  service,
  index,
  hoveredIndex,
  setHoveredIndex,
  selectedIndex,
  setSelectedIndex,
}) {
  const groupRef = useRef();
  const meshRef = useRef();
  const edgesRef = useRef();
  const lightRef = useRef();
  const htmlRef = useRef();

  const isSelected = selectedIndex === index;
  const isOtherSelected = selectedIndex !== null && selectedIndex !== index;
  const isHovered = hoveredIndex === index;
  const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;

  const geo = useMemo(
    () => new THREE.CylinderGeometry(1, 1, 0.4, 6),
    []
  );
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);

  /* idle bobbing */
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (selectedIndex !== null) return;
    if (isHovered) return;
    const t = clock.getElapsedTime();
    groupRef.current.position.y =
      service.position[1] + Math.sin(t * 0.8 + index * 1.1) * 0.08;
  });

  /* GSAP transitions on state change */
  useEffect(() => {
    if (!groupRef.current || !meshRef.current) return;
    const mat = meshRef.current.material;
    const edgeMat = edgesRef.current?.material;

    if (isSelected) {
      // selected: move to center, scale up
      gsap.to(groupRef.current.position, {
        x: 0, y: 0, z: 2,
        duration: 0.6, ease: 'power2.out',
      });
      gsap.to(groupRef.current.scale, {
        x: 2, y: 2, z: 2,
        duration: 0.6, ease: 'power2.out',
      });
      gsap.to(mat, { emissiveIntensity: 0.8, opacity: 1, duration: 0.6 });
    } else if (isOtherSelected) {
      // push away and shrink
      const dir = new THREE.Vector3(
        service.position[0], service.position[1], service.position[2]
      ).normalize();
      gsap.to(groupRef.current.position, {
        x: service.position[0] + dir.x * 2,
        y: service.position[1] + dir.y * 2,
        z: -2,
        duration: 0.6, ease: 'power2.out',
      });
      gsap.to(groupRef.current.scale, {
        x: 0.5, y: 0.5, z: 0.5,
        duration: 0.6, ease: 'power2.out',
      });
      gsap.to(mat, { opacity: 0.3, emissiveIntensity: 0.1, duration: 0.6 });
      if (edgeMat) gsap.to(edgeMat, { opacity: 0.3, duration: 0.6 });
    } else if (isHovered) {
      gsap.to(groupRef.current.position, {
        y: service.position[1] + 0.5,
        duration: 0.4, ease: 'power2.out',
      });
      gsap.to(groupRef.current.scale, {
        x: 1.15, y: 1.15, z: 1.15,
        duration: 0.4, ease: 'power2.out',
      });
      gsap.to(mat, { emissiveIntensity: 0.8, opacity: 0.25, duration: 0.4 });
    } else if (isOtherHovered) {
      gsap.to(mat, { opacity: 0.08, emissiveIntensity: 0.1, duration: 0.4 });
      if (edgeMat) gsap.to(edgeMat, { opacity: 0.4, duration: 0.4 });
    } else {
      // reset
      gsap.to(groupRef.current.position, {
        x: service.position[0],
        y: service.position[1],
        z: service.position[2],
        duration: 0.6, ease: 'power2.out',
      });
      gsap.to(groupRef.current.scale, {
        x: 1, y: 1, z: 1,
        duration: 0.6, ease: 'power2.out',
      });
      gsap.to(mat, { opacity: 0.15, emissiveIntensity: 0.3, duration: 0.6 });
      if (edgeMat) gsap.to(edgeMat, { opacity: 0.8, duration: 0.6 });
    }
  }, [isSelected, isOtherSelected, isHovered, isOtherHovered, service.position, index]);

  return (
    <group
      ref={groupRef}
      position={[service.position[0], service.position[1], service.position[2]]}
    >
      {/* Colored point light above hex */}
      <pointLight
        ref={lightRef}
        position={[0, 1.5, 0]}
        color={service.color}
        intensity={0.3}
        distance={5}
      />

      <mesh
        ref={meshRef}
        geometry={geo}
        rotation={[Math.PI / 2, 0, 0]}
        onPointerOver={(e) => {
          e.stopPropagation();
          if (selectedIndex === null) {
            setHoveredIndex(index);
            document.body.style.cursor = 'pointer';
          }
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          if (selectedIndex === null) {
            setHoveredIndex(null);
            document.body.style.cursor = 'auto';
          }
        }}
        onClick={(e) => {
          e.stopPropagation();
          if (selectedIndex === null) {
            setSelectedIndex(index);
            setHoveredIndex(null);
            document.body.style.cursor = 'auto';
          }
        }}
      >
        <meshStandardMaterial
          color={service.color}
          transparent
          opacity={0.15}
          emissive={service.color}
          emissiveIntensity={3}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments ref={edgesRef} geometry={edgesGeo} rotation={[Math.PI / 2, 0, 0]}>
        <lineBasicMaterial color={service.color} transparent opacity={0.8} />
      </lineSegments>

      {/* Icon on top face */}
      <Text
        position={[0, 0, 0.25]}
        fontSize={0.35}
        color={service.color}
        anchorX="center"
        anchorY="middle"
        font={undefined}
      >
        {service.icon}
      </Text>

      {/* Title below icon */}
      <Text
        position={[0, 0, 0.55]}
        fontSize={0.12}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={1.6}
        textAlign="center"
        font={undefined}
      >
        {service.title}
      </Text>

      {/* Detail panel on selected */}
      {isSelected && (
        <Html
          ref={htmlRef}
          center
          position={[0, 0, 0.3]}
          distanceFactor={4}
          style={{
            pointerEvents: 'auto',
            width: '360px',
          }}
        >
          <div
            style={{
              background: 'rgba(5, 10, 24, 0.95)',
              border: `1px solid ${service.color}`,
              borderRadius: '16px',
              padding: '32px',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              position: 'relative',
              backdropFilter: 'blur(12px)',
              animation: 'fadeIn 0.4s ease-out',
            }}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(null);
                document.body.style.cursor = 'auto';
              }}
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
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: '40px', marginBottom: '8px' }}>
              {service.icon}
            </div>
            <h3
              style={{
                fontSize: '20px',
                fontWeight: 700,
                marginBottom: '16px',
                fontFamily: "'Syne', sans-serif",
              }}
            >
              {service.title}
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 16px 0',
              }}
            >
              {service.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    padding: '4px 0',
                    fontSize: '14px',
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
                fontSize: '14px',
                marginTop: '12px',
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

/* ── Scene (contains all hexes, lights, particles) ── */
function Scene() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const groupRef = useRef();

  /* auto-rotate when nothing hovered/selected */
  useFrame(() => {
    if (!groupRef.current) return;
    if (hoveredIndex !== null || selectedIndex !== null) return;
    groupRef.current.rotation.y += 0.001;
  });

  /* reset rotation on deselect */
  useEffect(() => {
    if (selectedIndex === null && groupRef.current) {
      gsap.to(groupRef.current.rotation, {
        y: 0,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  }, [selectedIndex]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[5, 5, 5]} intensity={1.2} />
      <Particles />
      <group ref={groupRef}>
        {SERVICES.map((service, i) => (
          <HexPrism
            key={i}
            service={service}
            index={i}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
          />
        ))}
      </group>
      <Environment preset="city" />
      <PostEffects />
    </>
  );
}

/* ── Mobile fallback cards ── */
function MobileServiceCards() {
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
              <li
                key={j}
                style={{
                  padding: '3px 0',
                  fontSize: '14px',
                  opacity: 0.8,
                }}
              >
                — {b}
              </li>
            ))}
          </ul>
          <p
            style={{
              fontStyle: 'italic',
              color: s.color,
              fontSize: '14px',
            }}
          >
            {s.tagline}
          </p>
        </div>
      ))}
    </div>
  );
}

/* ── Main Export ── */
export default function ServicesSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section style={{ background: '#050A18', position: 'relative' }}>
      {/* Section Header */}
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
            color: '#1D9E75',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: '16px',
          }}
        >
          OUR CONNECTED ECOSYSTEM
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
          Everything Your Business Needs Connected.
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
          From brand to backend, from traffic to automation, our services work
          together as one scalable system.
        </p>
      </div>

      {/* 3D Canvas or Mobile Cards */}
      {isMobile ? (
        <MobileServiceCards />
      ) : (
        <div style={{ width: '100%', height: '100vh' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            camera={{ position: [0, 0, 8], fov: 50 }}
            style={{ background: '#050A18' }}
            onPointerMissed={() => {}}
          >
            <Scene />
          </Canvas>
        </div>
      )}

      {/* fade-in keyframe for detail panel */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
