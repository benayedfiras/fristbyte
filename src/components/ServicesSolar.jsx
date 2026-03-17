import React, { useRef, useState, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Html, Billboard, Points, PointMaterial, Environment } from '@react-three/drei';
import * as THREE from 'three';
import PostEffects from './shared/PostEffects';
import gsap from 'gsap';
import { SERVICES } from '../data/services';

const ORBIT_CONFIG = [
  { radius: 2.5, speed: 0.008 },
  { radius: 3.2, speed: 0.006 },
  { radius: 4.0, speed: 0.005 },
  { radius: 4.8, speed: 0.004 },
  { radius: 5.6, speed: 0.003 },
  { radius: 6.4, speed: 0.002 },
];

/* ── Static star background ── */
function Stars({ count = 400 }) {
  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;
    }
    return arr;
  }, [count]);

  return (
    <Points positions={positions} stride={3} frustumCulled={false}>
      <PointMaterial
        transparent
        color="#ffffff"
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        opacity={0.6}
      />
    </Points>
  );
}

/* ── Camera setup ── */
function CameraRig() {
  const { camera } = useThree();
  useEffect(() => {
    camera.position.set(0, 8, 14);
    camera.lookAt(0, 0, 0);
  }, [camera]);
  return null;
}

/* ── Center sun sphere ── */
function Sun({ shrunk }) {
  const ref = useRef();

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.getElapsedTime() * 0.15;
    }
  });

  useEffect(() => {
    if (ref.current) {
      gsap.to(ref.current.scale, {
        x: shrunk ? 0.3 : 1,
        y: shrunk ? 0.3 : 1,
        z: shrunk ? 0.3 : 1,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  }, [shrunk]);

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial
        color="#ffffff"
        emissive="#ffffff"
        emissiveIntensity={3}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/* ── Orbit ring (dashed circle) ── */
function OrbitRing({ radius, color, opacity = 0.2 }) {
  const lineLoop = useMemo(() => {
    const points = [];
    const segments = 128;
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      points.push(
        new THREE.Vector3(
          Math.cos(angle) * radius,
          0,
          Math.sin(angle) * radius
        )
      );
    }
    const geo = new THREE.BufferGeometry().setFromPoints(points);
    const mat = new THREE.LineDashedMaterial({
      color,
      transparent: true,
      opacity,
      dashSize: 0.4,
      gapSize: 0.2,
    });
    const loop = new THREE.LineLoop(geo, mat);
    loop.computeLineDistances();
    return loop;
  }, [radius, color, opacity]);

  return <primitive object={lineLoop} />;
}

/* ── Single orbiting planet ── */
function Planet({
  service,
  index,
  config,
  selectedIndex,
  setSelectedIndex,
  hoveredIndex,
  setHoveredIndex,
}) {
  const groupRef = useRef();
  const meshRef = useRef();
  const angleRef = useRef((index / SERVICES.length) * Math.PI * 2);
  const lockOrbitRef = useRef(false);

  const isSelected = selectedIndex === index;
  const isOtherSelected = selectedIndex !== null && selectedIndex !== index;
  const isHovered = hoveredIndex === index;

  /* Orbit motion */
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    if (lockOrbitRef.current) return;
    if (isHovered) return;

    angleRef.current += config.speed;
    groupRef.current.position.x = Math.cos(angleRef.current) * config.radius;
    groupRef.current.position.z = Math.sin(angleRef.current) * config.radius;
    groupRef.current.position.y = 0;
  });

  /* Hover glow pulse */
  useFrame(({ clock }) => {
    if (isHovered && meshRef.current && !isSelected) {
      meshRef.current.material.emissiveIntensity =
        1.0 + Math.sin(clock.getElapsedTime() * 5) * 0.4;
    }
  });

  /* Hover scale */
  useEffect(() => {
    if (!meshRef.current || isSelected || isOtherSelected) return;
    gsap.to(meshRef.current.scale, {
      x: isHovered ? 1.4 : 1,
      y: isHovered ? 1.4 : 1,
      z: isHovered ? 1.4 : 1,
      duration: 0.3,
      ease: 'power2.out',
    });
    if (!isHovered) {
      gsap.to(meshRef.current.material, {
        emissiveIntensity: 0.6,
        duration: 0.3,
      });
    }
  }, [isHovered, isSelected, isOtherSelected]);

  /* Selection / deselection animations */
  useEffect(() => {
    if (!groupRef.current || !meshRef.current) return;
    const mat = meshRef.current.material;

    if (isSelected) {
      lockOrbitRef.current = true;
      gsap.to(groupRef.current.position, {
        x: 0,
        y: 0,
        z: 4,
        duration: 0.7,
        ease: 'power2.out',
      });
      gsap.to(meshRef.current.scale, {
        x: 1.6,
        y: 1.6,
        z: 1.6,
        duration: 0.7,
        ease: 'power2.out',
      });
      gsap.to(mat, { emissiveIntensity: 2, opacity: 1, duration: 0.7 });
    } else if (isOtherSelected) {
      gsap.to(mat, { opacity: 0.15, emissiveIntensity: 0.1, duration: 0.6 });
    } else {
      /* Returning from selected state */
      if (lockOrbitRef.current) {
        const targetX = Math.cos(angleRef.current) * config.radius;
        const targetZ = Math.sin(angleRef.current) * config.radius;
        gsap.to(groupRef.current.position, {
          x: targetX,
          y: 0,
          z: targetZ,
          duration: 0.7,
          ease: 'power2.out',
          onComplete: () => {
            lockOrbitRef.current = false;
          },
        });
        gsap.to(meshRef.current.scale, {
          x: 1,
          y: 1,
          z: 1,
          duration: 0.7,
          ease: 'power2.out',
        });
      }
      gsap.to(mat, { opacity: 1, emissiveIntensity: 0.6, duration: 0.6 });
    }
  }, [isSelected, isOtherSelected, config.radius]);

  const initX = Math.cos(angleRef.current) * config.radius;
  const initZ = Math.sin(angleRef.current) * config.radius;

  return (
    <group ref={groupRef} position={[initX, 0, initZ]}>
      <mesh
        ref={meshRef}
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
        <sphereGeometry args={[0.55, 32, 32]} />
        <meshStandardMaterial
          color={service.color}
          emissive={service.color}
          emissiveIntensity={3}
          toneMapped={false}
          transparent
          opacity={1}
        />
      </mesh>

      {/* Icon + name labels (billboard to face camera) */}
      <Billboard>
        <Text
          position={[0, 0.9, 0]}
          fontSize={0.35}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {service.icon}
        </Text>
        <Text
          position={[0, -0.9, 0]}
          fontSize={0.16}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
          maxWidth={2.2}
          textAlign="center"
        >
          {service.title}
        </Text>
      </Billboard>

      {/* Detail panel on click */}
      {isSelected && (
        <Html
          center
          position={[3, 0, 0]}
          distanceFactor={7}
          style={{ pointerEvents: 'auto', width: '360px' }}
        >
          <div
            style={{
              background: 'rgba(5, 10, 24, 0.95)',
              border: `1px solid ${service.color}`,
              borderRadius: '16px',
              padding: '28px',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              position: 'relative',
              backdropFilter: 'blur(12px)',
              animation: 'solarFadeIn 0.4s ease-out',
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
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {service.icon}
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '14px',
                fontFamily: "'Syne', sans-serif",
                color: service.color,
              }}
            >
              {service.title}
            </h3>
            <ul
              style={{
                listStyle: 'none',
                padding: 0,
                margin: '0 0 14px 0',
              }}
            >
              {service.bullets.map((b, i) => (
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
                color: service.color,
                fontSize: '13px',
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

/* ── Solar scene ── */
function SolarScene() {
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <>
      <CameraRig />
      <ambientLight intensity={0.3} />
      <pointLight position={[0, 0, 0]} intensity={2.0} color="#ffffff" />
      <Stars />
      <Sun shrunk={selectedIndex !== null} />
      {SERVICES.map((service, i) => (
        <React.Fragment key={i}>
          <OrbitRing
            radius={ORBIT_CONFIG[i].radius}
            color={service.color}
            opacity={selectedIndex !== null && selectedIndex !== i ? 0.05 : 0.2}
          />
          <Planet
            service={service}
            index={i}
            config={ORBIT_CONFIG[i]}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
          />
        </React.Fragment>
      ))}
      <Environment preset="city" />
      <PostEffects />
    </>
  );
}

/* ── Mobile fallback ── */
function MobileSolarCards() {
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
                style={{ padding: '3px 0', fontSize: '14px', opacity: 0.8 }}
              >
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
export default function ServicesSolar() {
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
            color: '#8B5CF6',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            fontFamily: "'DM Sans', sans-serif",
            marginBottom: '16px',
          }}
        >
          THE SOLAR SYSTEM
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
          Our Services Orbit Your Success
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
          Each service revolves around your core business — connected, balanced,
          and always in motion.
        </p>
      </div>

      {isMobile ? (
        <MobileSolarCards />
      ) : (
        <div style={{ width: '100%', height: '100vh' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            style={{ background: '#050A18' }}
            camera={{ position: [0, 8, 14], fov: 50 }}
            onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
          >
            <SolarScene />
          </Canvas>
        </div>
      )}

      <style>{`
        @keyframes solarFadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
