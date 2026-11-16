import React from 'react';
import { Linkedin, Github, Mail, Sparkles, ExternalLink } from 'lucide-react';
import { TeamMember } from '../../types';

interface TeamCardProps {
  member: TeamMember;
}

export const TeamCard: React.FC<TeamCardProps> = ({ member }) => {
  return (
    <div className="group relative p-6 rounded-2xl glass-panel-elevated border border-white/10 hover:border-[#E50920]/40 transition-all duration-300 flex flex-col justify-between hover:-translate-y-1.5 shadow-xl overflow-hidden">
      {/* Ambient background glow on hover (dark mode only) */}
      <div className="hidden dark:block absolute top-0 right-0 w-32 h-32 bg-[#E50920]/0 group-hover:bg-[#E50920]/15 rounded-full blur-2xl transition-all duration-500 pointer-events-none" />

      <div>
        {/* Header with Photo / Avatar and Badge */}
        <div className="flex items-start justify-between mb-5">
          <div className="relative">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden glass-panel border border-white/15 p-1 group-hover:border-[#E50920]/60 transition-colors">
              {member.image ? (
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover rounded-xl filter grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
                  onError={(e) => {
                    // Fallback to avatar if image fails to load
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full rounded-xl bg-gradient-to-br from-zinc-800 to-zinc-950 flex items-center justify-center font-display font-bold text-lg text-white/90">
                  {member.avatarFallback}
                </div>
              )}
            </div>
            {/* Status dot */}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[var(--bg-primary)] flex items-center justify-center border border-white/10">
              <span className="w-2.5 h-2.5 rounded-full bg-[#E50920]" />
            </span>
          </div>

          {member.badge && (
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-white bg-white/5 border border-white/10 group-hover:border-[#E50920]/30 group-hover:text-[#E50920] transition-colors">
              {member.badge}
            </span>
          )}
        </div>

        {/* Member Name and Designation */}
        <h3 className="text-lg font-bold font-display text-white group-hover:text-white transition-colors flex items-center gap-1.5">
          <span>{member.name}</span>
        </h3>

        <p className="text-xs font-mono uppercase tracking-wider text-[#E50920] mt-1 mb-3">
          {member.role}
        </p>

        {/* Short Bio */}
        <p className="text-xs sm:text-sm text-zinc-400 font-sans leading-relaxed mb-4 line-clamp-3">
          {member.bio}
        </p>

        {/* Skills Tags */}
        <div className="flex flex-wrap gap-1.5 mb-5">
          {member.skills.slice(0, 3).map((skill, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/5 text-zinc-400"
            >
              {skill}
            </span>
          ))}
          {member.skills.length > 3 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/[0.02] text-zinc-400">
              +{member.skills.length - 3}
            </span>
          )}
        </div>
      </div>

      {/* Footer Social Links */}
      <div className="pt-4 border-t border-white/10 flex items-center justify-between">
        <span className="text-[11px] font-mono text-zinc-400">CONNECT</span>
        <div className="flex items-center gap-2">
          {member.linkedin && (
            <a
              href={member.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg glass-panel hover:border-[#E50920]/50 text-zinc-400 hover:text-white transition-colors"
              title={`${member.name} LinkedIn`}
            >
              <Linkedin className="w-3.5 h-3.5" />
            </a>
          )}
          {member.github && (
            <a
              href={member.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 rounded-lg glass-panel hover:border-[#E50920]/50 text-zinc-400 hover:text-white transition-colors"
              title={`${member.name} GitHub`}
            >
              <Github className="w-3.5 h-3.5" />
            </a>
          )}
          {member.email && (
            <a
              href={`mailto:${member.email}`}
              className="p-1.5 rounded-lg glass-panel hover:border-[#E50920]/50 text-zinc-400 hover:text-white transition-colors"
              title={`Email ${member.name}`}
            >
              <Mail className="w-3.5 h-3.5" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

