import React from 'react';
import { Floating3DLogo } from '../3d/Floating3DLogo';
import { ParticleBackground } from './ParticleBackground';

interface DashboardBackgroundProps {
  role?: 'coordinator' | 'student';
  theme?: 'dark' | 'light';
}

export const DashboardBackground: React.FC<DashboardBackgroundProps> = ({ role = 'coordinator', theme = 'dark' }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Deep Ambient Crimson Lighting */}
      <div className={`absolute top-1/4 left-10 w-[550px] h-[550px] rounded-full blur-[160px] pointer-events-none ${
        theme === 'light' ? 'bg-[#E50920]/6' : 'bg-[#E50920]/12'
      }`} />
      <div className={`absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full blur-[150px] pointer-events-none ${
        theme === 'light' ? 'bg-[#E50920]/5' : 'bg-[#E50920]/10'
      }`} />
      <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full blur-[180px] pointer-events-none ${
        theme === 'light' ? 'bg-[#E50920]/3' : 'bg-[#E50920]/6'
      }`} />

      {/* Canvas Floating Particles & Sparks */}
      <ParticleBackground theme={theme} reducedMotion={false} />

      {/* 3D Rotating CCS Floating Logo in Background with Bright Edges */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div className={`w-[420px] h-[420px] sm:w-[560px] sm:h-[560px] pointer-events-none transition-opacity ${
          theme === 'light' ? 'opacity-20' : 'opacity-40'
        }`}>
          <Floating3DLogo
            isWatermark={true}
            theme={theme}
            authPhase="dashboard"
            selectedRole={role}
          />
        </div>
      </div>
    </div>
  );
};
