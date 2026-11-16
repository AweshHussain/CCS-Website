import React from 'react';
import { Target, Compass, Terminal, Cpu, Sparkles, Flame, CheckCircle2 } from 'lucide-react';
import { societyInfo } from '../../data/societyData';

const iconMap = {
  Terminal: Terminal,
  Cpu: Cpu,
  Sparkles: Sparkles,
  Flame: Flame,
};

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="relative py-24 sm:py-32 px-4 sm:px-8 lg:px-12 w-full overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/2 left-0 w-80 h-80 bg-[#E50920]/8 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-10 right-0 w-96 h-96 bg-[#E50920]/10 rounded-full blur-[160px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-start mb-16 sm:mb-20">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-white/10 text-xs font-mono text-[#E50920] mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50920]" />
            <span>WHO WE ARE</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black font-display tracking-tight text-white uppercase mb-6">
            BEYOND THE <span className="text-[#E50920]">CODE.</span>
          </h2>

          <p className="text-lg sm:text-xl text-zinc-300 max-w-3xl font-sans leading-relaxed">
            {societyInfo.about.story}
          </p>
        </div>

        {/* Vision & Mission Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 mb-20">
          {/* Vision Card */}
          <div className="relative group p-8 sm:p-10 rounded-3xl glass-panel-elevated border border-white/10 hover:border-[#E50920]/40 transition-all duration-500 overflow-hidden shadow-xl">
            <div className="hidden dark:block absolute top-0 right-0 w-44 h-44 bg-[#E50920]/10 rounded-full blur-3xl group-hover:bg-[#E50920]/15 transition-all duration-500 pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 text-[#E50920] mb-6 group-hover:scale-105 group-hover:bg-[#E50920] group-hover:text-white group-hover:border-[#E50920] group-hover:shadow-lg group-hover:shadow-[#E50920]/30 transition-all duration-300">
                <Compass className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white mb-3 group-hover:text-[#E50920] transition-colors">
                Our Vision
              </h3>
              <p className="text-zinc-400 font-sans leading-relaxed text-sm sm:text-base">
                {societyInfo.about.vision}
              </p>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-xs font-mono text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-[#E50920]" />
                <span>Cultivating Global Tech Leadership</span>
              </div>
            </div>
          </div>

          {/* Mission Card */}
          <div className="relative group p-8 sm:p-10 rounded-3xl glass-panel-elevated border border-white/10 hover:border-[#E50920]/40 transition-all duration-500 overflow-hidden shadow-xl">
            <div className="hidden dark:block absolute top-0 right-0 w-44 h-44 bg-[#E50920]/10 rounded-full blur-3xl group-hover:bg-[#E50920]/15 transition-all duration-500 pointer-events-none" />
            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-12 rounded-2xl glass-panel flex items-center justify-center border border-white/10 text-[#E50920] mb-6 group-hover:scale-105 group-hover:bg-[#E50920] group-hover:text-white group-hover:border-[#E50920] group-hover:shadow-lg group-hover:shadow-[#E50920]/30 transition-all duration-300">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold font-display text-white mb-3 group-hover:text-[#E50920] transition-colors">
                Our Mission
              </h3>
              <p className="text-zinc-400 font-sans leading-relaxed text-sm sm:text-base">
                {societyInfo.about.mission}
              </p>
              <div className="mt-6 pt-6 border-t border-white/10 flex items-center gap-2 text-xs font-mono text-zinc-400">
                <CheckCircle2 className="w-4 h-4 text-[#E50920]" />
                <span>Shipping Impactful Open-Source Code</span>
              </div>
            </div>
          </div>
        </div>

        {/* What We Do - 4 Pillars */}
        <div className="mb-20">
          <div className="flex flex-col items-start mb-10">
            <span className="text-xs uppercase font-mono tracking-widest text-[#E50920] mb-2">
              CORE DISCIPLINES
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold font-display text-white">
              WHAT WE DO AT CCS
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {societyInfo.pillars.map((pillar) => {
              const IconComponent = iconMap[pillar.iconName as keyof typeof iconMap] || Terminal;
              return (
                <div
                  key={pillar.id}
                  className="group relative p-6 rounded-2xl glass-panel border border-white/10 hover:border-[#E50920]/50 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 shadow-lg hover:shadow-xl hover:shadow-[#E50920]/5"
                >
                  <div>
                    <div className="flex items-center justify-between mb-5">
                      <div className="w-10 h-10 rounded-xl glass-panel border border-white/10 flex items-center justify-center text-[#E50920] group-hover:bg-[#E50920] group-hover:text-white group-hover:border-[#E50920] group-hover:shadow-md group-hover:shadow-[#E50920]/30 transition-all duration-300">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400 px-2 py-0.5 rounded-full bg-white/5 border border-white/5 group-hover:border-[#E50920]/20 transition-colors">
                        {pillar.subtitle}
                      </span>
                    </div>

                    <h4 className="text-base sm:text-lg font-bold font-display text-white mb-2.5 group-hover:text-[#E50920] transition-colors">
                      {pillar.title}
                    </h4>

                    <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
                    <span>Telemetry</span>
                    <span className="text-[#E50920] font-medium">{pillar.metrics}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Impact Numbers Banner */}
        <div className="p-8 sm:p-12 rounded-3xl glass-panel-elevated border border-white/10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#E50920]/10 via-transparent to-[#E50920]/5 pointer-events-none" />
          <div className="relative z-10 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {societyInfo.stats.map((stat, idx) => (
              <div key={idx} className="flex flex-col items-center">
                <span className="text-3xl sm:text-4xl lg:text-5xl font-black font-display text-white mb-1.5 text-gradient-shimmer">
                  {stat.value}
                </span>
                <span className="text-xs sm:text-sm font-semibold text-zinc-200 mb-1">
                  {stat.label}
                </span>
                <span className="text-[11px] font-mono text-zinc-400">
                  {stat.detail}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

