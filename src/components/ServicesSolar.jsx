import React, { useRef, useState, useMemo, useEffect, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Text, Html, Billboard, Environment } from '@react-three/drei';
import * as THREE from 'three';
import PostEffects from './shared/PostEffects';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';
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

/* ── Twinkling star background ── */
function Stars({ count = 400 }) {
  const ref = useRef();
  const { positions, sizes, phases } = useMemo(() => {
    const posArr = new Float32Array(count * 3);
    const sizeArr = new Float32Array(count);
    const phaseArr = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      posArr[i * 3] = (Math.random() - 0.5) * 40;
      posArr[i * 3 + 1] = (Math.random() - 0.5) * 40;
      posArr[i * 3 + 2] = (Math.random() - 0.5) * 20 - 10;
      sizeArr[i] = 0.03 + Math.random() * 0.04;
      phaseArr[i] = Math.random() * Math.PI * 2;
    }
    return { positions: posArr, sizes: sizeArr, phases: phaseArr };
  }, [count]);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime();
    const sizeAttr = ref.current.geometry.attributes.size;
    if (!sizeAttr) return;
    for (let i = 0; i < count; i++) {
      const twinkle = 0.4 + Math.sin(t * (1.5 + (i % 7) * 0.3) + phases[i]) * 0.6;
      sizeAttr.array[i] = sizes[i] * Math.max(0.2, twinkle);
    }
    sizeAttr.needsUpdate = true;
  });

  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" array={positions} count={count} itemSize={3} />
        <bufferAttribute attach="attributes-size" array={new Float32Array(sizes)} count={count} itemSize={1} />
      </bufferGeometry>
      <pointsMaterial
        transparent
        color="#ffffff"
        size={0.05}
        sizeAttenuation
        depthWrite={false}
        opacity={0.7}
      />
    </points>
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

/* ── Center sun sphere with breathing ── */
function Sun({ shrunk }) {
  const ref = useRef();
  const matRef = useRef();
  const baseScale = useRef(1);

  useFrame(({ clock }) => {
    if (!ref.current) return;
    ref.current.rotation.y = clock.getElapsedTime() * 0.15;
    // Breathing pulse (subtle scale oscillation)
    if (!shrunk) {
      const breathe = 1 + Math.sin(clock.getElapsedTime() * 1.2) * 0.04;
      ref.current.scale.setScalar(baseScale.current * breathe);
    }
    // Emissive pulse on sun
    if (matRef.current) {
      matRef.current.emissiveIntensity = 0.4 + Math.sin(clock.getElapsedTime() * 1.8) * 0.2;
    }
  });

  useEffect(() => {
    if (ref.current) {
      const target = shrunk ? 0.3 : 1;
      baseScale.current = target;
      gsap.to(ref.current.scale, {
        x: target,
        y: target,
        z: target,
        duration: 0.6,
        ease: 'power2.out',
      });
    }
  }, [shrunk]);

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.8, 32, 32]} />
      <meshStandardMaterial
        ref={matRef}
        color="#2E9DB5"
        emissive="#2E9DB5"
        emissiveIntensity={0.4}
        toneMapped={false}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

/* ── Orbit ring (dashed circle) with subtle glow ── */
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

  /* Second wider ring for glow effect */
  const glowRing = useMemo(() => {
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
    const mat = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity: opacity * 0.3,
      linewidth: 1,
    });
    return new THREE.LineLoop(geo, mat);
  }, [radius, color, opacity]);

  return (
    <>
      <primitive object={lineLoop} />
      <primitive object={glowRing} />
    </>
  );
}

/* ── Comet trail behind planet ── */
function CometTrail({ color, groupRef, trailLength = 20 }) {
  const lineRef = useRef();
  const positionsRef = useRef([]);

  useFrame(() => {
    if (!groupRef.current || !lineRef.current) return;
    const wp = new THREE.Vector3();
    groupRef.current.getWorldPosition(wp);
    positionsRef.current.unshift(wp.clone());
    if (positionsRef.current.length > trailLength) positionsRef.current.pop();

    if (positionsRef.current.length < 2) return;
    const arr = new Float32Array(positionsRef.current.length * 3);
    positionsRef.current.forEach((p, i) => {
      arr[i * 3] = p.x;
      arr[i * 3 + 1] = p.y;
      arr[i * 3 + 2] = p.z;
    });
    lineRef.current.geometry.setAttribute(
      'position',
      new THREE.BufferAttribute(arr, 3)
    );
    lineRef.current.geometry.setDrawRange(0, positionsRef.current.length);
    // Fade trail material
    lineRef.current.material.opacity = 0.3;
  });

  return (
    <line ref={lineRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          array={new Float32Array(trailLength * 3)}
          count={trailLength}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.3} depthWrite={false} />
    </line>
  );
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
        1.8 + Math.sin(clock.getElapsedTime() * 5) * 0.4;
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
        emissiveIntensity: 0.4,
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
      gsap.to(mat, { emissiveIntensity: 3.0, opacity: 1, duration: 0.7 });
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
      gsap.to(mat, { opacity: 1, emissiveIntensity: 0.4, duration: 0.6 });
    }
  }, [isSelected, isOtherSelected, config.radius]);

  const initX = Math.cos(angleRef.current) * config.radius;
  const initZ = Math.sin(angleRef.current) * config.radius;

  return (
    <>
    <CometTrail color={service.color} groupRef={groupRef} trailLength={24} />
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
          color={'#1A6B7C'}
          emissive={'#2E9DB5'}
          emissiveIntensity={0.4}
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
              background: 'rgba(13,27,42,0.92)',
              border: `1.5px solid ${service.color}44`,
              borderRadius: '20px',
              padding: '28px',
              color: '#fff',
              fontFamily: "'Archivo', sans-serif",
              position: 'relative',
              backdropFilter: 'blur(12px)',
              boxShadow: `0 24px 48px rgba(0,0,0,0.4), 0 0 0 1px ${service.color}22, inset 0 1px 0 rgba(255,255,255,0.05)`,
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
                background: service.color,
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
            <div style={{ fontSize: '36px', marginBottom: '8px' }}>
              {service.icon}
            </div>
            <h3
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '14px',
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
                margin: '0 0 14px 0',
              }}
            >
              {service.bullets.map((b, i) => (
                <li
                  key={i}
                  style={{
                    padding: '4px 0',
                    fontSize: '13px',
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
    </>
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
            color={SERVICES[i].color}
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
    <section style={{ background: 'linear-gradient(180deg, #0D1B2A 0%, #0A1628 50%, #0D1B2A 100%)', position: 'relative' }}>
      <SectionHeader
        label="THE SOLAR SYSTEM"
        title="Our Services Orbit Your Success"
        description="Each service revolves around your core business — connected, balanced, and always in motion."
        accentColor="#2E9DB5"
        dark
      />

      {isMobile ? (
        <MobileServiceCards variant="dark" />
      ) : (
        <div style={{ width: '100%', height: '100vh' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            style={{ background: '#0D1B2A' }}
            camera={{ position: [0, 8, 14], fov: 50 }}
            onCreated={({ camera }) => camera.lookAt(0, 0, 0)}
          >
            <Suspense fallback={null}>
              <SolarScene />
            </Suspense>
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
