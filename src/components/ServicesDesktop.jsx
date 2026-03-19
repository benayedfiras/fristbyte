import React, { Suspense, useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, SoftShadows, Text } from '@react-three/drei';
import * as THREE from 'three';
import PostEffects from './shared/PostEffects';
import SectionHeader from './shared/SectionHeader';
import MobileServiceCards from './shared/MobileServiceCards';
import gsap from 'gsap';
import { SERVICES } from '../data/services';

/* Helper: outlined mesh pair (toon mesh + backside outline) */
function ToonMesh({ geometry, color, position, rotation, scale: s, castShadow = true, receiveShadow = false, outlineScale = 1.06 }) {
  return (
    <group position={position} rotation={rotation} scale={s}>
      <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
        {geometry}
        <meshToonMaterial color={color} />
      </mesh>
      <mesh scale={[outlineScale, outlineScale, outlineScale]}>
        {geometry}
        <meshBasicMaterial color="#222222" side={THREE.BackSide} />
      </mesh>
    </group>
  );
}

/* Short service name labels */
const SERVICE_SHORT_NAMES = [
  'Branding',
  'Web Dev',
  'AI & Auto',
  'Dashboards',
  'Marketing',
  'Infrastructure',
];

/* ─── 1. Pencil Cup (Branding) ─── */
function PencilCup({ serviceIndex, hoveredIndex, setHoveredIndex, selectedIndex, setSelectedIndex, penguinTarget }) {
  const groupRef = useRef();
  const baseY = 1;
  const pencilRefs = [useRef(), useRef(), useRef()];

  /* Idle bob */
  useFrame(({ clock }) => {
    if (!groupRef.current || selectedIndex !== null) return;
    groupRef.current.position.y = baseY + Math.sin(clock.getElapsedTime() * 1.1) * 0.04;
  });

  /* Idle pencil rotation */
  useFrame(({ clock }) => {
    pencilRefs.forEach((ref, i) => {
      if (ref.current) {
        ref.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5 + i * 2) * 0.03;
      }
    });
  });

  return (
    <InteractiveObject
      groupRef={groupRef}
      serviceIndex={serviceIndex}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
      selectedIndex={selectedIndex}
      setSelectedIndex={setSelectedIndex}
      position={[-2, baseY, -1]}
      baseY={baseY}
      penguinTarget={penguinTarget}
    >
      {/* Cup */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.3, 0.25, 0.6, 16]} />}
        color="#1A6B7C"
        position={[0, 0, 0]}
      />
      {/* Pencils */}
      {[
        { color: '#2E9DB5', x: -0.08, z: 0.05, ref: pencilRefs[0] },
        { color: '#EF4444', x: 0.1, z: -0.05, ref: pencilRefs[1] },
        { color: '#2E9DB5', x: 0, z: 0.1, ref: pencilRefs[2] },
      ].map((p, i) => (
        <group key={i} ref={p.ref}>
          <ToonMesh
            geometry={<cylinderGeometry args={[0.03, 0.03, 0.7, 8]} />}
            color={p.color}
            position={[p.x, 0.55, p.z]}
            rotation={[0, 0, (i - 1) * 0.12]}
          />
          {/* Pencil tip */}
          <ToonMesh
            geometry={<coneGeometry args={[0.03, 0.08, 8]} />}
            color="#F5E6D3"
            position={[p.x + (i - 1) * 0.005, 0.93, p.z]}
            rotation={[0, 0, (i - 1) * 0.12]}
            outlineScale={1.1}
          />
        </group>
      ))}
    </InteractiveObject>
  );
}

/* ─── 2. Monitor (Web Development) ─── */
function Monitor({ serviceIndex, hoveredIndex, setHoveredIndex, selectedIndex, setSelectedIndex, penguinTarget }) {
  const groupRef = useRef();
  const baseY = 1.2;
  const linesRef = useRef();

  /* Idle bob */
  useFrame(({ clock }) => {
    if (!groupRef.current || selectedIndex !== null) return;
    groupRef.current.position.y = baseY + Math.sin(clock.getElapsedTime() * 0.9 + 1) * 0.04;
  });

  /* Scroll lines upward */
  useFrame(({ clock }) => {
    if (linesRef.current) {
      linesRef.current.position.y = (clock.getElapsedTime() * 0.1) % 0.3;
    }
  });

  return (
    <InteractiveObject
      groupRef={groupRef}
      serviceIndex={serviceIndex}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
      selectedIndex={selectedIndex}
      setSelectedIndex={setSelectedIndex}
      position={[-0.5, baseY, 0]}
      baseY={baseY}
      penguinTarget={penguinTarget}
    >
      {/* Monitor body */}
      <ToonMesh
        geometry={<boxGeometry args={[1.1, 0.75, 0.08]} />}
        color="#2E9DB5"
        position={[0, 0.3, 0]}
      />
      {/* Screen (slightly inset, dark) */}
      <ToonMesh
        geometry={<boxGeometry args={[0.9, 0.55, 0.01]} />}
        color="#1a1a2e"
        position={[0, 0.32, 0.045]}
        outlineScale={1.0}
      />
      {/* Code lines on screen */}
      <group ref={linesRef} position={[0, 0.32, 0.055]}>
        {[
          { w: 0.5, c: '#1A6B7C', y: 0.15 },
          { w: 0.35, c: '#2E9DB5', y: 0.07 },
          { w: 0.6, c: '#2E9DB5', y: -0.01 },
          { w: 0.3, c: '#1A6B7C', y: -0.09 },
          { w: 0.45, c: '#2E9DB5', y: -0.17 },
        ].map((line, i) => (
          <mesh key={i} position={[-0.15 + line.w / 2 - 0.2, line.y, 0]}>
            <boxGeometry args={[line.w, 0.035, 0.001]} />
            <meshBasicMaterial color={line.c} />
          </mesh>
        ))}
      </group>
      {/* Stand neck */}
      <ToonMesh
        geometry={<boxGeometry args={[0.12, 0.25, 0.08]} />}
        color="#aaaaaa"
        position={[0, -0.15, 0]}
      />
      {/* Stand base */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.25, 0.25, 0.04, 16]} />}
        color="#999999"
        position={[0, -0.28, 0]}
      />
    </InteractiveObject>
  );
}

/* ─── 3. Robot (Automation & AI) ─── */
function Robot({ serviceIndex, hoveredIndex, setHoveredIndex, selectedIndex, setSelectedIndex, penguinTarget }) {
  const groupRef = useRef();
  const baseY = 1;
  const gearRef = useRef();

  /* Idle bob */
  useFrame(({ clock }) => {
    if (!groupRef.current || selectedIndex !== null) return;
    groupRef.current.position.y = baseY + Math.sin(clock.getElapsedTime() * 1.3 + 2) * 0.04;
  });

  /* Gear spin */
  useFrame(({ clock }) => {
    if (gearRef.current) {
      gearRef.current.rotation.z = clock.getElapsedTime() * 1.5;
    }
  });

  return (
    <InteractiveObject
      groupRef={groupRef}
      serviceIndex={serviceIndex}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
      selectedIndex={selectedIndex}
      setSelectedIndex={setSelectedIndex}
      position={[1.8, baseY, 0.5]}
      baseY={baseY}
      penguinTarget={penguinTarget}
    >
      {/* Body */}
      <ToonMesh
        geometry={<boxGeometry args={[0.55, 0.5, 0.4]} />}
        color="#1A6B7C"
        position={[0, 0, 0]}
      />
      {/* Head */}
      <ToonMesh
        geometry={<sphereGeometry args={[0.22, 16, 16]} />}
        color="#2E9DB5"
        position={[0, 0.42, 0]}
      />
      {/* Eyes */}
      <mesh position={[-0.07, 0.44, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.07, 0.44, 0.18]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.07, 0.44, 0.215]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#222222" />
      </mesh>
      <mesh position={[0.07, 0.44, 0.215]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshBasicMaterial color="#222222" />
      </mesh>
      {/* Antenna */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.015, 0.015, 0.2, 8]} />}
        color="#666666"
        position={[0, 0.72, 0]}
      />
      <ToonMesh
        geometry={<sphereGeometry args={[0.04, 8, 8]} />}
        color="#EF4444"
        position={[0, 0.84, 0]}
      />
      {/* Gear on side */}
      <group ref={gearRef} position={[0.34, 0.05, 0]}>
        <mesh>
          <torusGeometry args={[0.1, 0.03, 8, 12]} />
          <meshToonMaterial color="#2E9DB5" />
        </mesh>
      </group>
      {/* Arms */}
      <ToonMesh
        geometry={<boxGeometry args={[0.12, 0.35, 0.1]} />}
        color="#1A6B7C"
        position={[-0.38, -0.05, 0]}
        rotation={[0, 0, 0.15]}
      />
      <ToonMesh
        geometry={<boxGeometry args={[0.12, 0.35, 0.1]} />}
        color="#1A6B7C"
        position={[0.38, -0.05, 0]}
        rotation={[0, 0, -0.15]}
      />
    </InteractiveObject>
  );
}

/* ─── 4. Book Stack (Data Dashboards) ─── */
function BookStack({ serviceIndex, hoveredIndex, setHoveredIndex, selectedIndex, setSelectedIndex, penguinTarget }) {
  const groupRef = useRef();
  const baseY = 2.8;

  useFrame(({ clock }) => {
    if (!groupRef.current || selectedIndex !== null) return;
    groupRef.current.position.y = baseY + Math.sin(clock.getElapsedTime() * 0.7 + 3) * 0.04;
  });

  const books = [
    { color: '#2E9DB5', h: 0.14, w: 0.6 },
    { color: '#1A6B7C', h: 0.12, w: 0.55 },
    { color: '#2E9DB5', h: 0.16, w: 0.58 },
    { color: '#1A6B7C', h: 0.11, w: 0.52 },
  ];

  let stackY = 0;

  return (
    <InteractiveObject
      groupRef={groupRef}
      serviceIndex={serviceIndex}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
      selectedIndex={selectedIndex}
      setSelectedIndex={setSelectedIndex}
      position={[-2.5, baseY, -2]}
      baseY={baseY}
      penguinTarget={penguinTarget}
    >
      {books.map((book, i) => {
        const y = stackY + book.h / 2;
        stackY += book.h;
        return (
          <ToonMesh
            key={i}
            geometry={<boxGeometry args={[book.w, book.h, 0.35]} />}
            color={book.color}
            position={[(i % 2 === 0 ? 0 : 0.04), y, 0]}
            rotation={[0, (i % 2 === 0 ? 0 : 0.06), 0]}
          />
        );
      })}
      {/* Shelf bracket */}
      <ToonMesh
        geometry={<boxGeometry args={[0.8, 0.04, 0.4]} />}
        color="#D4A574"
        position={[0, -0.02, 0]}
      />
    </InteractiveObject>
  );
}

/* ─── 5. Potted Plant (Growth & Marketing) ─── */
function PottedPlant({ serviceIndex, hoveredIndex, setHoveredIndex, selectedIndex, setSelectedIndex, penguinTarget }) {
  const groupRef = useRef();
  const baseY = 0.5;

  /* Gentle sway */
  useFrame(({ clock }) => {
    if (!groupRef.current || selectedIndex !== null) return;
    groupRef.current.position.y = baseY + Math.sin(clock.getElapsedTime() * 0.8 + 4) * 0.04;
    groupRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.6) * 0.035;
  });

  return (
    <InteractiveObject
      groupRef={groupRef}
      serviceIndex={serviceIndex}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
      selectedIndex={selectedIndex}
      setSelectedIndex={setSelectedIndex}
      position={[3, baseY, 1.5]}
      baseY={baseY}
      penguinTarget={penguinTarget}
    >
      {/* Pot */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.22, 0.18, 0.35, 16]} />}
        color="#2E9DB5"
        position={[0, 0, 0]}
      />
      {/* Pot rim */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.25, 0.25, 0.05, 16]} />}
        color="#1A6B7C"
        position={[0, 0.18, 0]}
      />
      {/* Soil */}
      <ToonMesh
        geometry={<sphereGeometry args={[0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />}
        color="#5a3825"
        position={[0, 0.17, 0]}
        outlineScale={1.0}
      />
      {/* Stem */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.025, 0.025, 0.5, 8]} />}
        color="#22c55e"
        position={[0, 0.47, 0]}
      />
      {/* Flower blooms */}
      {[
        { x: 0, y: 0.78, z: 0, c: '#2E9DB5', s: 0.1 },
        { x: -0.12, y: 0.65, z: 0.05, c: '#2E9DB5', s: 0.07 },
        { x: 0.1, y: 0.7, z: -0.05, c: '#2E9DB5', s: 0.08 },
      ].map((f, i) => (
        <ToonMesh
          key={i}
          geometry={<sphereGeometry args={[f.s, 12, 12]} />}
          color={f.c}
          position={[f.x, f.y, f.z]}
        />
      ))}
      {/* Leaves (flat ellipses) */}
      {[
        { x: -0.15, y: 0.45, rz: 0.6 },
        { x: 0.14, y: 0.5, rz: -0.5 },
      ].map((l, i) => (
        <ToonMesh
          key={`leaf${i}`}
          geometry={<sphereGeometry args={[0.08, 12, 6]} />}
          color="#22c55e"
          position={[l.x, l.y, 0]}
          scale={[1, 0.4, 1]}
          rotation={[0, 0, l.rz]}
        />
      ))}
    </InteractiveObject>
  );
}

/* ─── 6. Bulletin Board (Infrastructure) ─── */
function BulletinBoard({ serviceIndex, hoveredIndex, setHoveredIndex, selectedIndex, setSelectedIndex, penguinTarget }) {
  const groupRef = useRef();
  const baseY = 2.5;

  useFrame(({ clock }) => {
    if (!groupRef.current || selectedIndex !== null) return;
    groupRef.current.position.y = baseY + Math.sin(clock.getElapsedTime() * 1.0 + 5) * 0.04;
  });

  const notes = [
    { x: -0.2, y: 0.15, c: '#2E9DB5', pin: '#EF4444' },
    { x: 0.2, y: 0.12, c: '#2E9DB5', pin: '#2E9DB5' },
    { x: -0.15, y: -0.15, c: '#2E9DB5', pin: '#1A6B7C' },
    { x: 0.18, y: -0.12, c: '#EF4444', pin: '#2E9DB5' },
  ];

  return (
    <InteractiveObject
      groupRef={groupRef}
      serviceIndex={serviceIndex}
      hoveredIndex={hoveredIndex}
      setHoveredIndex={setHoveredIndex}
      selectedIndex={selectedIndex}
      setSelectedIndex={setSelectedIndex}
      position={[0, baseY, -2.5]}
      baseY={baseY}
      penguinTarget={penguinTarget}
    >
      {/* Board frame */}
      <ToonMesh
        geometry={<boxGeometry args={[0.9, 0.7, 0.06]} />}
        color="#D4A574"
        position={[0, 0, 0]}
      />
      {/* Cork surface */}
      <ToonMesh
        geometry={<boxGeometry args={[0.8, 0.6, 0.01]} />}
        color="#c4956a"
        position={[0, 0, 0.035]}
        outlineScale={1.0}
      />
      {/* Sticky notes + pins */}
      {notes.map((n, i) => (
        <group key={i}>
          <ToonMesh
            geometry={<boxGeometry args={[0.2, 0.18, 0.005]} />}
            color={n.c}
            position={[n.x, n.y, 0.05]}
            rotation={[0, 0, (i % 2 === 0 ? 0.05 : -0.08)]}
            outlineScale={1.0}
          />
          {/* Pin */}
          <mesh position={[n.x, n.y + 0.07, 0.06]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshToonMaterial color={n.pin} />
          </mesh>
        </group>
      ))}
    </InteractiveObject>
  );
}

/* ─── Soft glow disc under hovered/selected objects ─── */
function GlowDisc({ color, visible }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) {
      const pulse = 0.3 + Math.sin(clock.getElapsedTime() * 3) * 0.1;
      ref.current.material.opacity = visible ? pulse : 0;
    }
  });
  return (
    <mesh ref={ref} position={[0, -0.35, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[0.55, 32]} />
      <meshBasicMaterial color={color} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/* ─── Interactive wrapper for each service object ─── */
function InteractiveObject({
  children,
  groupRef,
  serviceIndex,
  hoveredIndex,
  setHoveredIndex,
  selectedIndex,
  setSelectedIndex,
  position,
  baseY,
  penguinTarget,
}) {
  const isHovered = hoveredIndex === serviceIndex;
  const isSelected = selectedIndex === serviceIndex;
  const isOtherSelected = selectedIndex !== null && selectedIndex !== serviceIndex;
  const ringRef = useRef();
  const opacityRef = useRef();
  const service = SERVICES[serviceIndex];

  /* Notify penguin about hovered/selected target */
  useEffect(() => {
    if (isHovered || isSelected) {
      penguinTarget.current = { x: position[0], y: position[1], z: position[2] };
    } else if (hoveredIndex === null && selectedIndex === null) {
      penguinTarget.current = null;
    }
  }, [isHovered, isSelected, hoveredIndex, selectedIndex, position, penguinTarget]);

  /* Gentle hover scale with smooth bounce */
  useEffect(() => {
    if (!groupRef.current || isSelected) return;
    if (isHovered) {
      gsap.to(groupRef.current.scale, {
        x: 1.15, y: 1.15, z: 1.15,
        duration: 0.4,
        ease: 'elastic.out(1, 0.5)',
      });
    } else if (!isOtherSelected) {
      gsap.to(groupRef.current.scale, {
        x: 1, y: 1, z: 1, duration: 0.3, ease: 'power2.out',
      });
    }
  }, [isHovered, groupRef, isSelected, isOtherSelected]);

  /* Other-selected: slightly dim via scale (keep visible, not aggressive shrink) */
  useEffect(() => {
    if (!groupRef.current) return;
    if (isOtherSelected) {
      gsap.to(groupRef.current.scale, {
        x: 0.9, y: 0.9, z: 0.9, duration: 0.5, ease: 'power2.out',
      });
      /* Dim opacity on the group wrapper */
      if (opacityRef.current) {
        gsap.to(opacityRef.current, {
          opacity: 0.45, duration: 0.5, ease: 'power2.out',
        });
      }
    } else if (!isSelected && selectedIndex === null) {
      gsap.to(groupRef.current.scale, {
        x: 1, y: 1, z: 1, duration: 0.5, ease: 'power2.out',
      });
      if (opacityRef.current) {
        gsap.to(opacityRef.current, {
          opacity: 1, duration: 0.5, ease: 'power2.out',
        });
      }
    }
  }, [isOtherSelected, isSelected, selectedIndex, groupRef]);

  /* Selected: smooth center and show panel */
  useEffect(() => {
    if (!groupRef.current) return;
    if (isSelected) {
      /* Smooth scale up */
      gsap.to(groupRef.current.scale, {
        x: 1.1, y: 1.1, z: 1.1, duration: 0.5, ease: 'elastic.out(1, 0.7)',
      });
      /* Move smoothly toward camera center */
      gsap.to(groupRef.current.position, {
        y: baseY + 0.6,
        z: position[2] + 0.8,
        duration: 0.6,
        ease: 'power3.out',
      });
    } else if (selectedIndex === null) {
      /* Return to rest position */
      gsap.to(groupRef.current.position, {
        x: position[0], y: baseY, z: position[2],
        duration: 0.5,
        ease: 'power2.out',
      });
      gsap.to(groupRef.current.scale, {
        x: 1, y: 1, z: 1, duration: 0.4, ease: 'power2.out',
      });
    }
  }, [isSelected, selectedIndex, groupRef, baseY, position]);

  /* Dim non-selected objects by traversing meshes */
  useFrame(() => {
    if (!groupRef.current) return;
    groupRef.current.traverse((child) => {
      if (child.isMesh && child.material && 'opacity' in child.material) {
        if (child.material.transparent) {
          // Skip already transparent materials like glow/ring
          return;
        }
      }
    });
  });

  /* Hover ring pulse */
  useFrame(({ clock }) => {
    if (ringRef.current) {
      ringRef.current.visible = isHovered && !isSelected;
      if (isHovered) {
        const s = 1 + Math.sin(clock.getElapsedTime() * 4) * 0.15;
        ringRef.current.scale.set(s, s, s);
      }
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <group
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredIndex(serviceIndex);
          document.body.style.cursor = 'pointer';
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHoveredIndex(null);
          document.body.style.cursor = 'auto';
        }}
        onClick={(e) => {
          e.stopPropagation();
          /* BUG FIX: Allow clicking another object while one is selected,
             or clicking the same selected object to deselect */
          if (isSelected) {
            setSelectedIndex(null);
          } else {
            setSelectedIndex(serviceIndex);
          }
          setHoveredIndex(null);
          document.body.style.cursor = 'auto';
        }}
      >
        {children}
      </group>

      {/* Floating name label (always visible) */}
      <Text
        position={[0, 1.1, 0]}
        fontSize={0.12}
        color={service.color}
        anchorX="center"
        anchorY="bottom"
        font={undefined}
        outlineWidth={0.008}
        outlineColor="#ffffff"
      >
        {SERVICE_SHORT_NAMES[serviceIndex]}
      </Text>

      {/* Soft colored glow underneath on hover */}
      <GlowDisc color={service.color} visible={isHovered || isSelected} />

      {/* Hover glow ring */}
      <mesh ref={ringRef} position={[0, -0.3, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <torusGeometry args={[0.5, 0.04, 8, 32]} />
        <meshBasicMaterial color={service.color} transparent opacity={0.6} />
      </mesh>

      {/* Service detail panel - slides in from side */}
      {isSelected && (
        <Html
          center
          position={[2.2, 0.5, 0]}
          distanceFactor={5}
          style={{ pointerEvents: 'auto', width: '340px' }}
        >
          <div style={{
            background: '#ffffff',
            border: '3px solid #2E9DB5',
            borderRadius: '20px',
            padding: '24px 24px 20px',
            color: '#222',
            fontFamily: "'Archivo', sans-serif",
            position: 'relative',
            boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
            animation: 'deskSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          }}>
            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSelectedIndex(null);
                document.body.style.cursor = 'auto';
              }}
              style={{
                position: 'absolute',
                top: '8px',
                right: '12px',
                background: '#2E9DB5',
                border: 'none',
                color: '#fff',
                width: '28px',
                height: '28px',
                borderRadius: '50%',
                fontSize: '16px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                lineHeight: 1,
              }}
            >
              ✕
            </button>
            <div style={{ fontSize: '36px', marginBottom: '6px' }}>{service.icon}</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: 700,
              marginBottom: '12px',
              fontFamily: "'Archivo', sans-serif",
              color: '#2E9DB5',
            }}>
              {service.title}
            </h3>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px 0' }}>
              {service.bullets.map((b, i) => (
                <li key={i} style={{
                  padding: '4px 0',
                  fontSize: '13px',
                  color: '#444',
                  borderBottom: '1px solid #f0f0f0',
                }}>
                  — {b}
                </li>
              ))}
            </ul>
            <p style={{
              fontStyle: 'italic',
              color: '#2E9DB5',
              fontSize: '13px',
              fontWeight: 600,
            }}>
              {service.tagline}
            </p>
          </div>
        </Html>
      )}
    </group>
  );
}

/* ─── Desk ─── */
function Desk() {
  const topY = 0.75;
  const legH = 0.7;
  const legR = 0.04;
  const legs = [
    [-1.3, legH / 2, -0.5],
    [1.3, legH / 2, -0.5],
    [-1.3, legH / 2, 0.5],
    [1.3, legH / 2, 0.5],
  ];

  return (
    <group>
      {/* Desktop surface */}
      <ToonMesh
        geometry={<boxGeometry args={[3, 0.08, 1.4]} />}
        color="#ffffff"
        position={[0, topY, 0]}
        receiveShadow
      />
      {/* Desk legs */}
      {legs.map((pos, i) => (
        <ToonMesh
          key={i}
          geometry={<cylinderGeometry args={[legR, legR, legH, 8]} />}
          color="#D4A574"
          position={pos}
        />
      ))}
    </group>
  );
}

/* ─── Chair ─── */
function Chair() {
  return (
    <group position={[0, 0, 2.2]}>
      {/* Seat */}
      <ToonMesh
        geometry={<boxGeometry args={[0.7, 0.06, 0.6]} />}
        color="#f5f5f5"
        position={[0, 0.55, 0]}
      />
      {/* Back */}
      <ToonMesh
        geometry={<boxGeometry args={[0.7, 0.65, 0.06]} />}
        color="#e8e8e8"
        position={[0, 0.92, -0.28]}
      />
      {/* Stem */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.04, 0.04, 0.35, 8]} />}
        color="#888888"
        position={[0, 0.34, 0]}
      />
      {/* Cross base legs */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
        <ToonMesh
          key={i}
          geometry={<boxGeometry args={[0.04, 0.03, 0.45]} />}
          color="#888888"
          position={[
            Math.sin(rot) * 0.2,
            0.14,
            Math.cos(rot) * 0.2,
          ]}
          rotation={[0, rot, 0]}
        />
      ))}
      {/* Wheels (small spheres) */}
      {[0, Math.PI / 2, Math.PI, Math.PI * 1.5].map((rot, i) => (
        <mesh
          key={`w${i}`}
          position={[
            Math.sin(rot) * 0.38,
            0.06,
            Math.cos(rot) * 0.38,
          ]}
        >
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshToonMaterial color="#555555" />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Penguin (reacts to hovered/selected objects) ─── */
function Penguin({ penguinTarget }) {
  const groupRef = useRef();
  const penguinPos = useMemo(() => new THREE.Vector3(1, 1.05, -0.3), []);

  useFrame(({ clock }) => {
    if (!groupRef.current) return;

    if (penguinTarget.current) {
      /* Look toward the hovered/selected object */
      const target = penguinTarget.current;
      const dx = target.x - penguinPos.x;
      const dz = target.z - penguinPos.z;
      const targetAngle = Math.atan2(dx, dz);
      /* Smoothly lerp toward target angle */
      const current = groupRef.current.rotation.y;
      groupRef.current.rotation.y += (targetAngle - current) * 0.08;
    } else {
      /* Default idle look-around */
      const idleAngle = Math.sin(clock.getElapsedTime() * 1.2) * 0.2;
      const current = groupRef.current.rotation.y;
      groupRef.current.rotation.y += (idleAngle - current) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={[penguinPos.x, penguinPos.y, penguinPos.z]}>
      {/* Body */}
      <ToonMesh
        geometry={<sphereGeometry args={[0.12, 12, 12]} />}
        color="#1a1a1a"
        position={[0, 0, 0]}
        scale={[1, 1.3, 0.9]}
      />
      {/* Belly */}
      <mesh position={[0, -0.01, 0.08]} scale={[0.7, 1, 0.5]}>
        <sphereGeometry args={[0.11, 12, 12]} />
        <meshToonMaterial color="#ffffff" />
      </mesh>
      {/* Head */}
      <ToonMesh
        geometry={<sphereGeometry args={[0.08, 12, 12]} />}
        color="#1a1a1a"
        position={[0, 0.18, 0]}
      />
      {/* Eyes */}
      <mesh position={[-0.03, 0.2, 0.065]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      <mesh position={[0.03, 0.2, 0.065]}>
        <sphereGeometry args={[0.015, 8, 8]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Beak */}
      <mesh position={[0, 0.17, 0.08]}>
        <coneGeometry args={[0.02, 0.04, 6]} />
        <meshToonMaterial color="#F59E0B" />
      </mesh>
    </group>
  );
}

/* ─── Wall Frame with mountain scene ─── */
function WallFrame() {
  return (
    <group position={[2.2, 2.4, -2.45]}>
      {/* Frame */}
      <ToonMesh
        geometry={<boxGeometry args={[0.9, 0.65, 0.04]} />}
        color="#B8D4E8"
        position={[0, 0, 0]}
      />
      {/* Canvas/backing */}
      <mesh position={[0, 0, 0.021]}>
        <boxGeometry args={[0.75, 0.5, 0.005]} />
        <meshToonMaterial color="#e0f0ff" />
      </mesh>
      {/* Mountains */}
      <mesh position={[-0.15, -0.1, 0.03]}>
        <coneGeometry args={[0.2, 0.3, 4]} />
        <meshToonMaterial color="#6b9080" />
      </mesh>
      <mesh position={[0.12, -0.05, 0.03]}>
        <coneGeometry args={[0.15, 0.22, 4]} />
        <meshToonMaterial color="#7cc09e" />
      </mesh>
      {/* Sun */}
      <mesh position={[0.2, 0.12, 0.03]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshToonMaterial color="#2E9DB5" />
      </mesh>
    </group>
  );
}

/* ─── Floor with rug ─── */
function Floor() {
  return (
    <group>
      {/* Floor plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 12]} />
        <meshToonMaterial color="#f5e6d0" />
      </mesh>
      {/* Rug stripes */}
      {[-0.6, -0.2, 0.2, 0.6].map((z, i) => (
        <mesh
          key={i}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0.005, z]}
        >
          <planeGeometry args={[3.5, 0.25]} />
          <meshToonMaterial
            color={i % 2 === 0 ? '#2E9DB5' : '#ffffff'}
            transparent
            opacity={i % 2 === 0 ? 0.25 : 0.2}
          />
        </mesh>
      ))}
    </group>
  );
}

/* ─── Walls ─── */
function Walls() {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 3, -2.5]}>
        <planeGeometry args={[12, 6]} />
        <meshToonMaterial color="#FFF5E6" />
      </mesh>
      {/* Side wall */}
      <mesh position={[-4, 3, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[12, 6]} />
        <meshToonMaterial color="#FFF0DD" />
      </mesh>
    </group>
  );
}

/* ─── Desk Lamp ─── */
function DeskLamp() {
  const lightRef = useRef();
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.8 + Math.sin(clock.getElapsedTime() * 0.5) * 0.1;
    }
  });
  return (
    <group position={[-1.8, 0.82, -0.4]}>
      {/* Base */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.12, 0.15, 0.04, 12]} />}
        color="#333333"
        position={[0, 0, 0]}
      />
      {/* Arm */}
      <ToonMesh
        geometry={<cylinderGeometry args={[0.015, 0.015, 0.6, 8]} />}
        color="#555555"
        position={[0, 0.32, 0]}
        rotation={[0.15, 0, 0]}
      />
      {/* Shade */}
      <ToonMesh
        geometry={<coneGeometry args={[0.12, 0.15, 12, 1, true]} />}
        color="#1A6B7C"
        position={[0, 0.62, -0.05]}
        rotation={[0.2, 0, 0]}
      />
      {/* Light glow */}
      <pointLight ref={lightRef} position={[0, 0.55, -0.05]} color="#ffd6a5" intensity={0.8} distance={3} />
    </group>
  );
}

/* ─── Floating Dust ─── */
function FloatingDust() {
  const count = 20;
  const data = React.useMemo(() => {
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 6,
        y: Math.random() * 4 + 0.5,
        z: (Math.random() - 0.5) * 6,
        speed: 0.05 + Math.random() * 0.15,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  return (
    <>
      {data.map((d, i) => (
        <FloatingDustMote key={i} config={d} />
      ))}
    </>
  );
}

function FloatingDustMote({ config }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (!ref.current) return;
    const t = clock.getElapsedTime() * config.speed + config.offset;
    ref.current.position.x = config.x + Math.sin(t) * 0.4;
    ref.current.position.y = config.y + Math.sin(t * 0.7) * 0.3;
    ref.current.position.z = config.z + Math.cos(t * 0.5) * 0.3;
    ref.current.material.opacity = 0.12 + Math.sin(t * 2) * 0.08;
  });
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.01, 6, 6]} />
      <meshBasicMaterial color="#ffd6a5" transparent opacity={0.12} />
    </mesh>
  );
}

/* ─── Subtle ambient scene rotation ─── */
function SceneRotator({ children }) {
  const groupRef = useRef();
  useFrame(({ clock }) => {
    if (groupRef.current) {
      /* Very slow, subtle rotation around Y axis */
      groupRef.current.rotation.y = Math.sin(clock.getElapsedTime() * 0.1) * 0.03;
    }
  });
  return <group ref={groupRef}>{children}</group>;
}

/* ─── Main export ─── */
export default function ServicesDesktop() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  return (
    <section style={{ background: '#FFF5E6', position: 'relative' }}>
      <SectionHeader
        label="OUR CONNECTED ECOSYSTEM"
        title="Everything Your Business Needs Connected."
        description="From brand to backend, from traffic to automation, our services work together as one scalable system."
        accentColor="#2E9DB5"
        dark={false}
      />

      {isMobile ? (
        <MobileServiceCards variant="light" />
      ) : (
        <div style={{ width: '100%', height: '100vh' }}>
          <Canvas
            shadows
            dpr={[1, 2]}
            gl={{ powerPreference: 'high-performance', antialias: false, toneMapping: THREE.ACESFilmicToneMapping }}
            camera={{ position: [6, 5, 8], fov: 40 }}
            onCreated={({ camera }) => camera.lookAt(0, 1, 0)}
            style={{ background: '#FFF5E6' }}
          >
            <Suspense fallback={null}>
              <DesktopSceneInner />
            </Suspense>
          </Canvas>
        </div>
      )}

      <style>{`
        @keyframes deskFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes deskSlideIn {
          from { opacity: 0; transform: translateX(30px) scale(0.95); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
      `}</style>
    </section>
  );
}

/* ─── Scene (rendered inside Canvas) ─── */
function DesktopSceneInner() {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const penguinTarget = useRef(null);

  const serviceObjects = [PencilCup, Monitor, Robot, BookStack, PottedPlant, BulletinBoard];

  return (
    <group
      onPointerMissed={(e) => {
        /* BUG FIX: clicking empty 3D space deselects */
        if (selectedIndex !== null) {
          setSelectedIndex(null);
          setHoveredIndex(null);
          document.body.style.cursor = 'auto';
        }
      }}
    >
      <ambientLight intensity={0.8} color="#FFF5E6" />
      <directionalLight
        position={[5, 8, 5]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={20}
        shadow-camera-left={-6}
        shadow-camera-right={6}
        shadow-camera-top={6}
        shadow-camera-bottom={-6}
      />
      <pointLight position={[-3, 4, 2]} intensity={0.3} color="#ffd6a5" />

      <SceneRotator>
        <Floor />
        <Walls />
        <Desk />
        <Chair />
        <Penguin penguinTarget={penguinTarget} />
        <WallFrame />

        {serviceObjects.map((ObjectComponent, i) => (
          <ObjectComponent
            key={i}
            serviceIndex={i}
            hoveredIndex={hoveredIndex}
            setHoveredIndex={setHoveredIndex}
            selectedIndex={selectedIndex}
            setSelectedIndex={setSelectedIndex}
            penguinTarget={penguinTarget}
          />
        ))}

        {/* Desk lamp */}
        <DeskLamp />

        {/* Floating dust particles */}
        <FloatingDust />
      </SceneRotator>

      <SoftShadows size={25} samples={16} focus={0.5} />
      <PostEffects />
    </group>
  );
}
