import React, { useState } from 'react';
import { Sun, Moon, Sparkles } from 'lucide-react';

interface ThemeToggleProps {
  theme: 'dark' | 'light';
  onToggle: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, className }) => {
  const isDark = theme === 'dark';

  return (
    <button
      onClick={onToggle}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      aria-label={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      className={`relative p-2 rounded-full transition-all duration-300 cursor-pointer group flex items-center justify-center overflow-hidden ${
        className
          ? className
          : theme === 'light'
          ? 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
          : 'glass-panel hover:border-[#E50920]/40 text-zinc-300 hover:text-white'
      }`}
    >
      {/* Ambient hover glow */}
      <span className="absolute inset-0 rounded-full bg-[#E50920]/0 group-hover:bg-[#E50920]/15 blur-sm transition-colors" />

      {/* Rotating Sun / Moon Icons */}
      <div className="relative w-4 h-4 flex items-center justify-center transition-transform duration-500 transform group-hover:rotate-45">
        {isDark ? (
          <Sun className="w-4 h-4 text-amber-400 group-hover:text-amber-300 transition-colors drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />
        ) : (
          <Moon className="w-4 h-4 text-[#E50920] transition-colors drop-shadow-[0_0_8px_rgba(229,9,32,0.6)]" />
        )}
      </div>
    </button>
  );
};

