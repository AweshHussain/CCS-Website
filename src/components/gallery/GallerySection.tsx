import React, { useState, useMemo, useRef } from 'react';
import { Camera, LayoutGrid, Film, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';
import { galleryData } from '../../data/galleryData';
import { GalleryItem } from '../../types';
import { GalleryCard } from './GalleryCard';
import { LightboxModal } from './LightboxModal';

const CATEGORIES = ['All', 'Technical Events', 'Hackathons', 'Workshops', 'Team Activities'] as const;

export const GallerySection: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [activeItem, setActiveItem] = useState<GalleryItem | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'cinema'>('grid');
  const cinemaScrollRef = useRef<HTMLDivElement>(null);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'All') return galleryData;
    return galleryData.filter((item) => item.category === selectedCategory);
  }, [selectedCategory]);

  const scrollCinema = (direction: 'left' | 'right') => {
    if (!cinemaScrollRef.current) return;
    const scrollAmount = 420;
    cinemaScrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    });
  };

  return (
    <section id="gallery" className="relative py-24 sm:py-32 px-4 sm:px-8 lg:px-12 w-full overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-1/3 left-0 w-96 h-96 bg-[#E50920]/8 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-[#E50920]/10 rounded-full blur-[180px] pointer-events-none" />

      <div className="max-w-7xl mx-auto w-full relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 sm:mb-16">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full glass-panel border border-white/10 text-xs font-mono text-[#E50920] mb-4">
              <Camera className="w-3.5 h-3.5" />
              <span>VISUAL ARCHIVE</span>
            </div>

            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black font-display tracking-tight text-white uppercase">
              MOMENTS THAT <span className="text-[#E50920]">DEFINE US.</span>
            </h2>

            <p className="text-sm sm:text-base text-zinc-400 max-w-xl font-sans mt-3">
              Snapshots of high-intensity hackathon midnight sprints, national symposiums, hardware buildouts, and our growing community.
            </p>
          </div>

          {/* View Mode Toggle & Category Switcher */}
          <div className="flex flex-wrap items-center gap-3">
            {/* View Mode Switcher */}
            <div className="p-1 rounded-full glass-panel border border-white/10 flex items-center gap-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-[#E50920] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Grid</span>
              </button>

              <button
                onClick={() => setViewMode('cinema')}
                className={`p-2 rounded-full text-xs font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  viewMode === 'cinema'
                    ? 'bg-[#E50920] text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
                title="Cinema Strip View"
              >
                <Film className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Cinema</span>
              </button>
            </div>

            {/* Cinema Left/Right controls (when cinema mode active) */}
            {viewMode === 'cinema' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => scrollCinema('left')}
                  className="p-2 rounded-full glass-panel hover:border-[#E50920]/40 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Scroll Left"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollCinema('right')}
                  className="p-2 rounded-full glass-panel hover:border-[#E50920]/40 text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  title="Scroll Right"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-10 scrollbar-none">
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat;
            const count =
              cat === 'All'
                ? galleryData.length
                : galleryData.filter((i) => i.category === cat).length;

            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-mono tracking-wider transition-all duration-300 flex items-center gap-2 cursor-pointer ${
                  isSelected
                    ? 'bg-[#E50920] text-white shadow-[0_0_15px_rgba(229,9,32,0.4)] font-semibold'
                    : 'glass-panel text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>{cat}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-white/5 text-zinc-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* GALLERY DISPLAY AREA */}
        {viewMode === 'grid' ? (
          /* Perfectly Aligned 3-Column Responsive Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-stretch">
            {filteredItems.map((item) => (
              <GalleryCard
                key={item.id}
                item={item}
                onClick={() => setActiveItem(item)}
              />
            ))}
          </div>
        ) : (
          /* Unique Horizontal Cinema Strip View */
          <div
            ref={cinemaScrollRef}
            className="flex items-stretch gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-zinc-800 scroll-smooth snap-x snap-mandatory"
          >
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="w-[320px] sm:w-[400px] shrink-0 snap-start"
              >
                <GalleryCard
                  item={item}
                  onClick={() => setActiveItem(item)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Interactive Lightbox Modal */}
      <LightboxModal
        item={activeItem}
        items={filteredItems}
        onClose={() => setActiveItem(null)}
        onSelect={(item) => setActiveItem(item)}
      />
    </section>
  );
};
