import React from 'react';
import { Github, Linkedin, Instagram, Mail } from 'lucide-react';
import { societyInfo } from '../../data/societyData';

interface FooterProps {
  theme?: 'dark' | 'light';
}

export const Footer: React.FC<FooterProps> = ({ theme = 'dark' }) => {
  const isLight = theme === 'light';

  return (
    <footer className="relative bg-[#050505] border-t border-white/10 py-8 sm:py-10 px-4 sm:px-8 w-full overflow-hidden">
      {/* Background crimson subtle ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-16 bg-[#E50920]/10 blur-3xl pointer-events-none" />

      <div className="max-w-3xl mx-auto w-full relative z-10 flex flex-col items-center text-center gap-5">
        {/* Social Links - Centered */}
        <div className="flex items-center justify-center gap-3">
          <a
            href={societyInfo.socialLinks.github}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2.5 rounded-full glass-panel border border-white/10 hover:border-[#E50920]/50 hover:bg-[#E50920]/10 transition-all duration-300 shadow-sm ${
              isLight ? 'text-zinc-700 hover:text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="GitHub"
          >
            <Github className="w-4 h-4" />
          </a>
          <a
            href={societyInfo.socialLinks.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2.5 rounded-full glass-panel border border-white/10 hover:border-[#E50920]/50 hover:bg-[#E50920]/10 transition-all duration-300 shadow-sm ${
              isLight ? 'text-zinc-700 hover:text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="LinkedIn"
          >
            <Linkedin className="w-4 h-4" />
          </a>
          <a
            href={societyInfo.socialLinks.instagram}
            target="_blank"
            rel="noopener noreferrer"
            className={`p-2.5 rounded-full glass-panel border border-white/10 hover:border-[#E50920]/50 hover:bg-[#E50920]/10 transition-all duration-300 shadow-sm ${
              isLight ? 'text-zinc-700 hover:text-zinc-950' : 'text-zinc-400 hover:text-white'
            }`}
            aria-label="Instagram"
          >
            <Instagram className="w-4 h-4" />
          </a>
          {societyInfo.socialLinks.email && (
            <a
              href={`mailto:${societyInfo.socialLinks.email}`}
              className={`p-2.5 rounded-full glass-panel border border-white/10 hover:border-[#E50920]/50 hover:bg-[#E50920]/10 transition-all duration-300 shadow-sm ${
                isLight ? 'text-zinc-700 hover:text-zinc-950' : 'text-zinc-400 hover:text-white'
              }`}
              aria-label="Email"
            >
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* All Rights Reserved - Centered directly beneath */}
        <p className={`text-xs font-mono tracking-wide text-center ${isLight ? 'text-zinc-500' : 'text-zinc-400'}`}>
          &copy; {new Date().getFullYear()} Code & Compute Society (CCS). All rights reserved.
        </p>
      </div>
    </footer>
  );
};

