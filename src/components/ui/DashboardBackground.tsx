import React from 'react';
import { ParticleBackground } from './ParticleBackground';

interface DashboardBackgroundProps {
  role?: 'coordinator' | 'student';
}

export const DashboardBackground: React.FC<DashboardBackgroundProps> = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
      {/* Deep Ambient Crimson Lighting (same as landing page hero glows) */}
      <div className="absolute top-1/4 left-10 w-[550px] h-[550px] rounded-full bg-[#E50920]/12 blur-[160px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[500px] h-[500px] rounded-full bg-[#E50920]/10 blur-[150px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full bg-[#E50920]/6 blur-[180px] pointer-events-none" />

      {/* Canvas Floating Particles & Sparks (identical to landing page) */}
      <ParticleBackground theme="dark" reducedMotion={false} />
    </div>
  );
};
