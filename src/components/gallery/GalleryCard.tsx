import React, { useState, useRef } from 'react';
import { Maximize2, Calendar, Users, Clock, Tag, ExternalLink } from 'lucide-react';
import { GalleryItem } from '../../types';

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
  className?: string;
}

export const GalleryCard: React.FC<GalleryCardProps> = ({ item, onClick, className = '' }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Subtle 3D perspective mouse tilt
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    const rotX = ((y - centerY) / centerY) * -5; // Max 5 deg tilt
    const rotY = ((x - centerX) / centerX) * 5;

    setRotateX(rotX);
    setRotateY(rotY);
  };

  const handleMouseLeave = () => {
    setRotateX(0);
    setRotateY(0);
    setIsHovered(false);
  };

  return (
    <div
      ref={cardRef}
      data-gallery-card="true"
      onClick={onClick}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
        transition: isHovered ? 'transform 0.1s ease-out' : 'transform 0.5s ease-out',
      }}
      className={`group relative rounded-3xl overflow-hidden border border-white/10 hover:border-[#E50920]/60 transition-colors duration-500 cursor-pointer shadow-xl flex flex-col justify-between h-[390px] sm:h-[430px] w-full select-none ${className}`}
    >
      {/* Background Image filling 100% of card */}
      <div className="absolute inset-0 w-full h-full bg-zinc-950 overflow-hidden">
        <img
          src={item.image}
          alt={item.title}
          className="w-full h-full object-cover filter brightness-[0.82] group-hover:brightness-100 group-hover:scale-105 transition-all duration-700 ease-out"
        />

        {/* Cinematic dark gradient overlay for optimal readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#080808] via-[#080808]/60 to-[#080808]/20 group-hover:via-[#080808]/45 transition-colors duration-500" />

        {/* Subtle Cybernetic Scanline beam on hover */}
        {isHovered && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#E50920] to-transparent opacity-75 blur-[1px] animate-scanline pointer-events-none" />
        )}
      </div>

      {/* Top Bar: Category pill, status indicator & full-screen button */}
      <div className="relative z-10 p-5 sm:p-6 flex items-center justify-between w-full">
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-white bg-black/75 backdrop-blur-md border border-white/20 shadow-md group-hover:border-[#E50920]/50 transition-colors">
            {item.category}
          </span>
          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9px] font-mono text-zinc-200 bg-black/50 backdrop-blur-md border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-[#E50920] animate-pulse" />
            <span>ARCHIVE // 4K</span>
          </span>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
          className="w-9 h-9 rounded-full bg-black/65 backdrop-blur-md border border-white/20 flex items-center justify-center text-white hover:bg-[#E50920] hover:border-[#E50920] group-hover:scale-105 transition-all duration-300 shadow-lg cursor-pointer"
          aria-label="View Fullscreen"
        >
          <Maximize2 className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Bottom Content Area: grounded, balanced & aligned */}
      <div data-gallery-overlay="true" className="relative z-10 p-5 sm:p-6 flex flex-col justify-end bg-gradient-to-t from-[#080808] via-[#080808]/90 to-transparent pt-12">
        {/* Date & Metadata */}
        <div className="flex items-center gap-3 text-xs font-mono text-[#E50920] mb-2">
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5" />
            <span>{item.date}</span>
          </div>

          {item.stats?.participants && (
            <>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1 text-zinc-300">
                <Users className="w-3 h-3 text-zinc-400" />
                <span>{item.stats.participants}</span>
              </div>
            </>
          )}

          {item.stats?.duration && (
            <>
              <span className="text-zinc-600">•</span>
              <div className="flex items-center gap-1 text-zinc-300">
                <Clock className="w-3 h-3 text-zinc-400" />
                <span>{item.stats.duration}</span>
              </div>
            </>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg sm:text-xl font-bold font-display text-white group-hover:text-white mb-2 leading-snug line-clamp-2">
          {item.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-zinc-400 line-clamp-2 font-sans mb-3 group-hover:text-zinc-300 transition-colors leading-relaxed">
          {item.description}
        </p>

        {/* Tag pills */}
        <div className="flex flex-wrap gap-1.5 pt-2 border-t border-white/5">
          {item.tags.slice(0, 3).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/5 text-zinc-400 group-hover:text-zinc-200 transition-colors"
            >
              #{tag}
            </span>
          ))}
          {item.tags.length > 3 && (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.02] text-zinc-500">
              +{item.tags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
