import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Text, Html, Points, PointMaterial, Environment } from '@react-three/drei';
import PostEffects from './shared/PostEffects';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';
import * as THREE from 'three';
import gsap from 'gsap';
import { SERVICES as BASE_SERVICES } from '../data/services';

const HEX_POSITIONS = [
  [-1.1, 1.3, 0],
  [1.1, 1.3, 0],
  [-2.2, -0.65, 0],
  [0, -0.65, 0],
  [-1.1, -2.6, 0],
  [1.1, -2.6, 0],
];

const SERVICES = BASE_SERVICES.map((s, i) => ({
  ...s,
  position: HEX_POSITIONS[i],
}));

/* ── Floating Particles with color tinting ── */
function Particles({ count = 300 }) {
  const ref = useRef();
  const { positions, colors } = useMemo(() => {
    const posArr = new Float32Array(count * 3);
    const colArr = new Float32Array(count * 3);
    const hexColors = SERVICES.map((s) => new THREE.Color(s.color));
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * 20;
      const y = (Math.random() - 0.5) * 20;
      const z = (Math.random() - 0.5) * 10 - 5;
      posArr[i * 3] = x;
      posArr[i * 3 + 1] = y;
      posArr[i * 3 + 2] = z;
      // Find nearest hex and tint toward its color
      let minDist = Infinity;
      let nearestColor = new THREE.Color('#ffffff');
      SERVICES.forEach((s, si) => {
        const dx = x - s.position[0];
        const dy = y - s.position[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) {
          minDist = dist;
          nearestColor = hexColors[si];
        }
      });
      const blend = Math.max(0, 1 - minDist / 6);
      const white = new THREE.Color('#ffffff');
      white.lerp(nearestColor, blend * 0.6);
      colArr[i * 3] = white.r;
      colArr[i * 3 + 1] = white.g;
      colArr[i * 3 + 2] = white.b;
    }
    return { positions: posArr, colors: colArr };
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
      <bufferAttribute attach="geometry-attributes-color" array={colors} count={count} itemSize={3} />
      <PointMaterial
        transparent
        vertexColors
        size={0.03}
        sizeAttenuation
        depthWrite={false}
        opacity={0.25}
      />
    </Points>
  );
}

/* ── Pulsing connection lines between adjacent hexes ── */
function ConnectionLines() {
  const linesRef = useRef([]);

  // Compute adjacency: hexes within ~2.5 units are "adjacent"
  const adjacentPairs = useMemo(() => {
    const pairs = [];
    for (let i = 0; i < SERVICES.length; i++) {
      for (let j = i + 1; j < SERVICES.length; j++) {
        const dx = SERVICES[i].position[0] - SERVICES[j].position[0];
        const dy = SERVICES[i].position[1] - SERVICES[j].position[1];
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 2.8) pairs.push([i, j]);
      }
    }
    return pairs;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    linesRef.current.forEach((linemat, idx) => {
      if (linemat) {
        linemat.opacity = 0.08 + Math.sin(t * 1.5 + idx * 1.2) * 0.06;
      }
    });
  });

  return (
    <>
      {adjacentPairs.map(([a, b], idx) => {
        const posA = SERVICES[a].position;
        const posB = SERVICES[b].position;
        const points = [
          new THREE.Vector3(posA[0], posA[1], posA[2]),
          new THREE.Vector3(posB[0], posB[1], posB[2]),
        ];
        const geo = new THREE.BufferGeometry().setFromPoints(points);
        const colorA = new THREE.Color(SERVICES[a].color);
        const colorB = new THREE.Color(SERVICES[b].color);
        const midColor = colorA.clone().lerp(colorB, 0.5);
        return (
          <line key={`conn-${idx}`} geometry={geo}>
            <lineBasicMaterial
              ref={(el) => { linesRef.current[idx] = el; }}
              color={midColor}
              transparent
              opacity={0.1}
              depthWrite={false}
            />
          </line>
        );
      })}
    </>
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
  hasEnteredView,
}) {
  const groupRef = useRef();
  const meshRef = useRef();
  const edgesRef = useRef();
  const lightRef = useRef();
  const htmlRef = useRef();
  const entranceCompleteRef = useRef(false);

  const isSelected = selectedIndex === index;
  const isOtherSelected = selectedIndex !== null && selectedIndex !== index;
  const isHovered = hoveredIndex === index;
  const isOtherHovered = hoveredIndex !== null && hoveredIndex !== index;

  const geo = useMemo(
    () => new THREE.CylinderGeometry(1, 1, 0.4, 6),
    []
  );
  const edgesGeo = useMemo(() => new THREE.EdgesGeometry(geo), [geo]);

  /* Staggered entrance animation */
  useEffect(() => {
    if (!groupRef.current || !hasEnteredView || entranceCompleteRef.current) return;
    groupRef.current.scale.set(0, 0, 0);
    gsap.to(groupRef.current.scale, {
      x: 1, y: 1, z: 1,
      duration: 0.6,
      delay: index * 0.12,
      ease: 'back.out(1.7)',
      onComplete: () => { entranceCompleteRef.current = true; },
    });
  }, [hasEnteredView, index]);

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
      gsap.to(mat, { emissiveIntensity: 3.0, opacity: 1, duration: 0.6 });
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
      gsap.to(mat, { emissiveIntensity: 1.8, opacity: 0.25, duration: 0.4 });
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
      gsap.to(mat, { opacity: 0.15, emissiveIntensity: 0.4, duration: 0.6 });
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
        color={'#2E9DB5'}
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
          color={'#1A6B7C'}
          transparent
          opacity={0.15}
          emissive={'#2E9DB5'}
          emissiveIntensity={0.4}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Wireframe edges */}
      <lineSegments ref={edgesRef} geometry={edgesGeo} rotation={[Math.PI / 2, 0, 0]}>
        <lineBasicMaterial color={'#2E9DB5'} transparent opacity={0.8} />
      </lineSegments>

      {/* Icon on top face */}
      <Text
        position={[0, 0, 0.25]}
        fontSize={0.35}
        color={'#2E9DB5'}
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
              background: '#1C2E44',
              border: '2px solid #2E9DB5',
              borderRadius: '20px',
              padding: '32px',
              color: '#fff',
              fontFamily: "'Archivo', sans-serif",
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
                background: '#2E9DB5',
                border: 'none',
                color: '#fff',
                fontSize: '16px',
                cursor: 'pointer',
                lineHeight: 1,
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
                fontFamily: "'Archivo', sans-serif",
                color: '#ffffff',
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
                    fontFamily: "'Archivo', sans-serif",
                    fontWeight: 300,
                    color: 'rgba(255,255,255,0.75)',
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
                fontFamily: "'Archivo', sans-serif",
                color: '#2E9DB5',
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
function Scene({ mousePos, hasEnteredView }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const groupRef = useRef();

  /* auto-rotate when nothing hovered/selected */
  useFrame(() => {
    if (!groupRef.current) return;
    if (hoveredIndex !== null || selectedIndex !== null) return;
    groupRef.current.rotation.y += 0.001;
  });

  /* Mouse parallax - subtle tilt based on cursor position */
  useFrame(() => {
    if (!groupRef.current || selectedIndex !== null) return;
    const targetRotX = mousePos.current.y * 0.08;
    const targetRotZ = -mousePos.current.x * 0.04;
    groupRef.current.rotation.x += (targetRotX - groupRef.current.rotation.x) * 0.05;
    groupRef.current.rotation.z += (targetRotZ - groupRef.current.rotation.z) * 0.05;
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
        <ConnectionLines />
        {SERVICES.map((service, i) => (
          <HexPrism
            key={i}
            service={service}
            index={i}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            hasEnteredView={hasEnteredView}
          />
        ))}
      </group>
      <Environment preset="city" />
      <PostEffects />
    </>
  );
}

/* ── Main Export ── */
export default function ServicesSection() {
  const [isMobile, setIsMobile] = useState(false);
  const [hasEnteredView, setHasEnteredView] = useState(false);
  const sectionRef = useRef(null);
  const mousePosRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  /* Detect when section enters viewport for entrance animation */
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasEnteredView(true);
          obs.unobserve(el);
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const handlePointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mousePosRef.current = {
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    };
  };

  return (
    <section ref={sectionRef} style={{ background: '#0D1B2A', position: 'relative' }}>
      <SectionHeader
        label="OUR CONNECTED ECOSYSTEM"
        title="Everything Your Business Needs Connected."
        description="From brand to backend, from traffic to automation, our services work together as one scalable system."
        accentColor="#2E9DB5"
        dark
      />

      {/* 3D Canvas or Mobile Cards */}
      {isMobile ? (
        <MobileServiceCards variant="dark" />
      ) : (
        <div
          style={{ width: '100%', height: '100vh' }}
          onPointerMove={handlePointerMove}
        >
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            camera={{ position: [0, 0, 8], fov: 50 }}
            style={{ background: '#0D1B2A' }}
            onPointerMissed={() => {}}
          >
            <Suspense fallback={null}>
              <Scene mousePos={mousePosRef} hasEnteredView={hasEnteredView} />
            </Suspense>
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
