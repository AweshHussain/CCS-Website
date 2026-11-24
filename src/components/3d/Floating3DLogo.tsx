import React, { Suspense, useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Float, Sparkles } from '@react-three/drei';
import { LogoMesh } from './LogoMesh';
import { SceneFallback } from './SceneFallback';

interface Floating3DLogoProps {
  reducedMotion?: boolean;
  isWatermark?: boolean;
  theme?: 'dark' | 'light';
  authPhase?: 'idle' | 'scanning' | 'verifying' | 'granted' | 'dashboard';
  selectedRole?: 'student' | 'coordinator';
}

export const Floating3DLogo: React.FC<Floating3DLogoProps> = ({
  reducedMotion = false,
  isWatermark = false,
  theme = 'dark',
  authPhase = 'idle',
  selectedRole,
}) => {
  const [hasWebGL, setHasWebGL] = useState<boolean | null>(null);

  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  if (hasWebGL === false) {
    return isWatermark ? (
      <div className="w-full h-full flex items-center justify-center opacity-30">
        <img
          src={theme === 'light' ? '/ccs_emblem_red.png' : '/ccs_emblem_white.png'}
          alt="CCS Watermark"
          className="w-48 h-48 object-contain animate-float"
        />
      </div>
    ) : (
      <SceneFallback theme={theme} />
    );
  }

  return (
    <div
      className={`relative w-full ${
        isWatermark ? 'h-full' : 'h-[450px] sm:h-[520px] lg:h-[620px]'
      } flex items-center justify-center select-none`}
    >
      {/* Background crimson ambient radial lighting behind 3D logo (only in hero mode) */}
      {!isWatermark && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-[340px] h-[340px] rounded-full bg-[#E50920]/14 blur-[110px]" />
          <div className="w-[200px] h-[200px] rounded-full bg-white/[0.04] blur-[80px]" />
        </div>
      )}

      <Suspense fallback={null}>
        <Canvas
          camera={{ position: [0, 0, isWatermark ? 7.2 : 7.8], fov: 42 }}
          dpr={[1, isWatermark ? 1.5 : 2]}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          onCreated={({ gl }) => {
            gl.setClearColor(0x000000, 0);
          }}
          style={{ background: 'transparent' }}
          className="w-full h-full cursor-grab active:cursor-grabbing bg-transparent"
        >
          {/* Studio Lighting Setup tailored for pure luminescence */}
          <ambientLight intensity={theme === 'light' ? (isWatermark ? 1.2 : 0.9) : (isWatermark ? 1.8 : 1.5)} />

          {/* Key white light from top-left */}
          <directionalLight
            position={[-5, 6, 6]}
            intensity={theme === 'light' ? 2.0 : 2.8}
            color="#FFFFFF"
          />

          {/* Fill light from front-right to ensure no dark shadows */}
          <directionalLight
            position={[5, 4, 5]}
            intensity={theme === 'light' ? 1.6 : 2.2}
            color="#FFFFFF"
          />

          {/* Rim lighting: Crimson accent in light mode, pure crisp white in dark mode */}
          <directionalLight
            position={[0, 4, -5]}
            intensity={theme === 'light' ? 3.5 : 2.5}
            color={theme === 'light' ? '#E50920' : '#FFFFFF'}
          />

          {/* Gentle fill light from below */}
          <pointLight
            position={[0, -4, 3]}
            intensity={theme === 'light' ? 1.2 : 1.8}
            color={theme === 'light' ? '#E50920' : '#FFFFFF'}
            distance={10}
          />

          {/* Top highlight */}
          <pointLight
            position={[0, 4, 3]}
            intensity={theme === 'light' ? 1.2 : 1.6}
            color="#FFFFFF"
            distance={8}
          />

          {/* 3D Floating Mesh */}
          <Float
            speed={reducedMotion || authPhase !== 'idle' ? 0 : 1.5}
            rotationIntensity={reducedMotion || authPhase !== 'idle' ? 0 : 0.2}
            floatIntensity={reducedMotion || authPhase !== 'idle' ? 0 : 0.3}
            floatingRange={[-0.1, 0.1]}
          >
            <LogoMesh
              reducedMotion={reducedMotion}
              theme={theme}
              authPhase={authPhase}
              selectedRole={selectedRole}
            />
          </Float>

          {/* Floating ambient embers: Crimson in light theme, Diamond White in dark theme */}
          {!reducedMotion && !isWatermark && (
            <Sparkles
              count={28}
              scale={6.5}
              size={1.6}
              speed={0.4}
              opacity={0.4}
              color={theme === 'light' ? '#E50920' : '#FFFFFF'}
            />
          )}
        </Canvas>
      </Suspense>
    </div>
  );
};
