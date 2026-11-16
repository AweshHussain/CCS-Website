import React, { useState, useEffect, useRef } from 'react';
import { Type, Check, ChevronDown } from 'lucide-react';

export interface FontOption {
  id: string;
  name: string;
  subtitle: string;
  preview: string;
}

export const FONT_PRESETS: FontOption[] = [
  {
    id: 'space',
    name: 'Space Grotesk',
    subtitle: 'Techno Neo-Grotesk (Default)',
    preview: 'CCS 2026',
  },
  {
    id: 'unbounded',
    name: 'Unbounded',
    subtitle: 'Wide Futuristic',
    preview: 'COMPUTE',
  },
  {
    id: 'rajdhani',
    name: 'Rajdhani',
    subtitle: 'Cybernetic Engineered',
    preview: 'SYSTEMS',
  },
  {
    id: 'syncopate',
    name: 'Syncopate',
    subtitle: 'Ultra-Wide Cinematic',
    preview: 'SOCIETY',
  },
  {
    id: 'syne',
    name: 'Syne',
    subtitle: 'Avant-Garde Creative',
    preview: 'INNOVATE',
  },
];

interface FontSwitcherProps {
  currentFont: string;
  onFontChange: (fontId: string) => void;
  theme?: 'dark' | 'light';
}

export const FontSwitcher: React.FC<FontSwitcherProps> = ({
  currentFont,
  onFontChange,
  theme = 'dark',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeOption = FONT_PRESETS.find((f) => f.id === currentFont) || FONT_PRESETS[0];

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Switch Typography Style"
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-mono transition-all cursor-pointer ${
          theme === 'light'
            ? 'bg-white/10 hover:bg-white/15 border border-white/10 text-white'
            : 'glass-panel hover:border-[#E50920]/40 text-zinc-300 hover:text-white'
        }`}
      >
        <Type className="w-3.5 h-3.5 text-[#E50920]" />
        <span className="hidden sm:inline text-[11px] font-semibold">{activeOption.name}</span>
        <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 p-2 rounded-2xl bg-[#0F1015]/95 border border-white/15 shadow-2xl z-50 flex flex-col gap-1 backdrop-blur-2xl text-white">
          <div className="px-3 py-1.5 border-b border-white/10 mb-1 flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E50920]">
              Typography Style
            </span>
            <span className="text-[9px] font-mono text-zinc-400">Live Preview</span>
          </div>

          {FONT_PRESETS.map((font) => {
            const isSelected = font.id === currentFont;
            return (
              <button
                key={font.id}
                onClick={() => {
                  onFontChange(font.id);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#E50920]/20 border border-[#E50920]/40 text-white'
                    : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                }`}
              >
                <div>
                  <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                    <span>{font.name}</span>
                  </div>
                  <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
                    {font.subtitle}
                  </div>
                </div>

                {isSelected && (
                  <Check className="w-4 h-4 text-[#E50920] shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

