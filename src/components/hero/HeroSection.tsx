import React from 'react';
import { ArrowRight, Sparkles, Terminal, ChevronDown, Users, Flame } from 'lucide-react';
import { Floating3DLogo } from '../3d/Floating3DLogo';
import { societyInfo } from '../../data/societyData';

interface HeroSectionProps {
  reducedMotion?: boolean;
  theme?: 'dark' | 'light';
}

export const HeroSection: React.FC<HeroSectionProps> = ({ reducedMotion = false, theme = 'dark' }) => {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section
      id="home"
      className="relative min-h-screen w-full flex flex-col justify-center pt-28 pb-16 px-4 sm:px-8 lg:px-12 overflow-hidden"
    >
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-10 w-96 h-96 rounded-full bg-[#E50920]/10 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-10 w-[500px] h-[500px] rounded-full bg-[#E50920]/12 blur-[160px] pointer-events-none" />
      

      <div className="max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10 my-auto">
        {/* LEFT COLUMN: Society Mission & Call to Actions */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col items-start text-left">
          {/* Status badge */}
          <div
            className={`inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full text-xs font-mono mb-6 transition-colors ${
              theme === 'light'
                ? 'bg-zinc-100 border border-zinc-300 text-zinc-700 shadow-sm'
                : 'glass-panel border border-white/10 text-zinc-300'
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#E50920] opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#E50920]" />
            </span>
            <span
              className={`tracking-widest uppercase text-[11px] font-semibold ${
                theme === 'light' ? 'text-zinc-900' : 'text-white'
              }`}
            >
              CODE & COMPUTE SOCIETY
            </span>
            <span className={theme === 'light' ? 'text-zinc-400' : 'text-zinc-500'}>|</span>
            <span className="text-[#E50920] font-mono text-[11px]">THINK. CODE. CREATE.</span>
          </div>

          {/* Large Heading */}
          <h1
            className={`text-4xl sm:text-5xl md:text-6xl xl:text-7xl font-black font-display tracking-tight leading-[1.08] mb-6 ${
              theme === 'light' ? 'text-[#09090B]' : 'text-white'
            }`}
          >
            WE BUILD.<br />
            <span className="text-gradient-shimmer">WE INNOVATE.</span><br />
            WE CREATE.
          </h1>

          {/* Description */}
          <p
            className={`text-base sm:text-lg font-sans leading-relaxed max-w-xl mb-8 ${
              theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
            }`}
          >
            {societyInfo.heroDescription}
          </p>

          {/* Two Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto mb-10">
            <button
              onClick={() => scrollTo('team')}
              className="w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase text-white bg-gradient-to-r from-[#E50920] to-[#B20718] hover:from-[#FF1E38] hover:to-[#E50920] transition-all duration-300 shadow-[0_0_25px_rgba(229,9,32,0.4)] hover:shadow-[0_0_40px_rgba(229,9,32,0.6)] flex items-center justify-center gap-2 group cursor-pointer"
            >
              <Users className="w-4 h-4 text-white/90" />
              <span>Explore Our Team</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            <button
              onClick={() => scrollTo('about')}
              className={`w-full sm:w-auto px-7 py-3.5 rounded-full text-sm font-semibold tracking-wider uppercase transition-all duration-300 flex items-center justify-center gap-2 group cursor-pointer ${
                theme === 'light'
                  ? 'bg-zinc-100 hover:bg-zinc-200 text-zinc-900 border border-zinc-300 shadow-sm'
                  : 'text-zinc-200 glass-panel border border-white/10 hover:border-[#E50920]/40 hover:text-white hover:bg-white/[0.06]'
              }`}
            >
              <span>Discover CCS</span>
              <Sparkles className="w-4 h-4 text-[#E50920] group-hover:rotate-12 transition-transform" />
            </button>
          </div>

          {/* Live Telemetry / Metrics Bar */}
          <div
            className={`grid grid-cols-3 gap-3 sm:gap-6 pt-6 border-t w-full max-w-lg ${
              theme === 'light' ? 'border-zinc-200' : 'border-white/10'
            }`}
          >
            <div>
              <div
                className={`text-xl sm:text-2xl font-bold font-display ${
                  theme === 'light' ? 'text-zinc-900' : 'text-white'
                }`}
              >
                1,500+
              </div>
              <div
                className={`text-[11px] font-mono uppercase tracking-wider ${
                  theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                Members
              </div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-bold font-display ${
                  theme === 'light' ? 'text-zinc-900' : 'text-white'
                }`}
              >
                35+
              </div>
              <div
                className={`text-[11px] font-mono uppercase tracking-wider ${
                  theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                Hackathons
              </div>
            </div>
            <div>
              <div
                className={`text-xl sm:text-2xl font-bold font-display ${
                  theme === 'light' ? 'text-zinc-900' : 'text-white'
                }`}
              >
                120+
              </div>
              <div
                className={`text-[11px] font-mono uppercase tracking-wider ${
                  theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                Projects
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Signature Floating 3D Transparent CCS Logo (Desktop Hero Showcase) */}
        <div className="hidden lg:flex lg:col-span-6 xl:col-span-5 relative items-center justify-center">
          <div className="w-full max-w-lg">
            <Floating3DLogo reducedMotion={reducedMotion} theme={theme} />
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 hidden md:flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
        <span
          className={`text-[10px] font-mono uppercase tracking-[0.25em] ${
            theme === 'light' ? 'text-zinc-500' : 'text-zinc-400'
          }`}
        >
          Scroll to explore
        </span>
        <button
          onClick={() => scrollTo('about')}
          className={`p-1 rounded-full hover:text-[#E50920] transition-colors ${
            theme === 'light' ? 'text-zinc-600' : 'text-zinc-400'
          }`}
          aria-label="Scroll down to About section"
        >
          <ChevronDown className="w-4 h-4 animate-bounce" />
        </button>
      </div>
    </section>
  );
};

