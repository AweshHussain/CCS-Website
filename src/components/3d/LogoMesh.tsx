import React, { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { CCS_LOGO_PATHS, LOGO_CENTER, LOGO_SCALE } from './logoCoordinates';

interface LogoMeshProps {
  reducedMotion?: boolean;
  theme?: 'dark' | 'light';
  authPhase?: 'idle' | 'scanning' | 'verifying' | 'granted' | 'dashboard';
  selectedRole?: 'student' | 'coordinator';
}

export const LogoMesh: React.FC<LogoMeshProps> = ({
  reducedMotion = false,
  theme = 'dark',
  authPhase = 'idle',
  selectedRole,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const meshGroupRef = useRef<THREE.Group>(null);

  // Generate 3D geometries from exact vector points
  const { geometries, depth } = useMemo(() => {
    const extrudeDepth = 0.26;
    const extrudeSettings: THREE.ExtrudeGeometryOptions = {
      depth: extrudeDepth,
      bevelEnabled: true,
      bevelSegments: 4,
      steps: 1,
      bevelSize: 0.02,
      bevelThickness: 0.025,
    };

    const geos = CCS_LOGO_PATHS.map((comp) => {
      const shape = new THREE.Shape();
      comp.points.forEach(([x, y], idx) => {
        const px = (x - LOGO_CENTER.cx) * LOGO_SCALE;
        const py = (LOGO_CENTER.cy - y) * LOGO_SCALE; // Invert Y to match 3D space
        if (idx === 0) shape.moveTo(px, py);
        else shape.lineTo(px, py);
      });
      shape.closePath();
      return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    });

    return { geometries: geos, depth: extrudeDepth };
  }, []);

  // Frame animation loop
  useFrame((state, delta) => {
    if (!meshGroupRef.current) return;

    if (authPhase === 'scanning') {
      // Rapid spin accelerating into cryptographic alignment
      meshGroupRef.current.rotation.y += delta * 8.5;
      meshGroupRef.current.position.z = THREE.MathUtils.lerp(meshGroupRef.current.position.z, 0.45, 0.1);
      meshGroupRef.current.position.y = THREE.MathUtils.lerp(meshGroupRef.current.position.y, 0, 0.1);
    } else if (authPhase === 'verifying' || authPhase === 'granted') {
      // Concept 2 Alignment: Snap to exact forward alignment (0° yaw) facing user
      const currentY = meshGroupRef.current.rotation.y;
      const targetY = Math.round(currentY / (2 * Math.PI)) * (2 * Math.PI);
      meshGroupRef.current.rotation.y = THREE.MathUtils.lerp(currentY, targetY, 0.14);
      meshGroupRef.current.rotation.x = THREE.MathUtils.lerp(meshGroupRef.current.rotation.x, 0, 0.14);
      meshGroupRef.current.rotation.z = THREE.MathUtils.lerp(meshGroupRef.current.rotation.z, 0, 0.14);
      meshGroupRef.current.position.y = THREE.MathUtils.lerp(meshGroupRef.current.position.y, 0, 0.1);
      meshGroupRef.current.position.z = THREE.MathUtils.lerp(
        meshGroupRef.current.position.z,
        authPhase === 'granted' ? 1.1 : 0.7,
        0.1
      );
    } else if (!reducedMotion) {
      // Normal majestic idle rotation: Exactly 24 seconds for 360-degree rotation
      const rotationSpeed = (2 * Math.PI) / 24;
      meshGroupRef.current.rotation.y += delta * rotationSpeed;

      // Gentle floating movement along Y-axis
      const floatTime = state.clock.elapsedTime * 1.2;
      meshGroupRef.current.position.y = Math.sin(floatTime) * 0.12;
      meshGroupRef.current.position.z = THREE.MathUtils.lerp(meshGroupRef.current.position.z, 0, 0.05);

      // Subtle rotation around X-axis for realistic 3D depth
      meshGroupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.05;
      meshGroupRef.current.rotation.z = Math.cos(state.clock.elapsedTime * 0.4) * 0.02;

      // Subtle mouse-responsive movement on desktop
      if (groupRef.current) {
        const targetRotX = state.pointer.y * 0.15;
        const targetRotY = state.pointer.x * 0.2;
        groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, targetRotX, 0.05);
        groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, targetRotY, 0.05);
      }
    }
  });

  const isLight = theme === 'light';

  return (
    <group ref={groupRef}>
      <group ref={meshGroupRef}>
        {/* Center the mesh on Z-axis so it spins around its geometric middle */}
        <group position={[0, 0, -depth / 2]}>
          {geometries.map((geo, index) => (
            <group key={index}>
              {/* Solid, luminous physical material: Radiant Pure White in dark mode, Vibrant Crimson Red in light mode */}
              <mesh geometry={geo} castShadow receiveShadow>
                <meshPhysicalMaterial
                  color={isLight ? '#E50920' : '#FFFFFF'}
                  emissive={isLight ? '#5a040b' : '#323238'}
                  roughness={isLight ? 0.15 : 0.14}
                  metalness={isLight ? 0.1 : 0.04}
                  transmission={0}
                  clearcoat={1.0}
                  clearcoatRoughness={0.06}
                  specularIntensity={1.0}
                  specularColor="#FFFFFF"
                  reflectivity={0.85}
                />
              </mesh>

              {/* Edge definition glow: subtle crimson in light mode, pure crisp white/silver in dark mode */}
              <lineSegments>
                <edgesGeometry args={[geo, 28]} />
                <lineBasicMaterial
                  color={isLight ? '#8B000D' : '#FFFFFF'}
                  transparent={true}
                  opacity={isLight ? 0.5 : 0.4}
                  linewidth={1}
                />
              </lineSegments>
            </group>
          ))}
        </group>
      </group>
    </group>
  );
};

