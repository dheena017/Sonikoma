import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, Sparkles, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

interface ThemeProps {
  isLight: boolean;
}

const FloatingShapes = ({ isLight }: ThemeProps) => {
  const groupRef = useRef<THREE.Group>(null);
  const materialColor = isLight ? '#e2e8f0' : '#1e1e2e'; // Slate-200 / deep neutral
  const emissiveColor = isLight ? '#c084fc' : '#a855f7'; // Purple accents

  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
      groupRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Central big shape */}
      <Float speed={2} rotationIntensity={1} floatIntensity={1}>
        <mesh position={[0, 0, 0]} rotation={[Math.PI / 4, Math.PI / 4, 0]}>
          <octahedronGeometry args={[2, 0]} />
          <meshPhysicalMaterial
            color={materialColor}
            emissive={emissiveColor}
            emissiveIntensity={0.1}
            roughness={0.2}
            metalness={0.8}
            transparent={true}
            opacity={0.8}
            wireframe={true}
          />
        </mesh>
      </Float>

      {/* Comic panel inspired shapes floating around */}
      <Float speed={1.5} rotationIntensity={2} floatIntensity={2}>
        <mesh position={[-4, 2, -2]} rotation={[0.2, -0.4, 0.1]}>
          <boxGeometry args={[1.5, 2.5, 0.1]} />
          <meshPhysicalMaterial
            color={isLight ? '#ffffff' : '#000000'}
            roughness={0.1}
            transmission={0.9} // glass effect
            thickness={0.5}
            envMapIntensity={isLight ? 1 : 2}
          />
        </mesh>
      </Float>

      <Float speed={2.5} rotationIntensity={1.5} floatIntensity={1.5}>
        <mesh position={[4, -1, -3]} rotation={[-0.2, 0.4, -0.1]}>
          <boxGeometry args={[2, 1.2, 0.1]} />
          <meshPhysicalMaterial
             color={isLight ? '#ffffff' : '#000000'}
             roughness={0.1}
             transmission={0.9}
             thickness={0.5}
             envMapIntensity={isLight ? 1 : 2}
          />
        </mesh>
      </Float>

      {/* Abstract spherical AI "nodes" */}
      <Float speed={3} rotationIntensity={0.5} floatIntensity={2}>
        <mesh position={[-3, -2, 1]}>
          <sphereGeometry args={[0.5, 32, 32]} />
          <meshStandardMaterial
            color="#34d399" // Emerald
            emissive="#34d399"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={1}
          />
        </mesh>
      </Float>

      <Float speed={2} rotationIntensity={0.5} floatIntensity={1.5}>
        <mesh position={[3, 2, 2]}>
          <sphereGeometry args={[0.4, 32, 32]} />
          <meshStandardMaterial
            color="#6366f1" // Indigo
            emissive="#6366f1"
            emissiveIntensity={0.5}
            roughness={0.2}
            metalness={1}
          />
        </mesh>
      </Float>
    </group>
  );
};

interface Landing3DSceneProps {
  themeMode?: "dark" | "light";
}

export function Landing3DScene({ themeMode = "dark" }: Landing3DSceneProps) {
  const isLight = themeMode === "light";

  return (
    <div className="fixed inset-0 z-0 pointer-events-none opacity-60">
      <Canvas dpr={[1, 2]}>
        <PerspectiveCamera makeDefault position={[0, 0, 8]} fov={50} />

        {/* Ambient lighting */}
        <ambientLight intensity={isLight ? 1.5 : 0.5} />

        {/* Dynamic lights for that professional look */}
        <directionalLight position={[10, 10, 5]} intensity={isLight ? 2 : 1.5} color="#c084fc" />
        <directionalLight position={[-10, -10, -5]} intensity={isLight ? 1.5 : 1} color="#34d399" />

        <Suspense fallback={null}>
          <Environment preset={isLight ? "city" : "night"} />
          <FloatingShapes isLight={isLight} />
        </Suspense>

        {/* Magical particles to represent AI transformation */}
        <Sparkles
          count={isLight ? 100 : 200}
          scale={15}
          size={isLight ? 2 : 4}
          speed={0.4}
          opacity={isLight ? 0.4 : 0.8}
          color={isLight ? "#9333ea" : "#c084fc"}
        />
        <Sparkles
          count={isLight ? 50 : 100}
          scale={12}
          size={isLight ? 3 : 5}
          speed={0.2}
          opacity={isLight ? 0.3 : 0.6}
          color="#34d399"
        />
      </Canvas>
    </div>
  );
}
