import React from 'react';

interface SceneFallbackProps {
  theme?: 'dark' | 'light';
}

export const SceneFallback: React.FC<SceneFallbackProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';
  return (
    <div className="relative w-full h-[450px] md:h-[550px] flex items-center justify-center">
      {/* Ambient background glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-72 h-72 rounded-full bg-[#E50920]/15 blur-3xl animate-pulse" />
      </div>

      {/* Floating glass card with official transparent logo: Red in light mode, White in dark mode */}
      <div className="relative group p-8 rounded-3xl glass-panel-elevated border border-white/10 flex flex-col items-center justify-center max-w-sm mx-auto shadow-2xl">
        <div className="relative w-52 h-52 flex items-center justify-center">
          <img
            src={isLight ? '/ccs_emblem_red.png' : '/ccs_emblem_white.png'}
            alt="CCS Code & Compute Society"
            className="w-full h-full object-contain filter drop-shadow-[0_10px_25px_rgba(229,9,32,0.3)] animate-float"
          />
        </div>
        <div className="mt-4 text-center">
          <p className="text-xs uppercase tracking-widest text-[#E50920] font-mono">EST. CODE & COMPUTE</p>
          <p className="text-sm text-zinc-400 mt-1 font-sans">Official Society Insignia</p>
        </div>
      </div>
    </div>
  );
};

