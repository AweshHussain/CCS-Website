import React from 'react';
import { Floating3DLogo } from '../3d/Floating3DLogo';
import { ParticleBackground } from './ParticleBackground';

interface DashboardBackgroundProps {
  role?: 'coordinator' | 'student';
}

export const DashboardBackground: React.FC<DashboardBackgroundProps> = ({ role = 'coordinator' }) => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Deep Ambient Crimson Lighting (same as landing page hero glows) */}
      <div className="absolute top-1/4 left-10 w-[550px] h-[550px] rounded-full bg-[#E50920]/12 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-[#E50920]/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#E50920]/6 blur-[180px] pointer-events-none" />

      {/* Canvas Floating Particles & Sparks (identical to landing page) */}
      <ParticleBackground theme="dark" reducedMotion={false} />

      {/* 3D Rotating CCS Emblem Watermark in the Center */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        {/* Ambient red halo behind 3D logo */}
        <div className="w-[450px] h-[450px] sm:w-[550px] sm:h-[550px] rounded-full bg-[#E50920]/14 blur-[130px] pointer-events-none" />
        
        {/* Rotating subtle reticle rings */}
        <div
          className="absolute w-[420px] h-[420px] sm:w-[520px] sm:h-[520px] rounded-full border border-dashed border-white/5 animate-spin pointer-events-none"
          style={{ animationDuration: '60s' }}
        />

        {/* 3D Model Instance floating in background */}
        <div className="absolute w-[360px] h-[360px] sm:w-[480px] sm:h-[480px] opacity-25 pointer-events-none">
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
