import React from 'react';
import { Floating3DLogo } from '../3d/Floating3DLogo';
import { ParticleBackground } from './ParticleBackground';

interface DashboardBackgroundProps {
  role?: 'coordinator' | 'student';
}

export const DashboardBackground: React.FC<DashboardBackgroundProps> = ({ role = 'coordinator' }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Deep Ambient Crimson Lighting */}
      <div className="absolute top-1/4 left-10 w-[550px] h-[550px] rounded-full bg-[#E50920]/12 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-[#E50920]/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#E50920]/6 blur-[180px] pointer-events-none" />

      {/* Canvas Floating Particles & Sparks */}
      <ParticleBackground theme="dark" reducedMotion={false} />

      {/* 3D Rotating CCS Floating Logo in Background with Bright Edges */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className="w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] opacity-75 pointer-events-none">
          <Floating3DLogo
            isWatermark={true}
            theme="dark"
            authPhase="dashboard"
            selectedRole={role}
          />
        </div>
      </div>
    </div>
  );
};
